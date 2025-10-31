"use client"
import { useState, useEffect } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { useCurrentUser } from '@/context/CurrentUserContext';
import ZerobiasAppService from '@/lib/zerobias';
import { ConnectionListView, ScopeListView } from '@auditmation/module-auditmation-auditmation-hub';
import { UUID, PagedResults } from '@auditmation/types-core-js';
import { ModuleSearch } from '@auditmation/module-auditmation-auditmation-store';

// PostgreSQL product package code for initial testing
const POSTGRESQL_PRODUCT_KEY = '@zerobias-org/product-oss-postgresql';

// Helper to check if a status is valid for DataProducer operations
const isValidStatus = (status: any): boolean => {
  if (!status) return false;
  const statusValue = typeof status === 'string' ? status : status.value;
  return statusValue === 'up' || statusValue === 'standby';
};

// Helper to format status for display
const formatStatus = (status: any): string => {
  if (!status) return 'Unknown';
  const statusValue = typeof status === 'string' ? status : status.value;
  return statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
};

export default function ConnectionSelector() {
  const { user, org, loading: userLoading } = useCurrentUser();
  const {
    selectedConnection,
    selectedScope,
    setConnection,
    setScope,
    initializeDataProducer,
    loading: explorerLoading,
    setLoading,
    dataProducerClient
  } = useDataExplorer();

  const [connections, setConnections] = useState<ConnectionListView[]>([]);
  const [scopes, setScopes] = useState<ScopeListView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScoped, setIsScoped] = useState(false);

  // Load connections when org is available
  useEffect(() => {
    if (org && !userLoading) {
      loadConnections();
    }
  }, [org, userLoading]);

  // Load scopes when connection changes
  useEffect(() => {
    if (selectedConnection) {
      loadScopes();
    } else {
      setScopes(null);
      setIsScoped(false);
    }
  }, [selectedConnection]);

  // Initialize DataProducer client when scope is selected (or connection if single-scope)
  useEffect(() => {
    if (explorerLoading) return;
    if (selectedConnection && scopes === null && isScoped === false) return;
    if (dataProducerClient) return;

    if (selectedConnection && !isScoped) {
      // Single-scope connection - auto-initialize
      console.log('Initializing with connection ID (single-scope):', selectedConnection.id);
      handleInitialize(selectedConnection.id.toString());
    } else if (selectedConnection && isScoped && selectedScope) {
      // Multi-scope connection - initialize with selected scope
      console.log('Initializing with scope ID (multi-scope):', selectedScope.id);
      handleInitialize(selectedScope.id.toString());
    }
  }, [selectedConnection, selectedScope, isScoped, scopes, explorerLoading, dataProducerClient]);

  const loadConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const zerobiasService = await ZerobiasAppService.getInstance();
      const clientApi = zerobiasService.zerobiasClientApi;

      // Try to find PostgreSQL connections via product/module association
      const pgProducts = await clientApi.portalClient.getProductApi()
        .search({ packageCode: POSTGRESQL_PRODUCT_KEY }, 1, 10);

      if (pgProducts.items && pgProducts.items.length > 0) {
        const pgProduct = pgProducts.items[0];
        const moduleSearchResults: PagedResults<ModuleSearch> = await clientApi.storeClient.getModuleApi()
          .search({ products: [pgProduct.id] }, 1, 50, undefined);

        const moduleIds = moduleSearchResults.items.map(m => m.id);

        if (moduleIds.length > 0) {
          const connectionResults: PagedResults<ConnectionListView> = await clientApi.hubClient.getConnectionApi()
            .search({ modules: moduleIds }, 1, 50, undefined);

          if (connectionResults.items.length > 0) {
            setConnections(connectionResults.items);
            return;
          }
        }
      }

      // Fallback: List all connections and filter by name pattern
      const allConnections: PagedResults<ConnectionListView> = await clientApi.hubClient.getConnectionApi()
        .list(1, 100);

      const sqlConnections = allConnections.items.filter(conn => {
        const name = conn.name.toLowerCase();
        return name.includes('sql') || name.includes('postgres') || name.includes('database') || name.includes('db');
      });

      if (sqlConnections.length > 0) {
        setConnections(sqlConnections);
      } else {
        setConnections(allConnections.items);
      }
    } catch (err: any) {
      console.error('Failed to load connections:', err);
      setError(`Failed to load connections: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadScopes = async () => {
    if (!selectedConnection) return;

    setLoading(true);
    setError(null);
    try {
      const zerobiasService = await ZerobiasAppService.getInstance();
      const clientApi = zerobiasService.zerobiasClientApi;
      const connectionUUID = new UUID(selectedConnection.id);

      const connection = await clientApi.hubClient.getConnectionApi().get(connectionUUID);
      const isConnectionScoped = connection.scoped || false;
      setIsScoped(isConnectionScoped);

      if (isConnectionScoped) {
        const scopeResults: PagedResults<ScopeListView> = await clientApi.hubClient.getScopeApi()
          .list(connectionUUID, 1, 50);

        setScopes(scopeResults.items);

        // Auto-select if only 1 scope
        if (scopeResults.items.length === 1) {
          const scope = scopeResults.items[0];
          setScope({
            id: scope.id.toString(),
            name: scope.name,
            description: scope.description
          });
        }
      } else {
        setScopes(null);
      }
    } catch (err: any) {
      console.error('Failed to load scopes:', err);
      setError(`Failed to load scopes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      await initializeDataProducer(targetId);
    } catch (err: any) {
      console.error('Failed to initialize DataProducer client:', err);
      setError(`Failed to initialize: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const connId = e.target.value;
    if (!connId) {
      setConnection(null);
      setScope(null);
      return;
    }

    const conn = connections.find(c => c.id.toString() === connId);
    if (!conn) return;

    if (!isValidStatus(conn.status)) {
      setError(`Cannot select connection "${conn.name}" - status is ${formatStatus(conn.status)}`);
      return;
    }

    setConnection({
      id: connId,
      name: conn.name,
      description: conn.description
    });
    setError(null);
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scopeId = e.target.value;
    if (!scopeId) {
      setScope(null);
      return;
    }

    const scope = scopes?.find(s => s.id.toString() === scopeId);
    if (!scope) return;

    if (!isValidStatus(scope.status)) {
      setError(`Cannot select scope "${scope.name}" - status is ${formatStatus(scope.status)}`);
      return;
    }

    setScope({
      id: scopeId,
      name: scope.name,
      description: scope.description
    });
    setError(null);
  };

  if (userLoading) {
    return <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Loading...</span>;
  }

  if (!org) {
    return <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>Please select an organization</span>;
  }

  const selectStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    background: 'rgba(255,255,255,0.95)',
    color: '#1f2937',
    minWidth: '200px',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {/* Connection Selector */}
      <select
        value={selectedConnection?.id || ''}
        onChange={handleConnectionChange}
        disabled={explorerLoading || connections.length === 0}
        style={selectStyle}
      >
        <option value="">Select a Connection</option>
        {connections.map(conn => {
          const status = formatStatus(conn.status);
          const isValid = isValidStatus(conn.status);
          return (
            <option
              key={conn.id.toString()}
              value={conn.id.toString()}
              disabled={!isValid}
              style={{ color: isValid ? '#1f2937' : '#9ca3af' }}
            >
              {conn.name} ({status})
            </option>
          );
        })}
      </select>

      {/* Scope Selector - only show if multi-scope with >1 scopes */}
      {isScoped && scopes && scopes.length > 1 && (
        <select
          value={selectedScope?.id || ''}
          onChange={handleScopeChange}
          disabled={explorerLoading}
          style={selectStyle}
        >
          <option value="">Select a Scope</option>
          {scopes.map(scope => {
            const status = formatStatus(scope.status);
            const isValid = isValidStatus(scope.status);
            return (
              <option
                key={scope.id.toString()}
                value={scope.id.toString()}
                disabled={!isValid}
                style={{ color: isValid ? '#1f2937' : '#9ca3af' }}
              >
                {scope.name} ({status})
              </option>
            );
          })}
        </select>
      )}

      {/* Show error inline if present */}
      {error && (
        <span style={{ fontSize: '0.875rem', color: '#fecaca', marginLeft: '0.5rem' }}>{error}</span>
      )}
    </div>
  );
}
