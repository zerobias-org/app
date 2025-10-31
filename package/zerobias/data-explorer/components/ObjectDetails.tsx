"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export default function ObjectDetails() {
  const { selectedObject, dataProducerService } = useDataExplorer();
  const [loading, setLoading] = useState(false);
  const [fullObject, setFullObject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load full object details when selection changes
  useEffect(() => {
    if (selectedObject && dataProducerService?.enable) {
      loadObjectDetails();
    } else {
      setFullObject(null);
    }
  }, [selectedObject?.id, dataProducerService?.enable]);

  const loadObjectDetails = async () => {
    if (!selectedObject) return;

    setLoading(true);
    setError(null);
    try {
      const obj = await dataProducerService!.client!.getObjectsApi().getObject(selectedObject.id);
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
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-bold text-lg text-gray-800">{fullObject.name}</h3>
        {fullObject.description && (
          <p className="text-sm text-gray-600 mt-1">{fullObject.description}</p>
        )}
      </div>

      <Tabs>
        <TabList>
          <Tab>Metadata</Tab>
          {hasCollectionClass && <Tab>Data</Tab>}
          {hasFunctionClass && <Tab>Function</Tab>}
          {fullObject.collectionSchema && <Tab>Schema</Tab>}
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
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                <p className="text-sm text-blue-800">
                  Collection data viewer will be implemented next.
                  <br />
                  This will show paginated table/JSON view of collection elements.
                </p>
              </div>
            </div>
          </TabPanel>
        )}

        {/* Function Tab */}
        {hasFunctionClass && (
          <TabPanel>
            <div className="p-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
                <p className="text-sm text-yellow-800">
                  Function invoker will be implemented next.
                  <br />
                  This will allow executing the function with parameters and viewing results.
                </p>
              </div>
            </div>
          </TabPanel>
        )}

        {/* Schema Tab */}
        {fullObject.collectionSchema && (
          <TabPanel>
            <div className="p-4">
              <div className="bg-green-50 border-l-4 border-green-600 p-4">
                <p className="text-sm text-green-800">
                  Schema viewer will be implemented next.
                  <br />
                  This will display the collection schema properties and types.
                </p>
              </div>
            </div>
          </TabPanel>
        )}
      </Tabs>
    </div>
  );
}
