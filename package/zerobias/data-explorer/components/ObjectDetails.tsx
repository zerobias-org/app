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
        <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb', fontWeight: '500', color: '#374151', background: '#f9fafb' }}>
          {label}
        </td>
        <td style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
          {formatValue(value)}
        </td>
      </tr>
    );
  };

  if (!selectedObject) {
    return (
      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '3rem 0' }}>
        <p style={{ fontSize: '13px', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>Select an object from the browser to view details</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '2rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #2563eb', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '12px' }} />
          <span style={{ color: '#4b5563', fontSize: '13px', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>Loading object details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '2rem', height: '100%' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.25rem', padding: '1rem' }}>
          <p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>{error}</p>
          <button
            onClick={loadObjectDetails}
            style={{ marginTop: '0.5rem', fontSize: '13px', color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!fullObject) {
    return (
      <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '2rem', height: '100%' }}>
        <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '13px', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>No details available</p>
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
    <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(to bottom, #f9fafb, #ffffff)', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: 0, fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>{fullObject.name}</h3>
        {fullObject.description && (
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '0.25rem', marginBottom: 0, fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>{fullObject.description}</p>
        )}
      </div>

      <Tabs style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0', overflow: 'hidden', minHeight: 0 }}>
        <TabList style={{ display: 'flex', gap: 0, margin: 0, padding: '0 0.5rem', borderBottom: '2px solid #e5e7eb', background: '#f9fafb', listStyle: 'none', flexShrink: 0, height: 'auto', alignItems: 'center' }}>
          <Tab>Metadata</Tab>
          {hasCollectionClass && <Tab>Data</Tab>}
          {hasFunctionClass && <Tab>Function</Tab>}
          {fullObject.collectionSchema && <Tab>Schema</Tab>}
          {fullObject.collectionSchema && <Tab>ERD</Tab>}
        </TabList>

        {/* Metadata Tab */}
        <TabPanel style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', fontSize: '13px', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
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
          </div>
        </TabPanel>

        {/* Data Tab (for collections) */}
        {hasCollectionClass && (
          <TabPanel style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CollectionViewer objectId={fullObject.id} />
          </TabPanel>
        )}

        {/* Function Tab */}
        {hasFunctionClass && (
          <TabPanel style={{ height: '100%' }}>
            <FunctionInvoker
              objectId={fullObject.id}
              inputSchema={fullObject.inputSchema}
              outputSchema={fullObject.outputSchema}
            />
          </TabPanel>
        )}

        {/* Schema Tab */}
        {fullObject.collectionSchema && (
          <TabPanel style={{ height: '100%' }}>
            <SchemaViewer schemaJson={fullObject.collectionSchema} />
          </TabPanel>
        )}

        {/* ERD Tab */}
        {fullObject.collectionSchema && (
          <TabPanel style={{ height: '100%' }}>
            <ERDiagram objectId={fullObject.id} schemaJson={fullObject.collectionSchema} />
          </TabPanel>
        )}
      </Tabs>

      <style jsx global>{`
        /* Override global styles from styles.scss */
        .react-tabs__tab-list {
          flex-grow: 0 !important;
          justify-content: flex-start !important;
        }

        /* Remove padding from tab panels that causes shifting */
        .react-tabs__tab-panel {
          padding: 0 !important;
        }

        /* Hide non-selected panels with !important to override inline styles */
        .react-tabs__tab-panel:not(.react-tabs__tab-panel--selected) {
          display: none !important;
        }

        /* Custom Tab Styling - react-tabs overrides */
        .react-tabs__tab {
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 13px;
          font-family: var(--font-roboto), Roboto, sans-serif;
          font-weight: 500;
          color: #6b7280;
          border: none;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          background: transparent;
          transition: all 0.2s ease;
          position: relative;
          line-height: 1.2;
        }

        .react-tabs__tab:hover {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.05);
        }

        .react-tabs__tab--selected {
          color: #2563eb;
          border-bottom-color: #2563eb;
          background: white;
          font-weight: 600;
        }

        .react-tabs__tab:focus {
          outline: none;
          box-shadow: none;
        }

        .react-tabs__tab:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: -2px;
        }

        .react-tabs__tab-panel {
          display: none;
        }

        .react-tabs__tab-panel--selected {
          display: block;
        }

        /* Spinner animation */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
