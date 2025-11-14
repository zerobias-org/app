"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';

// Object node in the tree
type TreeNode = {
  id: string;
  name: string;
  objectClass?: string[];
  description?: string;
  tags?: string[];
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
      const rootObj = await dataProducerClient!.getObjectsApi().getRootObject();

      const objectClassStrings = rootObj.objectClass?.map(c => {
        if (typeof c === 'string') return c;
        return (c as any).value?.toString() || c.toString();
      }) || [];

      const rootNode = {
        id: rootObj.id,
        name: rootObj.name,
        objectClass: objectClassStrings,
        description: rootObj.description,
        tags: rootObj.tags || [],
        isExpanded: true,
        isLoading: false,
        hasLoadedChildren: false
      };

      setRootNode(rootNode);

      if (objectClassStrings.includes('container')) {
        await loadChildren(rootNode);
      }
    } catch (err: any) {
      console.error('Failed to load root object:', err);
      setError(`Failed to load root: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (node: TreeNode) => {
    if (node.hasLoadedChildren || !node.objectClass?.includes('container')) return;

    try {
      updateNodeState(node.id, { isLoading: true });

      const childrenResult = await dataProducerClient!.getObjectsApi().getChildren(node.id, 1, 100);

      if (!childrenResult || !childrenResult.items) {
        throw new Error('Invalid response format: missing items array');
      }

      const childNodes: TreeNode[] = childrenResult.items.map(child => {
        const objectClassStrings = child.objectClass?.map(c => {
          if (typeof c === 'string') return c;
          return (c as any).value?.toString() || c.toString();
        }) || [];

        return {
          id: child.id,
          name: child.name,
          objectClass: objectClassStrings,
          description: child.description,
          tags: child.tags || [],
          isExpanded: false,
          isLoading: false,
          hasLoadedChildren: false
        };
      });

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
    updateNodeState(node.id, { isExpanded: newExpandedState });

    if (newExpandedState && !node.hasLoadedChildren) {
      await loadChildren(node);
    }
  };

  const handleSelectObject = (node: TreeNode) => {
    setSelectedObject({
      id: node.id,
      name: node.name,
      objectClass: node.objectClass,
      description: node.description,
      tags: node.tags
    });
  };

  const _getObjectClassColor = (objectClass: string): { bg: string, text: string } => {
    switch (objectClass) {
      case 'container':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'collection':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'function':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'document':
        return { bg: '#e0e7ff', text: '#3730a3' };
      case 'binary':
        return { bg: '#fce7f3', text: '#831843' };
      default:
        return { bg: '#e5e7eb', text: '#374151' };
    }
  };

  const getIcon = (objectClass?: string[]) => {
    if (!objectClass || objectClass.length === 0) {
      return <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="12" rx="2"/></svg>;
    }

    if (objectClass.includes('collection')) {
      return <svg style={{ width: '14px', height: '14px', color: '#3b82f6' }} viewBox="0 0 16 16" fill="currentColor"><path d="M0 2h16v2H0zM0 7h16v2H0zM0 12h16v2H0z"/></svg>;
    }
    if (objectClass.includes('function')) {
      return <svg style={{ width: '14px', height: '14px', color: '#eab308' }} viewBox="0 0 16 16" fill="currentColor"><path d="M8 2l6 5-6 5-6-5z"/></svg>;
    }
    if (objectClass.includes('document')) {
      return <svg style={{ width: '14px', height: '14px', color: '#22c55e' }} viewBox="0 0 16 16" fill="currentColor"><path d="M3 0h7l3 3v10a1 1 0 01-1 1H3a1 1 0 01-1-1V1a1 1 0 011-1zM10 4V1l3 3h-3z"/></svg>;
    }
    if (objectClass.includes('binary')) {
      return <svg style={{ width: '14px', height: '14px', color: '#a855f7' }} viewBox="0 0 16 16" fill="currentColor"><path d="M4 8l4-4 4 4-4 4z"/></svg>;
    }
    if (objectClass.includes('container')) {
      return <svg style={{ width: '14px', height: '14px', color: '#f59e0b' }} viewBox="0 0 16 16" fill="currentColor"><path d="M1 4l2-2h4l2 2h5a1 1 0 011 1v8a1 1 0 01-1 1H1a1 1 0 01-1-1V5a1 1 0 011-1z"/></svg>;
    }

    return <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="12" rx="2"/></svg>;
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isContainer = node.objectClass?.includes('container');
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = isContainer;

    return (
      <div key={node.id} style={{ userSelect: 'none' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '3px 6px',
            paddingLeft: `${depth * 16 + 6}px`,
            cursor: 'pointer',
            borderRadius: '3px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {/* Expand/collapse triangle */}
          <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
            {canExpand ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleExpand(node);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={node.isLoading}
              >
                {node.isLoading ? (
                  <div style={{ width: '10px', height: '10px', border: '2px solid #9ca3af', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <svg style={{ width: '10px', height: '10px', transform: node.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', color: '#6b7280' }} viewBox="0 0 10 10" fill="currentColor">
                    <path d="M2 1l6 4-6 4z"/>
                  </svg>
                )}
              </button>
            ) : (
              <span style={{ width: '10px' }} />
            )}
          </div>

          {/* Icon, name, and badges */}
          <div
            style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '6px', overflow: 'hidden' }}
            onClick={() => handleSelectObject(node)}
          >
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {getIcon(node.objectClass)}
            </span>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-roboto), Roboto, sans-serif', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0 }} title={node.name}>
              {node.name}
            </span>

            {/* Tag badges */}
            {node.tags && node.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden', flexShrink: 1, minWidth: 0 }}>
                {node.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.688rem',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: '#e5e7eb',
                      color: '#4b5563',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
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

  if (loading && !rootNode) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #6b7280', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px' }} />
          <span style={{ fontSize: '0.813rem' }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.25rem' }}>
        <p style={{ fontSize: '0.813rem', color: '#b91c1c' }}>{error}</p>
        <button
          onClick={loadRootObject}
          style={{ marginTop: '0.5rem', fontSize: '0.813rem', color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!rootNode) {
    return (
      <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '0.25rem' }}>
        <p style={{ fontSize: '0.813rem', color: '#6b7280' }}>No data available</p>
      </div>
    );
  }

  return (
    <div>
      {renderNode(rootNode)}
    </div>
  );
}
