"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { ChevronRight, ChevronDown, Folder, Table, Zap, FileText, Paperclip, Database } from 'lucide-react';

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
  const { dataProducerService, setSelectedObject } = useDataExplorer();
  const [rootNode, setRootNode] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load root object when client is ready
  useEffect(() => {
    if (dataProducerService?.enable && dataProducerService?.client) {
      loadRootObject();
    }
  }, [dataProducerService?.enable, dataProducerService?.client]);

  const loadRootObject = async () => {
    setLoading(true);
    setError(null);
    try {
      const rootObj = await dataProducerService!.client!.getObjectsApi().getRootObject();

      // Convert objectClass enum values to strings
      const objectClassStrings = rootObj.objectClass?.map(c => {
        if (typeof c === 'string') return c;
        return (c as any).value?.toString() || c.toString();
      }) || [];

      setRootNode({
        id: rootObj.id,
        name: rootObj.name,
        objectClass: objectClassStrings,
        description: rootObj.description,
        isExpanded: true, // Auto-expand root
        isLoading: false,
        hasLoadedChildren: false
      });

      // Auto-load root children
      await loadChildren({
        id: rootObj.id,
        name: rootObj.name,
        objectClass: objectClassStrings,
        description: rootObj.description,
        isExpanded: true,
        isLoading: false,
        hasLoadedChildren: false
      });
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

      const childrenResult = await dataProducerService!.client!.getObjectsApi().getChildren(node.id, 1, 100);

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
      return <Database className="w-4 h-4 text-gray-400" />;
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

    return <Database className="w-4 h-4 text-gray-400" />;
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

  if (!dataProducerService?.enable) {
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
