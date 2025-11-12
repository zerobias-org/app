"use client"
import { createContext, useContext, useState, ReactNode } from 'react';
import { DataproducerClient, newDataproducer } from '@auditlogic/module-auditmation-interface-dataproducer-client-ts';
import { UUID } from '@auditmation/types-core-js';
import { getZerobiasClientUrl } from '@auditmation/zb-client-lib-js';
import ZerobiasAppService from '@/lib/zerobias';
import { useCurrentUser } from '@/context/CurrentUserContext';
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
  const { org } = useCurrentUser();
  const [selectedConnection, setConnection] = useState<ConnectionInfo | null>(null);
  const [selectedScope, setScope] = useState<ScopeInfo | null>(null);
  const [selectedObject, setSelectedObject] = useState<DataExplorerObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataProducerClient, setDataProducerClient] = useState<DataproducerClient | null>(null);

  const initializeDataProducer = async (targetId: string) => {
    try {
      setLoading(true);
      console.log('=== DataProducer Initialization Start ===');
      console.log('Target ID:', targetId);

      console.log('Step 1: Getting ZerobiasAppService instance...');
      const zerobiasService = await ZerobiasAppService.getInstance();
      console.log('Step 1: Complete - Got instance');

      console.log('Step 2: Constructing Hub URL using getZerobiasClientUrl...');
      const isLocalDev = zerobiasService.environment.isLocalDev;
      const hubUrl = getZerobiasClientUrl('hub', true, isLocalDev);
      console.log('Step 2: Complete - Hub URL:', hubUrl.toString());

      console.log('Step 3: Creating UUID object...');
      let uuid;
      try {
        uuid = zerobiasService.zerobiasClientApi.toUUID(targetId);
        console.log('Step 3: Complete - UUID created:', uuid.toString());
      } catch (uuidError: any) {
        console.error('Step 3: Failed to create UUID:', {
          error: uuidError,
          message: uuidError?.message,
          stack: uuidError?.stack,
          targetId
        });
        throw new Error(`Failed to create UUID from "${targetId}": ${uuidError?.message || 'Unknown error'}`);
      }

      // Add API key and org ID for authentication (local dev only)
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;

      const hubConnectionProfile: any = {
        server: hubUrl,
        targetId: uuid
      };

      // Add authentication if in local dev mode
      if (zerobiasService.environment.isLocalDev && apiKey) {
        hubConnectionProfile.apiKey = apiKey;
        console.log('Step 4: Added API key to connection profile');
      }

      if (org) {
        hubConnectionProfile.orgId = zerobiasService.zerobiasClientApi.toUUID(org.id);
        console.log('Step 4: Added Org ID to connection profile');
      }

      console.log('Step 4: Hub connection profile created:', {
        server: hubConnectionProfile.server.toString(),
        targetId: hubConnectionProfile.targetId.toString(),
        hasApiKey: !!hubConnectionProfile.apiKey,
        hasOrgId: !!hubConnectionProfile.orgId
      });

      console.log('Step 5: Creating DataProducer client...');
      const client = newDataproducer();
      console.log('Step 5: Complete - Client created');

      console.log('Step 6: Connecting to Hub...');
      try {
        await client.connect(hubConnectionProfile);
        console.log('Step 6: Complete - Connected successfully');
      } catch (connectError: any) {
        console.error('Step 6: Failed to connect:', {
          error: connectError,
          errorType: typeof connectError,
          errorConstructor: connectError?.constructor?.name,
          message: connectError?.message,
          stack: connectError?.stack,
          response: connectError?.response,
          responseData: connectError?.response?.data,
          status: connectError?.response?.status,
          statusText: connectError?.response?.statusText,
          config: connectError?.config ? {
            url: connectError.config.url,
            method: connectError.config.method,
            headers: connectError.config.headers
          } : undefined
        });
        throw new Error(`Failed to connect to Hub: ${connectError?.message || connectError?.response?.statusText || 'Unknown error'}`);
      }

      setDataProducerClient(client);
      console.log('=== DataProducer Initialization Complete ===');
    } catch (error: any) {
      console.error('=== DataProducer Initialization Failed ===');
      console.error('Error caught:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error keys:', Object.keys(error || {}));
      console.error('Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
        response: error?.response?.data,
        status: error?.response?.status
      });

      // Re-throw with a more descriptive message
      throw error;
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
