"use client"
import { createContext, useContext, useState, ReactNode } from 'react';
import { DataproducerClient, newDataproducer } from '@auditlogic/module-auditmation-interface-dataproducer-client-ts';
import { URL as CoreURL, UUID } from '@auditmation/types-core-js';
import ZerobiasAppService from '@/lib/zerobias';
import { DataExplorerObject, ConnectionInfo, ScopeInfo } from '@/lib/types';

type DataExplorerContextType = {
  selectedConnection: ConnectionInfo | null;
  selectedScope: ScopeInfo | null;
  selectedObject: DataExplorerObject | null;
  loading: boolean;
  dataProducerClient: DataproducerClient | null;
  setConnection: (connection: ConnectionInfo | null) => void;
  setScope: (scope: ScopeInfo | null) => void;
  setSelectedObject: (obj: DataExplorerObject | null) => void;
  setLoading: (loading: boolean) => void;
  initializeDataProducer: (targetId: string) => Promise<void>;
};

export const DataExplorerContext = createContext<DataExplorerContextType>({
  selectedConnection: null,
  selectedScope: null,
  selectedObject: null,
  loading: false,
  dataProducerClient: null,
  setConnection: () => {},
  setScope: () => {},
  setSelectedObject: () => {},
  setLoading: () => {},
  initializeDataProducer: async () => {},
});

export const useDataExplorer = () => useContext(DataExplorerContext);

export const DataExplorerProvider = ({ children }: { children: ReactNode }) => {
  const [selectedConnection, setConnection] = useState<ConnectionInfo | null>(null);
  const [selectedScope, setScope] = useState<ScopeInfo | null>(null);
  const [selectedObject, setSelectedObject] = useState<DataExplorerObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataProducerClient, setDataProducerClient] = useState<DataproducerClient | null>(null);

  const initializeDataProducer = async (targetId: string) => {
    try {
      setLoading(true);
      console.log('Initializing DataProducer client with targetId:', targetId);

      const zerobiasService = await ZerobiasAppService.getInstance();
      const apiHostname = zerobiasService.environment.apiHostname;

      // Construct Hub URL - the DataProducer client will handle the /hub/targets paths
      const hubUrl = `${apiHostname}/hub`;

      const hubConnectionProfile = {
        server: new CoreURL(hubUrl),
        targetId: new UUID(targetId)
      };

      console.log('Connecting to Hub URL:', hubUrl);
      const client = newDataproducer();
      await client.connect(hubConnectionProfile);
      setDataProducerClient(client);
      console.log('DataProducer client initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize DataProducer client:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataExplorerContext.Provider
      value={{
        selectedConnection,
        selectedScope,
        selectedObject,
        loading,
        dataProducerClient,
        setConnection,
        setScope,
        setSelectedObject,
        setLoading,
        initializeDataProducer
      }}
    >
      {children}
    </DataExplorerContext.Provider>
  );
};
