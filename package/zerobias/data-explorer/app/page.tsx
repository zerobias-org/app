"use client"
import { useCurrentUser } from "@/context/CurrentUserContext";
import { useDataExplorer } from "@/context/DataExplorerContext";
import ConnectionSelector from "@/components/ConnectionSelector";
import ObjectBrowser from "@/components/ObjectBrowser";
import ObjectDetails from "@/components/ObjectDetails";

export default function DataExplorerPage() {
  const { user, org, loading: userLoading } = useCurrentUser();
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
      <header style={{ background: '#2563eb', color: 'white', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ margin: '0 16px', display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, flexShrink: 0 }}>SQL DynamicData Explorer</h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Browse and interact with database objects</p>
        </div>
      </header>

      {/* Main Content - Resizable Two Column Layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', margin: '16px', gap: 0 }}>
        {/* Left Panel: Object Browser (40%) */}
        <div style={{ minWidth: '250px', width: '40%', overflowY: 'auto', paddingRight: '8px' }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
              <svg style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              Object Browser
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <ConnectionSelector />
            </div>
            {dataProducerClient ? (
              <ObjectBrowser />
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0', fontSize: '0.875rem' }}>
                Select a connection above to view objects
              </div>
            )}
          </div>
        </div>

          {/* Divider */}
          <div
            style={{
              width: '8px',
              background: '#e5e7eb',
              cursor: 'col-resize',
              position: 'relative',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '2px',
              height: '40px',
              background: '#9ca3af',
              borderRadius: '1px'
            }}></div>
          </div>

          {/* Right Panel: Object Details */}
          <div style={{ flex: 1, minWidth: '400px', overflowY: 'auto', paddingLeft: '8px' }}>
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <ObjectDetails />
            </div>
          </div>
        </div>
    </div>
  );
}
