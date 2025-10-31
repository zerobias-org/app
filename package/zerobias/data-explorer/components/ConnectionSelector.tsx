"use client"
import { useState, useEffect } from 'react';
import Select from 'react-select';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { useCurrentUser } from '@/context/CurrentUserContext';
import DataProducerService from '@/lib/dataproducer';
import { ConnectionListView, ScopeListView } from '@auditmation/module-auditmation-auditmation-hub';
import { UUID } from '@auditmation/types-core-js';

type SelectOption = {
  value: string;
  label: string;
  data?: any;
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
    setLoading
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
    if (selectedConnection && !isScoped) {
      // Single-scope connection, initialize with connection ID
      handleInitialize(selectedConnection.id.toString());
    } else if (selectedConnection && selectedScope) {
      // Multi-scope connection, initialize with scope ID
      handleInitialize(selectedScope.id.toString());
    }
  }, [selectedConnection, selectedScope, isScoped]);

  const loadConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = await DataProducerService.getInstance();
      const discoveredConnections = await service.discoverDataProducerConnections();
      setConnections(discoveredConnections);

      if (discoveredConnections.length === 0) {
        setError('No PostgreSQL connections found. Please create a connection to a PostgreSQL database.');
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
      const service = await DataProducerService.getInstance();
      const connectionUUID = new UUID(selectedConnection.id);
      const isConnectionScoped = await service.isConnectionScoped(connectionUUID);
      setIsScoped(isConnectionScoped);

      if (isConnectionScoped) {
        const connectionScopes = await service.getScopesForConnection(connectionUUID);
        setScopes(connectionScopes);

        if (connectionScopes && connectionScopes.length === 0) {
          setError('This connection has no scopes configured.');
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
      console.log('DataProducer client initialized successfully');
    } catch (err: any) {
      console.error('Failed to initialize DataProducer client:', err);
      setError(`Failed to initialize: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const connectionOptions: SelectOption[] = connections.map(conn => ({
    value: conn.id.toString(),
    label: conn.name,
    data: conn
  }));

  const scopeOptions: SelectOption[] = scopes ? scopes.map(scope => ({
    value: scope.id.toString(),
    label: scope.name,
    data: scope
  })) : [];

  const handleConnectionChange = (option: SelectOption | null) => {
    if (option) {
      setConnection({
        id: option.value,
        name: option.label,
        description: option.data?.description
      });
    } else {
      setConnection(null);
      setScope(null);
    }
  };

  const handleScopeChange = (option: SelectOption | null) => {
    if (option) {
      setScope({
        id: option.value,
        name: option.label,
        description: option.data?.description
      });
    } else {
      setScope(null);
    }
  };

  if (userLoading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Loading user information...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-4 bg-yellow-100 rounded-lg border border-yellow-400">
        <p className="text-yellow-800">Please select an organization to continue.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Data Source Connection</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Connection Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Connection
        </label>
        <Select
          options={connectionOptions}
          value={connectionOptions.find(opt => opt.value === selectedConnection?.id)}
          onChange={handleConnectionChange}
          isClearable
          isDisabled={explorerLoading || connections.length === 0}
          placeholder={connections.length === 0 ? "No connections available" : "Choose a connection..."}
          className="text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Currently showing PostgreSQL connections only
        </p>
      </div>

      {/* Scope Selector (if multi-scope) */}
      {isScoped && scopes && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Scope
          </label>
          <Select
            options={scopeOptions}
            value={scopeOptions.find(opt => opt.value === selectedScope?.id)}
            onChange={handleScopeChange}
            isClearable
            isDisabled={explorerLoading || scopeOptions.length === 0}
            placeholder={scopeOptions.length === 0 ? "No scopes available" : "Choose a scope..."}
            className="text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            This connection requires scope selection
          </p>
        </div>
      )}

      {/* Status Display */}
      {explorerLoading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">⏳ Loading...</p>
        </div>
      )}

      {selectedConnection && !isScoped && !explorerLoading && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-700">
            ✓ Connected to: <strong>{selectedConnection.name}</strong>
          </p>
        </div>
      )}

      {selectedConnection && isScoped && selectedScope && !explorerLoading && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-700">
            ✓ Connected to: <strong>{selectedConnection.name}</strong> → <strong>{selectedScope.name}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
