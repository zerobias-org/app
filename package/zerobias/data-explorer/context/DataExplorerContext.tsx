"use client"
import { createContext, useContext, useState, ReactNode } from 'react';
import DataProducerService from '@/lib/dataproducer';
import { DataExplorerObject, ConnectionInfo, ScopeInfo } from '@/lib/types';

type DataExplorerContextType = {
  selectedConnection: ConnectionInfo | null;
  selectedScope: ScopeInfo | null;
  selectedObject: DataExplorerObject | null;
  loading: boolean;
  dataProducerService: DataProducerService | null;
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
  dataProducerService: null,
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
  const [dataProducerService, setDataProducerService] = useState<DataProducerService | null>(null);

  const initializeDataProducer = async (targetId: string) => {
    try {
      setLoading(true);
      const service = await DataProducerService.getInstance();
      await service.initializeClient(targetId);
      setDataProducerService(service);
    } catch (error) {
      console.error('Failed to initialize DataProducer client', error);
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
        dataProducerService,
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
