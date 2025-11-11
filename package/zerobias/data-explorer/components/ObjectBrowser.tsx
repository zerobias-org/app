"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { ChevronRight, ChevronDown, Folder, Table, Zap, FileText, Paperclip, Box } from 'lucide-react';

// Object node in the tree
type TreeNode = {
  id: string;
  name: string;
  objectClass?: string[];
  description?: string;
  isExpanded: boolean;
  isLoading: boolean;
  children?: TreeNode[];
  hasLoadedChildren: boolean;
};

export default function ObjectBrowser() {
  const { dataProducerClient, setSelectedObject } = useDataExplorer();
  const [rootNode, setRootNode] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load root object when client is ready
  useEffect(() => {
    if (dataProducerClient) {
      loadRootObject();
    }
  }, [dataProducerClient]);

  const loadRootObject = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading root object...');
      const rootObj = await dataProducerClient!.getObjectsApi().getRootObject();

      console.log('Root object loaded:', {
        id: rootObj.id,
        name: rootObj.name,
        objectClass: rootObj.objectClass,
        description: rootObj.description
      });

      // Convert objectClass enum values to strings
      const objectClassStrings = rootObj.objectClass?.map(c => {
        if (typeof c === 'string') return c;
        return (c as any).value?.toString() || c.toString();
      }) || [];

      console.log('Object classes as strings:', objectClassStrings);

      const rootNode = {
        id: rootObj.id,
        name: rootObj.name,
        objectClass: objectClassStrings,
        description: rootObj.description,
        isExpanded: true, // Auto-expand root
        isLoading: false,
        hasLoadedChildren: false
      };

      setRootNode(rootNode);

      // Auto-load root children if it's a container
      if (objectClassStrings.includes('container')) {
        console.log('Root is a container, loading children...');
        // Load children and ensure the root is set to expanded state
        const updatedNode = { ...rootNode, isLoading: true };
        setRootNode(updatedNode);

        try {
          console.log('Loading children for root node:', rootNode.id, rootNode.name);
          // PagedResults uses 0-indexed pages, so page 0 is the first page
          const childrenResult = await dataProducerClient!.getObjectsApi().getChildren(rootNode.id, 0, 100);

          console.log('getChildren response:', childrenResult);
          console.log('childrenResult type:', typeof childrenResult);
          console.log('childrenResult.items:', childrenResult?.items);
          console.log('childrenResult keys:', childrenResult ? Object.keys(childrenResult) : 'null');

          // Log raw response structure
          if (childrenResult) {
            console.log('Full response structure:', JSON.stringify(childrenResult, null, 2));
          }

          // Validate the response has the expected structure
          if (!childrenResult || !childrenResult.items) {
            console.error('Invalid response from getChildren - missing items array:', childrenResult);
            console.error('Response may have data in a different field. Checking for alternatives...');

            // Check if data is in a different field (common API response patterns)
            const possibleDataFields = ['data', 'results', 'content', 'records', 'rows'];
            for (const field of possibleDataFields) {
              if (childrenResult && (childrenResult as any)[field]) {
                console.log(`Found data in '${field}' field:`, (childrenResult as any)[field]);
              }
            }

            throw new Error('Invalid response format: missing items array');
          }

          const childNodes: TreeNode[] = childrenResult.items.map(child => {
            // Convert objectClass enum values to strings
            const objectClassStrings = child.objectClass?.map(c => {
              if (typeof c === 'string') return c;
              return (c as any).value?.toString() || c.toString();
            }) || [];

            return {
              id: child.id,
              name: child.name,
              objectClass: objectClassStrings,
              description: child.description,
              isExpanded: false,
              isLoading: false,
              hasLoadedChildren: false
            };
          });

          console.log('Loaded', childNodes.length, 'children for root');

          // Update root node with children
          setRootNode({
            ...rootNode,
            children: childNodes,
            hasLoadedChildren: true,
            isLoading: false,
            isExpanded: true
          });
        } catch (err: any) {
          console.error(`Failed to load children for root:`, err);
          setRootNode({
            ...rootNode,
            isLoading: false,
            hasLoadedChildren: true,
            children: [],
            isExpanded: true
          });
        }
      } else {
        console.log('Root is not a container, skipping children load');
      }
    } catch (err: any) {
      console.error('Failed to load root object:', err);
      setError(`Failed to load root: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (node: TreeNode) => {
    if (node.hasLoadedChildren) {
      return; // Already loaded
    }

    // Check if this is a container
    if (!node.objectClass?.includes('container')) {
      return; // Not a container, no children
    }

    try {
      // Mark as loading
      updateNodeState(node.id, { isLoading: true });

      console.log('Loading children for node:', node.id, node.name);
      // PagedResults uses 0-indexed pages, so page 0 is the first page
      const childrenResult = await dataProducerClient!.getObjectsApi().getChildren(node.id, 0, 100);

      console.log('getChildren response:', childrenResult);

      // Validate the response has the expected structure
      if (!childrenResult || !childrenResult.items) {
        console.error('Invalid response from getChildren - missing items array:', childrenResult);
        throw new Error('Invalid response format: missing items array');
      }

      const childNodes: TreeNode[] = childrenResult.items.map(child => {
        // Convert objectClass enum values to strings
        const objectClassStrings = child.objectClass?.map(c => {
          if (typeof c === 'string') return c;
          return (c as any).value?.toString() || c.toString();
        }) || [];

        return {
          id: child.id,
          name: child.name,
          objectClass: objectClassStrings,
          description: child.description,
          isExpanded: false,
          isLoading: false,
          hasLoadedChildren: false
        };
      });

      // Update node with children
      updateNodeState(node.id, {
        children: childNodes,
        hasLoadedChildren: true,
        isLoading: false
      });
    } catch (err: any) {
      console.error(`Failed to load children for ${node.name}:`, err);

      // Check if this is the known backend issue
      if (err.message?.includes("Producers must return 'items'")) {
        console.error('Backend DataProducer Error: The DataProducer implementation is not properly populating the PagedResults.items array. This is a backend bug.');
        setError('DataProducer Backend Error: The producer is not returning data in the correct format. This needs to be fixed in the backend implementation.');
      }

      updateNodeState(node.id, {
        isLoading: false,
        hasLoadedChildren: true,
        children: []
      });
    }
  };

  const updateNodeState = (nodeId: string, updates: Partial<TreeNode>) => {
    setRootNode(prevRoot => {
      if (!prevRoot) return null;
      return updateNodeRecursive(prevRoot, nodeId, updates);
    });
  };

  const updateNodeRecursive = (node: TreeNode, targetId: string, updates: Partial<TreeNode>): TreeNode => {
    if (node.id === targetId) {
      return { ...node, ...updates };
    }

    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => updateNodeRecursive(child, targetId, updates))
      };
    }

    return node;
  };

  const handleToggleExpand = async (node: TreeNode) => {
    const newExpandedState = !node.isExpanded;

    // Update expand state
    updateNodeState(node.id, { isExpanded: newExpandedState });

    // Load children if expanding for the first time
    if (newExpandedState && !node.hasLoadedChildren) {
      await loadChildren(node);
    }
  };

  const handleSelectObject = (node: TreeNode) => {
    setSelectedObject({
      id: node.id,
      name: node.name,
      objectClass: node.objectClass,
      description: node.description
    });
  };

  const getIcon = (objectClass?: string[]) => {
    if (!objectClass || objectClass.length === 0) {
      return <Box className="w-4 h-4 text-gray-400" />;
    }

    // Check for primary class
    if (objectClass.includes('collection')) {
      return <Table className="w-4 h-4 text-blue-500" />;
    }
    if (objectClass.includes('function')) {
      return <Zap className="w-4 h-4 text-yellow-500" />;
    }
    if (objectClass.includes('document')) {
      return <FileText className="w-4 h-4 text-green-500" />;
    }
    if (objectClass.includes('binary')) {
      return <Paperclip className="w-4 h-4 text-purple-500" />;
    }
    if (objectClass.includes('container')) {
      return <Folder className="w-4 h-4 text-amber-500" />;
    }

    return <Box className="w-4 h-4 text-gray-400" />;
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isContainer = node.objectClass?.includes('container');
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = isContainer;

    return (
      <div key={node.id} className="select-none">
        {/* Node row */}
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer group"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          {/* Expand/collapse icon */}
          <div className="w-5 h-5 flex items-center justify-center mr-1">
            {canExpand ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand(node);
                }}
                className="hover:bg-gray-200 rounded p-0.5"
                disabled={node.isLoading}
              >
                {node.isLoading ? (
                  <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : node.isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}
          </div>

          {/* Icon and name */}
          <div
            className="flex items-center flex-1 min-w-0"
            onClick={() => handleSelectObject(node)}
          >
            <span className="mr-2 flex-shrink-0">
              {getIcon(node.objectClass)}
            </span>
            <span className="text-sm truncate" title={node.name}>
              {node.name}
            </span>
            {node.objectClass && node.objectClass.length > 0 && (
              <span className="ml-2 text-xs text-gray-400 hidden group-hover:inline">
                ({node.objectClass.join(', ')})
              </span>
            )}
          </div>
        </div>

        {/* Children */}
        {node.isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!dataProducerClient) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600 text-sm">
          Please select a connection to begin browsing
        </p>
      </div>
    );
  }

  if (loading && !rootNode) {
    return (
      <div className="p-4">
        <div className="flex items-center text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
          <span className="text-sm">Loading data structure...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={loadRootObject}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!rootNode) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-sm text-gray-700">Object Browser</h3>
      </div>
      <div className="p-2 max-h-96 overflow-y-auto">
        {renderNode(rootNode)}
      </div>
    </div>
  );
}
