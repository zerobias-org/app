"use client"
import { useCurrentUser } from "@/context/CurrentUserContext";
import { useDataExplorer } from "@/context/DataExplorerContext";
import ConnectionSelector from "@/components/ConnectionSelector";
import ObjectBrowser from "@/components/ObjectBrowser";
import ObjectDetails from "@/components/ObjectDetails";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function DataExplorerPage() {
  const { user: _user, org: _org, loading: userLoading } = useCurrentUser();
  const { dataProducerClient } = useDataExplorer();

  if (userLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginTop: '1rem', color: '#4b5563' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header with Title and Connection Selector */}
      <header style={{ background: '#2563eb', color: 'white', padding: '0.375rem 1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>ZeroBias Dynamic Data Explorer</h1>
        <div style={{ flex: 1, maxWidth: '400px', marginLeft: '2rem' }}>
          <ConnectionSelector />
        </div>
      </header>

      {/* Main Content - Resizable Two Column Layout */}
      <div style={{ height: 'calc(100vh - 42px)', padding: '8px' }}>
        <PanelGroup direction="horizontal">
          {/* Left Panel: Object Browser */}
          <Panel defaultSize={30} minSize={25} maxSize={50}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
              <div style={{ background: 'white', borderRadius: '0.25rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: '600', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                  <svg style={{ width: '14px', height: '14px', marginRight: '6px', color: '#f59e0b' }} viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1 4l2-2h4l2 2h5a1 1 0 011 1v8a1 1 0 01-1 1H1a1 1 0 01-1-1V5a1 1 0 011-1z"/>
                  </svg>
                  Object Browser
                </h2>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  {dataProducerClient ? (
                    <ObjectBrowser />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1.5rem 0', fontSize: '0.813rem' }}>
                      Select a connection to view objects
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* Divider */}
          <PanelResizeHandle style={{
            width: '4px',
            background: '#e5e7eb',
            cursor: 'col-resize',
            position: 'relative',
            flexShrink: 0
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '1px',
              height: '32px',
              background: '#9ca3af',
              borderRadius: '0.5px'
            }}></div>
          </PanelResizeHandle>

          {/* Right Panel: Object Details */}
          <Panel minSize={30}>
            <div style={{ height: '100%', paddingLeft: '4px' }}>
              <ObjectDetails />
            </div>
          </Panel>
        </PanelGroup>
        </div>
    </div>
  );
}
