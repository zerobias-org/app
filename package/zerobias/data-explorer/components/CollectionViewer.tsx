"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { Table, FileJson } from 'lucide-react';

type ViewMode = 'table' | 'json';

type PaginationMode = 'count' | 'cursor' | 'none';

type CollectionViewerProps = {
  objectId: string;
};

export default function CollectionViewer({ objectId }: CollectionViewerProps) {
  const { dataProducerService } = useDataExplorer();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elements, setElements] = useState<any[]>([]);

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

  // Load collection data when objectId or page changes
  useEffect(() => {
    if (objectId && dataProducerService?.enable) {
      loadCollectionData();
    }
  }, [objectId, currentPage, pageToken, dataProducerService?.enable]);

  const loadCollectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load collection elements
      const result = await dataProducerService!.client!.getCollectionsApi()
        .getCollectionElements(objectId, currentPage, pageSize);

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
      const obj = await dataProducerService!.client!.getObjectsApi()
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

  if (elements.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <p className="text-sm text-gray-600">No data available in this collection.</p>
      </div>
    );
  }

  const columns = extractColumns();

  return (
    <div className="space-y-4">
      {/* View Toggle and Pagination Controls */}
      <div className="flex items-center justify-between">
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
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-4 py-2 text-left font-semibold text-gray-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {elements.map((element, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col} className="px-4 py-2 text-gray-900">
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
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs font-mono whitespace-pre">
            {JSON.stringify(elements, null, 2)}
          </pre>
        </div>
      )}

      {/* Pagination Controls */}
      {paginationMode === 'count' && totalPages && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
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
        <div className="flex items-center justify-center space-x-2">
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
