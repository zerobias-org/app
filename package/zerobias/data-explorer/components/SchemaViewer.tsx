"use client"
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Key, List } from 'lucide-react';
import { useDataExplorer } from '@/context/DataExplorerContext';

type DataType = {
  name: string;
  jsonType: string;
  isEnum?: boolean;
  description?: string;
  examples?: any[];
  htmlInput?: string;
};

type SchemaProperty = {
  name: string;
  description?: string;
  required?: boolean;
  multi?: boolean;
  primaryKey?: boolean;
  dataType: string;  // References DataType.name
  format?: string;
  references?: {
    objectId?: string;  // Actual field from backend (not schemaId)
    property?: string;   // Actual field from backend (not propertyName)
  };
};

type Schema = {
  id?: string;
  dataTypes?: DataType[];  // Array of DataType objects
  properties?: SchemaProperty[];
};

type SchemaViewerProps = {
  schemaJson?: string | object;
};

export default function SchemaViewer({ schemaJson }: SchemaViewerProps) {
  const { dataProducerClient } = useDataExplorer();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [_originalSchemaId, setOriginalSchemaId] = useState<string | null>(null);
  const [expandedEnums, setExpandedEnums] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadSchema = async () => {
      if (!schemaJson) {
        setSchema(null);
        setOriginalSchemaId(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if schemaJson is a schema ID token (string starting with "schema:")
        if (typeof schemaJson === 'string' && schemaJson.startsWith('schema:')) {
          // It's a schema ID - fetch via getSchema API
          if (!dataProducerClient) {
            setError('DataProducer client not available');
            return;
          }

          console.log('Fetching schema by ID:', schemaJson);
          // Store the original schema ID to display (backend may return mutilated version)
          setOriginalSchemaId(schemaJson);
          const schemaResponse = await dataProducerClient.getSchemasApi().getSchema(schemaJson);

          // Convert API response to local Schema type (handle EnumValue types)
          const convertedSchema: Schema = {
            id: schemaResponse.id,
            dataTypes: schemaResponse.dataTypes?.map((dt: any) => ({
              name: dt.name,
              jsonType: dt.jsonType?.toString() || dt.jsonType,
              isEnum: dt.isEnum,
              description: dt.description,
              examples: dt.examples,
              htmlInput: dt.htmlInput?.toString() || dt.htmlInput,
            })),
            properties: schemaResponse.properties?.map((prop: any) => ({
              name: prop.name,
              description: prop.description,
              required: prop.required,
              multi: prop.multi,
              primaryKey: prop.primaryKey,
              dataType: prop.dataType,
              format: prop.format,
              references: prop.references,
            })),
          };

          setSchema(convertedSchema);
        } else {
          // It's a full schema object or JSON string
          let parsed: any;
          if (typeof schemaJson === 'string') {
            parsed = JSON.parse(schemaJson);
          } else {
            parsed = schemaJson;
          }
          setOriginalSchemaId(null);
          setSchema(parsed);
        }
      } catch (err: any) {
        console.error('Failed to load schema:', err);
        setError(`Failed to load schema: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadSchema();
  }, [schemaJson, dataProducerClient]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-600">Loading schema...</p>
      </div>
    );
  }

  if (!schemaJson) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-600">No schema available for this object.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-sm text-red-700">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer">Show raw schema</summary>
          <pre className="mt-2 text-xs text-red-600 overflow-x-auto bg-red-100 p-2 rounded">
            {typeof schemaJson === 'string' ? schemaJson : JSON.stringify(schemaJson, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-600">Loading schema...</p>
      </div>
    );
  }

  const properties = schema.properties || [];
  const primaryKeyProps = properties.filter(p => p.primaryKey);
  const requiredProps = properties.filter(p => p.required);

  // Build dataTypes lookup map
  const dataTypesMap = new Map<string, DataType>();
  if (schema.dataTypes) {
    schema.dataTypes.forEach(dt => {
      dataTypesMap.set(dt.name, dt);
    });
  }

  // Helper to get DataType for a property
  const getDataType = (prop: SchemaProperty): DataType | undefined => {
    return dataTypesMap.get(prop.dataType);
  };

  const toggleEnumExpanded = (propName: string) => {
    setExpandedEnums(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propName)) {
        newSet.delete(propName);
      } else {
        newSet.add(propName);
      }
      return newSet;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem', padding: '0.5rem', overflow: 'auto', minHeight: 0 }}>
      {/* Schema Metadata */}
      {schema.id && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-600 font-semibold">Schema ID</p>
          <p className="text-sm text-blue-900 font-mono">{schema.id}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Total Properties</p>
          <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
        </div>
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-xs text-green-700 mb-1">Primary Keys</p>
          <p className="text-2xl font-bold text-green-900">{primaryKeyProps.length}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded border border-amber-200">
          <p className="text-xs text-amber-700 mb-1">Required</p>
          <p className="text-2xl font-bold text-amber-900">{requiredProps.length}</p>
        </div>
      </div>

      {/* Properties Table */}
      {properties.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
          <table style={{ width: '100%', fontSize: '13px', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
            <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Property</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Data Type</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Flags</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Description</th>
              </tr>
            </thead>
              <tbody>
                {properties.map((prop, idx) => {
                  const dataType = getDataType(prop);
                  return (
                  <tr key={idx} style={{ borderBottom: idx < properties.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    {/* Property Name */}
                    <td style={{ padding: '4px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {prop.primaryKey && (
                          <Key style={{ width: '14px', height: '14px', color: '#2563eb', marginRight: '6px', flexShrink: 0 }} />
                        )}
                        <span style={{ fontFamily: 'monospace', color: '#111827' }}>{prop.name}</span>
                      </div>
                    </td>

                    {/* Data Type */}
                    <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', padding: '1px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace' }}>
                          {prop.dataType}
                        </span>
                        {prop.format && (
                          <span style={{ display: 'inline-block', padding: '1px 6px', background: '#f3f4f6', color: '#374151', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace' }}>
                            {prop.format}
                          </span>
                        )}
                        {dataType && dataType.isEnum && dataType.examples && dataType.examples.length > 0 && (
                          <button
                            onClick={() => toggleEnumExpanded(prop.name)}
                            style={{
                              padding: '2px 6px',
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '3px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              color: '#374151',
                              fontFamily: 'var(--font-roboto), Roboto, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <svg style={{ width: '10px', height: '10px', transform: expandedEnums.has(prop.name) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} viewBox="0 0 10 10" fill="currentColor">
                              <path d="M2 1l6 4-6 4z"/>
                            </svg>
                            {dataType.examples!.length} options
                          </button>
                        )}
                      </div>
                      {/* Expanded enum list - separate row below */}
                      {dataType && dataType.isEnum && expandedEnums.has(prop.name) && dataType.examples && (
                        <div style={{
                          marginTop: '4px',
                          padding: '6px',
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '3px',
                          maxHeight: '200px',
                          overflow: 'auto',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          whiteSpace: 'normal'
                        }}>
                          {dataType.examples.map((example, exIdx) => (
                            <div key={exIdx} style={{ padding: '2px 0', color: '#374151' }}>
                              {typeof example === 'string' ? example : JSON.stringify(example)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Flags */}
                    <td style={{ padding: '4px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {prop.required ? (
                          <CheckCircle2 style={{ width: '14px', height: '14px', color: '#16a34a' }} />
                        ) : (
                          <Circle style={{ width: '14px', height: '14px', color: '#d1d5db' }} />
                        )}
                        {prop.multi && (
                          <List style={{ width: '14px', height: '14px', color: '#a855f7' }} />
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td style={{ padding: '4px 8px', color: '#374151' }}>
                      {prop.description || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No description</span>}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
        <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <Key className="w-3 h-3 text-blue-600 mr-1" />
            <span>Primary Key</span>
          </div>
          <div className="flex items-center">
            <CheckCircle2 className="w-3 h-3 text-green-600 mr-1" />
            <span>Required Property</span>
          </div>
          <div className="flex items-center">
            <Circle className="w-3 h-3 text-gray-300 mr-1" />
            <span>Optional Property</span>
          </div>
          <div className="flex items-center">
            <List className="w-3 h-3 text-purple-600 mr-1" />
            <span>Multi-valued (Array)</span>
          </div>
        </div>
      </div>

      {/* Raw Schema Viewer (collapsed) */}
      <details style={{ padding: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
        <summary style={{ fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
          View Raw Schema JSON
        </summary>
        <div style={{ marginTop: '0.75rem', background: '#111827', color: '#4ade80', padding: '0.75rem', borderRadius: '0.375rem' }}>
          <pre style={{ fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'pre', margin: 0 }}>
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
