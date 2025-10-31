"use client"
import { useCurrentUser } from "@/context/CurrentUserContext";
import { useDataExplorer } from "@/context/DataExplorerContext";
import ConnectionSelector from "@/components/ConnectionSelector";
import ObjectBrowser from "@/components/ObjectBrowser";
import ObjectDetails from "@/components/ObjectDetails";

export default function DataExplorerPage() {
  const { user, org, loading: userLoading } = useCurrentUser();
  const { dataProducerService } = useDataExplorer();

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Data Explorer</h1>
          <p className="text-blue-100">Browse and explore data sources through the DataProducer interface</p>
          {user && (
            <div className="mt-2 text-sm">
              <span className="opacity-75">Logged in as:</span> <span className="font-semibold">{user.name}</span>
              {org && <span className="ml-4 opacity-75">Organization:</span>}
              {org && <span className="font-semibold ml-1">{org.name}</span>}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Connection Selector */}
          <ConnectionSelector />

          {/* Data Explorer - Two Column Layout */}
          {dataProducerService?.enable && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Object Browser */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Browse Data</h2>
                <ObjectBrowser />
              </div>

              {/* Right Column: Object Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Object Details</h2>
                <ObjectDetails />
              </div>
            </div>
          )}

          {/* Help Information */}
          {!dataProducerService?.enable && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  To begin exploring data:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Select a PostgreSQL connection from the dropdown above</li>
                  <li>If the connection has multiple scopes, select a scope</li>
                  <li>Once connected, you can browse the database structure</li>
                </ol>
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mt-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Currently limited to PostgreSQL connections for testing.
                    Support for additional DataProducer implementations will be added when
                    interface discovery is available in the Hub API.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
