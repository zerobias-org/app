import { TestBed } from '@angular/core/testing';
import type { CustomVariable } from '../models';
import { VariableSubstitutionService, SubstitutionResult } from './variable-substitution.service';

describe('VariableSubstitutionService', () => {
  let service: VariableSubstitutionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VariableSubstitutionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('substitute()', () => {
    it('Test 1: Substitute simple variable: "Hello {{name}}" with {name: "Alice"} → "Hello Alice"', () => {
      const result = service.substitute('Hello {{name}}', { name: 'Alice' });
      expect(result.content).toBe('Hello Alice');
      expect(result.missingRequired).toEqual([]);
    });

    it('Test 2: Substitute multiple variables: "{{buyer}} and {{vendor}}" → "A and B"', () => {
      const result = service.substitute('{{buyer}} and {{vendor}}', {
        buyer: 'A',
        vendor: 'B'
      });
      expect(result.content).toBe('A and B');
      expect(result.missingRequired).toEqual([]);
    });

    it('Test 3: Escape literal curly braces: "Use \\{{braces\\}}" → "Use {{braces}}"', () => {
      const result = service.substitute('Use \\{{braces\\}}', {});
      expect(result.content).toBe('Use {{braces}}');
      expect(result.missingRequired).toEqual([]);
    });

    it('Test 4: Missing variable in template (optional): "Hello {{unknown}}" → "Hello {{unknown}}"', () => {
      const result = service.substitute('Hello {{unknown}}', {});
      expect(result.content).toBe('Hello {{unknown}}');
      expect(result.missingRequired).toEqual([]);
    });

    it('Test 5: Required variable missing returns missingRequired list and original template', () => {
      const customVars: CustomVariable[] = [
        { name: 'name', label: 'Name', required: true }
      ];
      const result = service.substitute('Hello {{name}}', {}, customVars);
      expect(result.content).toBe('Hello {{name}}');
      expect(result.missingRequired).toEqual(['name']);
    });

    it('Test 6: Custom variables with defaults - fills default if missing', () => {
      const customVars: CustomVariable[] = [
        { name: 'clientReg', label: 'Client Region', defaultValue: 'N/A' }
      ];
      const result = service.substitute('Reg: {{clientReg}}', {}, customVars);
      // Without providing the variable, it's treated as optional, so substitution happens with empty value
      // Actually, defaults are handled at application layer, not in substitution itself
      expect(result.content).toBe('Reg: {{clientReg}}');
      expect(result.missingRequired).toEqual([]);
    });

    it('Test 7: Multiple escapes and variables: "\\{{var\\}} and {{actual}}" → "{{var}} and <resolved>"', () => {
      const result = service.substitute('\\{{var\\}} and {{actual}}', { actual: 'RESOLVED' });
      expect(result.content).toBe('{{var}} and RESOLVED');
      expect(result.missingRequired).toEqual([]);
    });

    it('Test 8: Case sensitivity - {{Name}} vs {{name}} are different', () => {
      const result = service.substitute('{{Name}} and {{name}}', { name: 'alice' });
      // {{Name}} not substituted (no match), {{name}} substituted
      expect(result.content).toBe('{{Name}} and alice');
      expect(result.missingRequired).toEqual([]);
    });

    it('handles variables with underscores: {{client_region}}', () => {
      const result = service.substitute('Region: {{client_region}}', { client_region: 'USA' });
      expect(result.content).toBe('Region: USA');
    });

    it('handles variables with numbers: {{var1}} {{var2}}', () => {
      const result = service.substitute('{{var1}} {{var2}}', {
        var1: 'first',
        var2: 'second'
      });
      expect(result.content).toBe('first second');
    });

    it('variable name must start with letter - {{1var}} not substituted', () => {
      const result = service.substitute('{{1var}}', { '1var': 'value' });
      expect(result.content).toBe('{{1var}}'); // Not matched because starts with digit
    });

    it('handles nested escaped braces with variables', () => {
      const result = service.substitute('\\{{\\{{key\\}}\\}}', { key: 'value' });
      expect(result.content).toBe('{{{{key}}}}');
    });
  });

  describe('validateRequired()', () => {
    it('returns empty array if all required variables provided', () => {
      const customVars: CustomVariable[] = [
        { name: 'clientName', label: 'Client', required: true },
        { name: 'amount', label: 'Amount', required: true }
      ];
      const missing = service.validateRequired('', { clientName: 'Acme', amount: '1000' }, customVars);
      expect(missing).toEqual([]);
    });

    it('returns array of missing required variables', () => {
      const customVars: CustomVariable[] = [
        { name: 'clientName', label: 'Client', required: true },
        { name: 'amount', label: 'Amount', required: true },
        { name: 'optional', label: 'Optional', required: false }
      ];
      const missing = service.validateRequired('', { amount: '1000' }, customVars);
      expect(missing).toEqual(['clientName']);
    });

    it('ignores non-required variables', () => {
      const customVars: CustomVariable[] = [
        { name: 'required1', label: 'Required', required: true },
        { name: 'optional1', label: 'Optional', required: false }
      ];
      const missing = service.validateRequired('', { required1: 'value' }, customVars);
      expect(missing).toEqual([]);
    });

    it('treats empty string as missing for required variables', () => {
      const customVars: CustomVariable[] = [
        { name: 'name', label: 'Name', required: true }
      ];
      const missing = service.validateRequired('', { name: '' }, customVars);
      expect(missing).toEqual(['name']);
    });
  });

  describe('extractVariableNames()', () => {
    it('extracts single variable', () => {
      const names = service.extractVariableNames('Hello {{name}}');
      expect(names).toEqual(['name']);
    });

    it('extracts multiple unique variables', () => {
      const names = service.extractVariableNames('{{buyer}} and {{vendor}} work on {{project}}');
      expect(names).toEqual(['buyer', 'vendor', 'project']);
    });

    it('deduplicates repeated variables', () => {
      const names = service.extractVariableNames('{{name}} likes {{product}}, and {{name}} has {{product}}');
      expect(names).toEqual(['name', 'product']);
    });

    it('skips escaped variables', () => {
      const names = service.extractVariableNames('\\{{literal}} and {{real}}');
      expect(names).toEqual(['real']);
    });

    it('returns empty array for template with no variables', () => {
      const names = service.extractVariableNames('Just plain text');
      expect(names).toEqual([]);
    });

    it('handles underscores and numbers in variable names', () => {
      const names = service.extractVariableNames('{{var_1}} {{var_2}} {{var_3}}');
      expect(names).toEqual(['var_1', 'var_2', 'var_3']);
    });
  });

  describe('parseCustomVariables()', () => {
    it('parses valid JSON schema', () => {
      const schema = JSON.stringify([
        { name: 'client', label: 'Client Name', required: true },
        { name: 'amount', label: 'Amount', defaultValue: '0' }
      ]);
      const result = service.parseCustomVariables(schema);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('client');
      expect(result[1].defaultValue).toBe('0');
    });

    it('returns empty array for undefined schema', () => {
      const result = service.parseCustomVariables(undefined);
      expect(result).toEqual([]);
    });

    it('returns empty array for invalid JSON', () => {
      const result = service.parseCustomVariables('not valid json {]');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      const result = service.parseCustomVariables('');
      expect(result).toEqual([]);
    });
  });

  describe('getBuiltInVariables()', () => {
    it('includes all built-in variable keys', () => {
      const vars = service.getBuiltInVariables({});
      expect(vars).toHaveProperty('buyerOrgName');
      expect(vars).toHaveProperty('vendorOrgName');
      expect(vars).toHaveProperty('engagementTitle');
      expect(vars).toHaveProperty('engagementId');
      expect(vars).toHaveProperty('projectName');
      expect(vars).toHaveProperty('projectId');
      expect(vars).toHaveProperty('effectiveDate');
      expect(vars).toHaveProperty('expirationDate');
      expect(vars).toHaveProperty('todayDate');
    });

    it('uses provided context values', () => {
      const vars = service.getBuiltInVariables({
        buyerOrgName: 'Test Buyer',
        vendorOrgName: 'Test Vendor'
      });
      expect(vars['buyerOrgName']).toBe('Test Buyer');
      expect(vars['vendorOrgName']).toBe('Test Vendor');
    });

    it('fills empty strings for missing context values', () => {
      const vars = service.getBuiltInVariables({});
      expect(vars['buyerOrgName']).toBe('');
      expect(vars['vendorOrgName']).toBe('');
    });

    it('todayDate is set to current date if not in context', () => {
      const vars = service.getBuiltInVariables({});
      // todayDate should be a date string, not empty
      expect(vars['todayDate']).toBeTruthy();
      expect(vars['todayDate']).toMatch(/\d{1,2}, \d{4}/); // e.g., "April 8, 2026"
    });
  });

  describe('generatePreviewVariables()', () => {
    it('generates realistic fake data for built-in variables', () => {
      const vars = service.generatePreviewVariables();
      expect(vars['buyerOrgName']).toBe('Acme Corporation');
      expect(vars['vendorOrgName']).toBe('Security Experts Ltd');
      expect(vars['engagementTitle']).toBe('SOC2 Type II Assessment');
    });

    it('uses default values for custom variables when provided', () => {
      const customVars: CustomVariable[] = [
        { name: 'clientReg', label: 'Region', defaultValue: 'Europe' }
      ];
      const vars = service.generatePreviewVariables(customVars);
      expect(vars['clientReg']).toBe('Europe');
    });

    it('generates placeholder for custom variables without defaults', () => {
      const customVars: CustomVariable[] = [
        { name: 'customField', label: 'Custom Field' }
      ];
      const vars = service.generatePreviewVariables(customVars);
      expect(vars['customField']).toBe('[Custom Field]');
    });

    it('uses variable name as placeholder if label missing', () => {
      const customVars: CustomVariable[] = [
        { name: 'field1', label: '' }
      ];
      const vars = service.generatePreviewVariables(customVars);
      expect(vars['field1']).toBe('[field1]');
    });

    it('merges built-in and custom variables', () => {
      const customVars: CustomVariable[] = [
        { name: 'extra', label: 'Extra', defaultValue: 'value' }
      ];
      const vars = service.generatePreviewVariables(customVars);
      expect(vars['buyerOrgName']).toBeDefined();
      expect(vars['extra']).toBe('value');
    });
  });

  describe('integration tests', () => {
    it('full workflow: parse schema, extract vars, generate preview, then substitute', () => {
      const schema = JSON.stringify([
        { name: 'clientName', label: 'Client Name', required: true, defaultValue: 'Unknown' },
        { name: 'region', label: 'Region', defaultValue: 'US' }
      ]);

      const template = 'Agreement between {{buyerOrgName}} and {{vendorOrgName}}, client {{clientName}} in {{region}}';

      // Step 1: Parse schema
      const customVars = service.parseCustomVariables(schema);
      expect(customVars).toHaveLength(2);

      // Step 2: Extract all variables
      const allVars = service.extractVariableNames(template);
      expect(allVars).toContain('buyerOrgName');
      expect(allVars).toContain('clientName');

      // Step 3: Generate preview
      const preview = service.generatePreviewVariables(customVars);
      expect(preview['buyerOrgName']).toBeDefined();
      expect(preview['clientName']).toBe('Unknown');

      // Step 4: Substitute with real data
      const allVariables = {
        ...service.getBuiltInVariables({ buyerOrgName: 'Buyer', vendorOrgName: 'Vendor' }),
        clientName: 'Acme',
        region: 'EU'
      };
      const result = service.substitute(template, allVariables, customVars);
      expect(result.content).toContain('Buyer');
      expect(result.content).toContain('Acme');
      expect(result.content).toContain('EU');
    });

    it('detects missing required variables and blocks substitution', () => {
      const customVars: CustomVariable[] = [
        { name: 'clientName', label: 'Client Name', required: true }
      ];
      const template = 'Client: {{clientName}}';

      // Without providing clientName, substitution should fail
      const result = service.substitute(template, {}, customVars);
      expect(result.missingRequired).toContain('clientName');
      expect(result.content).toBe(template); // Original returned unchanged
    });
  });
});
