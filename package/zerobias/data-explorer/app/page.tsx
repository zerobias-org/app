"use client"
import { useCurrentUser } from "@/context/CurrentUserContext";
import { useDataExplorer } from "@/context/DataExplorerContext";

export default function DataExplorerPage() {
  const { user, org, loading: userLoading } = useCurrentUser();
  const { selectedConnection, selectedScope, loading: explorerLoading } = useDataExplorer();

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
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4">Welcome to Data Explorer</h2>
          <p className="text-gray-700 mb-4">
            This application allows you to browse and explore data sources that implement the DataProducer interface.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> Application scaffolding created successfully.
              <br />
              Next steps: Run npm install and npm build to verify dependencies and integration.
            </p>
          </div>
          {!user && (
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> User authentication is still loading or not configured.
                Please ensure you have proper Zerobias platform credentials.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
