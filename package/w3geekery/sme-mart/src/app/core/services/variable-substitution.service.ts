import { Injectable } from '@angular/core';
import type { CustomVariable } from '../models';

export interface SubstitutionResult {
  content: string;
  missingRequired: string[];
}

/**
 * VariableSubstitutionService
 *
 * Handles template variable substitution with escaping and validation.
 *
 * Variable Syntax:
 * - {{varName}} — substituted with value from variables record
 * - \{{ — escaped literal {{ (renders as {{)
 * - \}} — escaped literal }} (renders as }})
 *
 * Variable Names:
 * - Must start with a letter (a-zA-Z)
 * - Can contain letters, digits, underscores (a-zA-Z0-9_)
 * - Case-sensitive: {{name}} ≠ {{Name}}
 *
 * Variable Types:
 * - Built-in: buyerOrgName, vendorOrgName, engagementTitle, engagementId, etc. (automatic)
 * - Custom: Defined in template schema with optional defaults and required flags
 */
@Injectable({ providedIn: 'root' })
export class VariableSubstitutionService {
  /**
   * Regex pattern: match {{varName}} not preceded by backslash
   * Pattern: [a-zA-Z][a-zA-Z0-9_]* (starts with letter, alphanumeric + underscore)
   */
  private readonly VARIABLE_PATTERN = /(?<!\\)\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;

  /**
   * Built-in variables available for all template substitutions.
   * Maps variable name to value at substitution time.
   */
  getBuiltInVariables(context: {
    buyerOrgName?: string;
    vendorOrgName?: string;
    engagementTitle?: string;
    engagementId?: string;
    projectName?: string;
    projectId?: string;
    effectiveDate?: string;
    expirationDate?: string;
  }): Record<string, string> {
    return {
      buyerOrgName: context.buyerOrgName ?? '',
      vendorOrgName: context.vendorOrgName ?? '',
      engagementTitle: context.engagementTitle ?? '',
      engagementId: context.engagementId ?? '',
      projectName: context.projectName ?? '',
      projectId: context.projectId ?? '',
      effectiveDate: context.effectiveDate ?? '',
      expirationDate: context.expirationDate ?? '',
      todayDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }

  /**
   * Parse custom variable schema JSON and return as array.
   * Returns empty array if schema is invalid or missing.
   */
  parseCustomVariables(schema: string | undefined): CustomVariable[] {
    if (!schema) return [];
    try {
      return JSON.parse(schema);
    } catch {
      return [];
    }
  }

  /**
   * Extract all variable names used in template (built-in and custom).
   * Returns unique list of variable names (no duplicates).
   * Skips escaped variables (\{{ not matched).
   */
  extractVariableNames(template: string): string[] {
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    // Reset lastIndex for global regex
    this.VARIABLE_PATTERN.lastIndex = 0;

    while ((match = this.VARIABLE_PATTERN.exec(template)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }

    return matches;
  }

  /**
   * Substitute variables in template with provided values.
   * Supports escaping: \{{ renders as literal {{
   *
   * If required custom variables are missing, returns original template
   * with missingRequired array populated (blocks instantiation).
   *
   * Returns { content, missingRequired } indicating if required vars are missing.
   */
  substitute(
    template: string,
    variables: Record<string, string>,
    customVariables?: CustomVariable[]
  ): SubstitutionResult {
    // Determine required custom variables
    const requiredCustomVars = customVariables?.filter(v => v.required) ?? [];
    const missingRequired: string[] = [];

    // Check each required custom variable is present
    requiredCustomVars.forEach(custom => {
      if (!variables[custom.name]) {
        missingRequired.push(custom.name);
      }
    });

    if (missingRequired.length > 0) {
      // Return original template with list of missing required vars
      return { content: template, missingRequired };
    }

    // Perform substitution
    let content = template;

    // Replace variables: {{varName}} → variables[varName] or leave as-is if not found
    content = content.replace(this.VARIABLE_PATTERN, (match, varName) => {
      return variables[varName] ?? match;
    });

    // Unescape: \{{ → {{, \}} → }}
    content = content.replace(/\\(\{\{|\}\})/g, '$1');

    return { content, missingRequired: [] };
  }

  /**
   * Validate that all required variables (custom) are provided.
   * Returns array of missing required variable names.
   *
   * Treats empty strings as missing for required variables.
   */
  validateRequired(
    template: string,
    variables: Record<string, string>,
    customVariables?: CustomVariable[]
  ): string[] {
    const requiredCustom = customVariables?.filter(v => v.required) ?? [];
    const missing: string[] = [];

    requiredCustom.forEach(custom => {
      if (!variables[custom.name] || variables[custom.name].trim() === '') {
        missing.push(custom.name);
      }
    });

    return missing;
  }

  /**
   * For preview mode: generate sample/fake data for all variables.
   * Built-in vars get realistic fake values; custom vars get label or placeholder.
   * This is used for showing templates in read-only preview mode.
   */
  generatePreviewVariables(customVariables?: CustomVariable[]): Record<string, string> {
    const builtIn = {
      buyerOrgName: 'Acme Corporation',
      vendorOrgName: 'Security Experts Ltd',
      engagementTitle: 'SOC2 Type II Assessment',
      engagementId: '550e8400-e29b-41d4-a716-446655440000',
      projectName: 'Phase 1 Assessment',
      projectId: 'a8aabc00-32b1-423d-8e80-446655440001',
      effectiveDate: 'April 8, 2026',
      expirationDate: 'December 31, 2026',
      todayDate: 'April 8, 2026'
    };

    const custom: Record<string, string> = {};
    customVariables?.forEach(v => {
      if (v.defaultValue) {
        custom[v.name] = v.defaultValue;
      } else {
        custom[v.name] = `[${v.label || v.name}]`;
      }
    });

    return { ...builtIn, ...custom };
  }
}
