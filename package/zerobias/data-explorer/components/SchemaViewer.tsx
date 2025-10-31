"use client"
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Key, List } from 'lucide-react';

type SchemaProperty = {
  name: string;
  description?: string;
  required?: boolean;
  multi?: boolean;
  primaryKey?: boolean;
  dataType?: string;
  format?: string;
  references?: string;
};

type Schema = {
  id?: string;
  dataTypes?: string[];
  properties?: SchemaProperty[];
};

type SchemaViewerProps = {
  schemaJson?: string;
};

export default function SchemaViewer({ schemaJson }: SchemaViewerProps) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schemaJson) {
      try {
        const parsed = JSON.parse(schemaJson);
        setSchema(parsed);
        setError(null);
      } catch (err: any) {
        console.error('Failed to parse schema:', err);
        setError(`Invalid schema format: ${err.message}`);
      }
    }
  }, [schemaJson]);

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
            {schemaJson}
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

  return (
    <div className="space-y-4">
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
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Property</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Data Type</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Flags</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((prop, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {/* Property Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {prop.primaryKey && (
                          <Key className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                        )}
                        <span className="font-mono text-gray-900">{prop.name}</span>
                      </div>
                    </td>

                    {/* Data Type */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                          {prop.dataType || 'unknown'}
                        </span>
                        {prop.format && (
                          <span className="inline-block ml-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                            {prop.format}
                          </span>
                        )}
                        {prop.references && (
                          <div className="text-xs text-gray-500">
                            → {prop.references}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Flags */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        {prop.required ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                        {prop.multi && (
                          <List className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 text-gray-700">
                      {prop.description || <span className="text-gray-400 italic">No description</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <details className="p-3 bg-gray-50 border border-gray-200 rounded">
        <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
          View Raw Schema JSON
        </summary>
        <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
          <pre className="text-xs font-mono whitespace-pre">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
