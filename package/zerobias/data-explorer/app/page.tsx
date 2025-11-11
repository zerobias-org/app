"use client"
import { useCurrentUser } from "@/context/CurrentUserContext";
import { useDataExplorer } from "@/context/DataExplorerContext";
import ConnectionSelector from "@/components/ConnectionSelector";
import ObjectBrowser from "@/components/ObjectBrowser";
import ObjectDetails from "@/components/ObjectDetails";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function DataExplorerPage() {
  const { user, org, loading: userLoading } = useCurrentUser();
  const { dataProducerClient } = useDataExplorer();

  if (userLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-explorer">
      {/* Header with Title and Connection Selector */}
      <header className="header">
        <div className="header-content">
          <h1 className="title">Data Explorer</h1>
          <div className="connection-selector-wrapper">
            <ConnectionSelector />
          </div>
        </div>
      </header>

      {/* Main Content - Resizable Two Column Layout */}
      {dataProducerClient ? (
        <div className="main-content">
          <PanelGroup direction="horizontal">
            {/* Left Panel: Object Browser */}
            <Panel defaultSize={30} minSize={20} maxSize={50}>
              <div className="panel-content">
                <div className="panel-card">
                  <h2 className="panel-header">
                    <svg className="panel-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                    Data Objects
                  </h2>
                  <ObjectBrowser />
                </div>
              </div>
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="resize-handle">
              <div className="resize-handle-bar"></div>
            </PanelResizeHandle>

            {/* Right Panel: Object Details */}
            <Panel minSize={40}>
              <div className="panel-content">
                <div className="panel-card">
                  <ObjectDetails />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-content">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
            </svg>
            <p className="empty-state-text">Select a connection to begin exploring data objects</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .data-explorer {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f9fafb;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 100%;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .title {
          font-size: 1.75rem;
          font-weight: 600;
          margin: 0;
          flex-shrink: 0;
          letter-spacing: -0.025em;
        }

        .connection-selector-wrapper {
          flex: 1;
          max-width: 600px;
        }

        .main-content {
          flex: 1;
          height: calc(100vh - 72px);
          overflow: hidden;
        }

        .panel-content {
          height: 100%;
          overflow-y: auto;
          padding: 1rem;
        }

        .panel-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1.5rem 0;
          display: flex;
          align-items: center;
          color: #1f2937;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .panel-icon {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.5rem;
          color: #667eea;
        }

        .resize-handle {
          position: relative;
          background: #e5e7eb;
          width: 6px;
          cursor: col-resize;
          transition: background 0.2s;
        }

        .resize-handle:hover {
          background: #9ca3af;
        }

        .resize-handle-bar {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 3px;
          height: 40px;
          background: white;
          border-radius: 2px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .resize-handle:hover .resize-handle-bar {
          opacity: 1;
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
        }

        .loading-content {
          text-align: center;
        }

        .loading-content p {
          margin-top: 1rem;
          color: #6b7280;
          font-size: 1rem;
        }

        .empty-state {
          margin: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          height: calc(100vh - 104px);
        }

        .empty-state-content {
          text-align: center;
          color: #9ca3af;
          padding: 3rem;
        }

        .empty-state-icon {
          margin: 0 auto;
          height: 5rem;
          width: 5rem;
          color: #d1d5db;
        }

        .empty-state-text {
          margin-top: 1.5rem;
          font-size: 1.125rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
