"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { Table, FileJson, Filter, X } from 'lucide-react';

type ViewMode = 'table' | 'json';

type PaginationMode = 'count' | 'cursor' | 'none';

type CollectionViewerProps = {
  objectId: string;
};

export default function CollectionViewer({ objectId }: CollectionViewerProps) {
  const { dataProducerClient } = useDataExplorer();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elements, setElements] = useState<any[]>([]);
  const [filterString, setFilterString] = useState('');
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [filterAttribute, setFilterAttribute] = useState('');
  const [filterOperator, setFilterOperator] = useState('=');
  const [filterValue, setFilterValue] = useState('');

  // Pagination state - supports both count-based and cursor-based
  const [paginationMode, setPaginationMode] = useState<PaginationMode>('none');
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const [schema, setSchema] = useState<any>(null);

  // Load collection data when objectId, page, or filter changes
  useEffect(() => {
    if (objectId && dataProducerClient) {
      loadCollectionData();
    }
  }, [objectId, currentPage, pageToken, filterString, dataProducerClient]);

  const loadCollectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load collection elements with optional filter
      const filterArray = filterString ? [filterString] : undefined;
      // DataProducer API uses 1-indexed pages (per OpenAPI spec and README)
      // currentPage starts at 1 and matches the API expectation
      const result = await dataProducerClient!.getCollectionsApi()
        .getCollectionElements(objectId, currentPage, pageSize, filterArray);

      setElements(result.items || []);

      // Determine pagination mode based on what's available
      if (result.count !== undefined) {
        // Count-based pagination
        setPaginationMode('count');
        setTotalCount(result.count);
        setTotalPages(result.pageCount);
        setHasMore(currentPage < (result.pageCount || 1));
      } else if (result.pageToken !== undefined) {
        // Cursor-based pagination
        setPaginationMode('cursor');
        setNextPageToken(result.pageToken);
        setHasMore(result.pageToken !== undefined && result.pageToken !== null);
        setTotalCount(undefined);
        setTotalPages(undefined);
      } else {
        // No pagination (single page result)
        setPaginationMode('none');
        setHasMore(false);
        setTotalCount(result.items?.length);
        setTotalPages(1);
      }

      // Load object details to get schema
      const obj = await dataProducerClient!.getObjectsApi()
        .getObject(objectId);
      setSchema(obj.collectionSchema);
    } catch (err: any) {
      console.error('Failed to load collection data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractColumns = (): string[] => {
    if (elements.length === 0) return [];

    // Get all unique keys from elements
    const allKeys = new Set<string>();
    elements.forEach(element => {
      Object.keys(element).forEach(key => allKeys.add(key));
    });

    return Array.from(allKeys);
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const handlePreviousPage = () => {
    if (paginationMode === 'count' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setPageToken(undefined);
    }
    // Cursor-based pagination doesn't support going backwards easily
  };

  const handleNextPage = () => {
    if (paginationMode === 'count' && totalPages && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setPageToken(undefined);
    } else if (paginationMode === 'cursor' && hasMore && nextPageToken) {
      setPageToken(nextPageToken);
    }
  };

  const buildFilter = () => {
    if (!filterAttribute || !filterValue) {
      return;
    }

    // Build RFC4515 filter
    let filter = '';
    switch (filterOperator) {
      case '=':
        filter = `(${filterAttribute}=${filterValue})`;
        break;
      case '~=':
        filter = `(${filterAttribute}~=${filterValue})`;
        break;
      case '>=':
        filter = `(${filterAttribute}>=${filterValue})`;
        break;
      case '<=':
        filter = `(${filterAttribute}<=${filterValue})`;
        break;
      case '*':
        filter = `(${filterAttribute}=*${filterValue}*)`;
        break;
      default:
        filter = `(${filterAttribute}=${filterValue})`;
    }

    setFilterString(filter);
    setShowFilterBuilder(false);
    setCurrentPage(1); // Reset to first page
  };

  const clearFilter = () => {
    setFilterString('');
    setFilterAttribute('');
    setFilterValue('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Loading collection data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={loadCollectionData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const columns = extractColumns();

  if (elements.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <p className="text-sm text-gray-600">No data available in this collection.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem', padding: 0, minHeight: 0, height: '100%', overflow: 'hidden' }}>
      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={() => setShowFilterBuilder(!showFilterBuilder)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filter
        </button>
        {filterString && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-800 font-mono">{filterString}</span>
            <button
              onClick={clearFilter}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Builder */}
      {showFilterBuilder && (
        <div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 }}>
          <h4 className="text-sm font-semibold text-gray-700">Build Filter (RFC4515)</h4>
          <div className="grid grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Attribute"
              value={filterAttribute}
              onChange={(e) => setFilterAttribute(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
              list="column-list"
            />
            <datalist id="column-list">
              {columns.map(col => (
                <option key={col} value={col} />
              ))}
            </datalist>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value="=">Equals (=)</option>
              <option value="~=">Approx (~=)</option>
              <option value=">=">{'>'}= Greater or Equal</option>
              <option value="<=">{' <'}= Less or Equal</option>
              <option value="*">Contains (*)</option>
            </select>
            <input
              type="text"
              placeholder="Value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
              onKeyDown={(e) => e.key === 'Enter' && buildFilter()}
            />
            <button
              onClick={buildFilter}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Example: <code className="bg-white px-1 py-0.5 rounded">(name=John)</code> or <code className="bg-white px-1 py-0.5 rounded">(age{'>'}=18)</code>
          </p>
        </div>
      )}

      {/* View Toggle and Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Table className="w-4 h-4 mr-1" />
            Table
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FileJson className="w-4 h-4 mr-1" />
            JSON
          </button>
        </div>

        {/* Pagination Info */}
        <div className="text-sm text-gray-600">
          {paginationMode === 'count' && totalCount !== undefined && (
            <>Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount}</>
          )}
          {paginationMode === 'cursor' && (
            <>Showing {elements.length} items{hasMore && ' (more available)'}</>
          )}
          {paginationMode === 'none' && (
            <>Showing {elements.length} items</>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div style={{
          flex: 1,
          overflow: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          minHeight: 0,
          position: 'relative'
        }}>
          <table style={{
            fontSize: '13px',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-roboto), Roboto, sans-serif',
            width: 'auto',
            display: 'table'
          }}>
            <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                {columns.map(col => (
                  <th key={col} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap', background: '#f3f4f6' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {elements.map((element, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '0.5rem 1rem', color: '#111827', whiteSpace: 'nowrap' }}>
                      {formatCellValue(element[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON View */}
      {viewMode === 'json' && (
        <div style={{ flex: 1, overflow: 'auto', background: '#111827', color: '#4ade80', padding: '1rem', borderRadius: '0.5rem', minHeight: 0 }}>
          <pre className="text-xs font-mono whitespace-pre">
            {JSON.stringify(elements, null, 2)}
          </pre>
        </div>
      )}

      {/* Pagination Controls */}
      {paginationMode === 'count' && totalPages && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              currentPage >= totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Cursor-based Pagination Controls */}
      {paginationMode === 'cursor' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              !hasMore
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Load More
          </button>
          {!hasMore && (
            <span className="text-sm text-gray-500">No more items</span>
          )}
        </div>
      )}
    </div>
  );
}
