"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import CollectionViewer from './CollectionViewer';
import FunctionInvoker from './FunctionInvoker';
import SchemaViewer from './SchemaViewer';
import ERDiagram from './ERDiagram';

export default function ObjectDetails() {
  const { selectedObject, dataProducerClient } = useDataExplorer();
  const [loading, setLoading] = useState(false);
  const [fullObject, setFullObject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load full object details when selection changes
  useEffect(() => {
    if (selectedObject && dataProducerClient) {
      loadObjectDetails();
    } else {
      setFullObject(null);
    }
  }, [selectedObject?.id, dataProducerClient]);

  const loadObjectDetails = async () => {
    if (!selectedObject) return;

    setLoading(true);
    setError(null);
    try {
      const obj = await dataProducerClient!.getObjectsApi().getObject(selectedObject.id);
      setFullObject(obj);
    } catch (err: any) {
      console.error('Failed to load object details:', err);
      setError(`Failed to load details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      // Handle enum values
      return value.map(v => {
        if (typeof v === 'string') return v;
        return (v as any).value?.toString() || v.toString();
      }).join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value.toString();
  };

  const renderMetadataRow = (label: string, value: any, key: string) => {
    if (value === undefined || value === null) return null;

    return (
      <tr key={key}>
        <td className="py-2 px-4 border-b border-gray-200 font-medium text-gray-700 bg-gray-50">
          {label}
        </td>
        <td className="py-2 px-4 border-b border-gray-200 text-gray-900">
          {formatValue(value)}
        </td>
      </tr>
    );
  };

  if (!selectedObject) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <p className="text-gray-500 text-center">
          Select an object from the browser to view details
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Loading object details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadObjectDetails}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!fullObject) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <p className="text-gray-500 text-center">No details available</p>
      </div>
    );
  }

  const hasCollectionClass = fullObject.objectClass?.some((c: any) => {
    const val = typeof c === 'string' ? c : c.value?.toString();
    return val === 'collection';
  });

  const hasFunctionClass = fullObject.objectClass?.some((c: any) => {
    const val = typeof c === 'string' ? c : c.value?.toString();
    return val === 'function';
  });

  return (
    <div className="object-details-container">
      <div className="object-header">
        <h3 className="object-title">{fullObject.name}</h3>
        {fullObject.description && (
          <p className="object-description">{fullObject.description}</p>
        )}
      </div>

      <Tabs className="custom-tabs">
        <TabList>
          <Tab>Metadata</Tab>
          {hasCollectionClass && <Tab>Data</Tab>}
          {hasFunctionClass && <Tab>Function</Tab>}
          {fullObject.collectionSchema && <Tab>Schema</Tab>}
          {fullObject.collectionSchema && <Tab>ERD</Tab>}
        </TabList>

        {/* Metadata Tab */}
        <TabPanel>
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                {renderMetadataRow('ID', fullObject.id, 'id')}
                {renderMetadataRow('Name', fullObject.name, 'name')}
                {renderMetadataRow('Description', fullObject.description, 'description')}
                {renderMetadataRow('Object Classes', fullObject.objectClass, 'objectClass')}
                {renderMetadataRow('Path', fullObject.path, 'path')}
                {renderMetadataRow('Tags', fullObject.tags, 'tags')}
                {renderMetadataRow('Created', fullObject.created, 'created')}
                {renderMetadataRow('Modified', fullObject.modified, 'modified')}
                {renderMetadataRow('ETag', fullObject.etag, 'etag')}
                {renderMetadataRow('Version ID', fullObject.versionId, 'versionId')}

                {/* Collection-specific */}
                {fullObject.collectionSchema && (
                  <>
                    {renderMetadataRow('Collection Schema', fullObject.collectionSchema, 'collectionSchema')}
                    {renderMetadataRow('Collection Size', fullObject.collectionSize, 'collectionSize')}
                  </>
                )}

                {/* Function-specific */}
                {fullObject.inputSchema && (
                  <>
                    {renderMetadataRow('Input Schema', fullObject.inputSchema, 'inputSchema')}
                    {renderMetadataRow('Output Schema', fullObject.outputSchema, 'outputSchema')}
                  </>
                )}

                {/* Document-specific */}
                {fullObject.documentSchema && renderMetadataRow('Document Schema', fullObject.documentSchema, 'documentSchema')}

                {/* Binary-specific */}
                {fullObject.mimeType && (
                  <>
                    {renderMetadataRow('MIME Type', fullObject.mimeType, 'mimeType')}
                    {renderMetadataRow('File Name', fullObject.fileName, 'fileName')}
                    {renderMetadataRow('Size', fullObject.size ? `${fullObject.size} bytes` : null, 'size')}
                  </>
                )}

                {/* HTTP-specific */}
                {fullObject.httpMethod && (
                  <>
                    {renderMetadataRow('HTTP Method', fullObject.httpMethod, 'httpMethod')}
                    {renderMetadataRow('HTTP Path', fullObject.httpPath, 'httpPath')}
                    {renderMetadataRow('Timeout', fullObject.timeout ? `${fullObject.timeout}ms` : null, 'timeout')}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </TabPanel>

        {/* Data Tab (for collections) */}
        {hasCollectionClass && (
          <TabPanel>
            <div className="p-4">
              <CollectionViewer objectId={fullObject.id} />
            </div>
          </TabPanel>
        )}

        {/* Function Tab */}
        {hasFunctionClass && (
          <TabPanel>
            <div className="p-4">
              <FunctionInvoker
                objectId={fullObject.id}
                inputSchema={fullObject.inputSchema}
                outputSchema={fullObject.outputSchema}
              />
            </div>
          </TabPanel>
        )}

        {/* Schema Tab */}
        {fullObject.collectionSchema && (
          <TabPanel>
            <div className="p-4">
              <SchemaViewer schemaJson={fullObject.collectionSchema} />
            </div>
          </TabPanel>
        )}

        {/* ERD Tab */}
        {fullObject.collectionSchema && (
          <TabPanel>
            <div className="p-4">
              <ERDiagram objectId={fullObject.id} schemaJson={fullObject.collectionSchema} />
            </div>
          </TabPanel>
        )}
      </Tabs>

      <style jsx global>{`
        .object-details-container {
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .object-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(to bottom, #f9fafb, #ffffff);
        }

        .object-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .object-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        /* Custom Tabs Styling */
        .custom-tabs {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .custom-tabs .react-tabs__tab-list {
          display: flex;
          gap: 0;
          margin: 0;
          padding: 0 1rem;
          border-bottom: 2px solid #e5e7eb;
          background: #f9fafb;
          list-style: none;
        }

        .custom-tabs .react-tabs__tab {
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          background: transparent;
          transition: all 0.2s;
          position: relative;
        }

        .custom-tabs .react-tabs__tab:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .custom-tabs .react-tabs__tab--selected {
          color: #667eea;
          border-bottom-color: #667eea;
          background: white;
        }

        .custom-tabs .react-tabs__tab:focus {
          outline: none;
          box-shadow: none;
        }

        .custom-tabs .react-tabs__tab:focus-visible {
          outline: 2px solid #667eea;
          outline-offset: -2px;
        }

        .custom-tabs .react-tabs__tab-panel {
          display: none;
        }

        .custom-tabs .react-tabs__tab-panel--selected {
          display: block;
        }
      `}</style>
    </div>
  );
}
