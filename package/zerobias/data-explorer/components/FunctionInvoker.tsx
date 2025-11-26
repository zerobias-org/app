"use client"
import { useState } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import { Play, AlertCircle } from 'lucide-react';

type FunctionInvokerProps = {
  objectId: string;
  inputSchema?: string;
  outputSchema?: string;
};

export default function FunctionInvoker({ objectId, inputSchema, outputSchema }: FunctionInvokerProps) {
  const { dataProducerClient } = useDataExplorer();
  const [inputJson, setInputJson] = useState('{}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const validateJson = (value: string): boolean => {
    try {
      JSON.parse(value);
      setInputError(null);
      return true;
    } catch (err: any) {
      setInputError(`Invalid JSON: ${err.message}`);
      return false;
    }
  };

  const handleInputChange = (value: string) => {
    setInputJson(value);
    if (value.trim()) {
      validateJson(value);
    } else {
      setInputError(null);
    }
  };

  const handleInvoke = async () => {
    if (!validateJson(inputJson)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const input = JSON.parse(inputJson);
      const output = await dataProducerClient!.getFunctionsApi()
        .invokeFunction(objectId, input);
      setResult(output);
    } catch (err: any) {
      console.error('Failed to invoke function:', err);
      setError(`Function execution failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSchema = (schemaStr?: string, title?: string) => {
    if (!schemaStr) return null;

    try {
      const schema = JSON.parse(schemaStr);
      return (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      );
    } catch {
      return (
        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-800">
            {title}: Invalid schema format
          </p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Schema Information */}
      {(inputSchema || outputSchema) && (
        <div className="space-y-2">
          {renderSchema(inputSchema, 'Input Schema')}
          {renderSchema(outputSchema, 'Output Schema')}
        </div>
      )}

      {/* Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Function Input (JSON)
        </label>
        <textarea
          value={inputJson}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`w-full h-32 px-3 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            inputError ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder='{"key": "value"}'
        />
        {inputError && (
          <div className="mt-1 flex items-start text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{inputError}</span>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Enter function parameters as JSON. Leave as empty object ({}) if no parameters required.
        </p>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleInvoke}
        disabled={loading || !!inputError}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          loading || inputError
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <Play className="w-4 h-4 mr-2" />
        {loading ? 'Executing...' : 'Invoke Function'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 mb-1">Execution Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result !== null && !error && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-green-800 mb-2">Function Result</h4>
          <div className="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!result && !error && !loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>How to use:</strong>
          </p>
          <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>Review the input schema above (if provided) to understand required parameters</li>
            <li>Enter your function parameters as valid JSON in the input field</li>
            <li>Click "Invoke Function" to execute</li>
            <li>View the result below</li>
          </ol>
        </div>
      )}
    </div>
  );
}
