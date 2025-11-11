"use client"
import { useState, useEffect, useRef } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import mermaid from 'mermaid';

interface ERDiagramProps {
  objectId: string;
  schemaJson?: string;
}

export default function ERDiagram({ objectId, schemaJson }: ERDiagramProps) {
  const { dataProducerClient } = useDataExplorer();
  const [diagram, setDiagram] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    if (objectId && dataProducerClient) {
      generateERD();
    }
  }, [objectId, dataProducerClient]);

  const generateERD = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get ERD from DataProducer API if it provides one
      const diagramApi = (dataProducerClient as any).getDiagramApi?.();

      if (diagramApi) {
        try {
          const erdResult = await diagramApi.getERD(objectId);
          if (erdResult?.diagram) {
            setDiagram(erdResult.diagram);
            await renderDiagram(erdResult.diagram);
            return;
          }
        } catch (err) {
          console.log('No diagram API or ERD available, generating from schema');
        }
      }

      // Fallback: Generate simple ERD from schema
      if (schemaJson) {
        const generatedDiagram = generateERDFromSchema(schemaJson);
        setDiagram(generatedDiagram);
        await renderDiagram(generatedDiagram);
      } else {
        setError('No schema available to generate ERD');
      }
    } catch (err: any) {
      console.error('Failed to generate ERD:', err);
      setError(`Failed to generate diagram: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateERDFromSchema = (schemaJson: string): string => {
    try {
      const schema = JSON.parse(schemaJson);

      // Start with erDiagram syntax
      let mermaidCode = 'erDiagram\n';

      // If schema has properties (like JSON Schema)
      if (schema.properties) {
        const entityName = schema.title || 'Entity';
        mermaidCode += `    ${entityName} {\n`;

        Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
          const type = prop.type || 'string';
          const nullable = prop.nullable ? ' NULL' : '';
          mermaidCode += `        ${type} ${key}${nullable}\n`;
        });

        mermaidCode += '    }\n';
      }
      // If schema is an array of columns (alternative format)
      else if (Array.isArray(schema)) {
        mermaidCode += '    Entity {\n';
        schema.forEach((col: any) => {
          const name = col.name || col.columnName || 'field';
          const type = col.type || col.dataType || 'string';
          mermaidCode += `        ${type} ${name}\n`;
        });
        mermaidCode += '    }\n';
      }
      else {
        // Simple fallback
        mermaidCode = 'erDiagram\n    Entity {\n        string id\n    }\n';
      }

      return mermaidCode;
    } catch (err) {
      console.error('Failed to parse schema for ERD:', err);
      return 'erDiagram\n    Entity {\n        string id\n    }\n';
    }
  };

  const renderDiagram = async (diagramCode: string) => {
    if (!diagramRef.current) return;

    try {
      // Clear previous diagram
      diagramRef.current.innerHTML = '';

      // Generate unique ID
      const id = `mermaid-${Date.now()}`;

      // Render with mermaid
      const { svg } = await mermaid.render(id, diagramCode);
      diagramRef.current.innerHTML = svg;
    } catch (err: any) {
      console.error('Mermaid render error:', err);
      setError(`Failed to render diagram: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Generating diagram...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
        <p className="text-sm text-yellow-700">{error}</p>
        <button
          onClick={generateERD}
          className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="erd-container">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-gray-700">Entity Relationship Diagram</h4>
        <button
          onClick={() => setShowSource(!showSource)}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          {showSource ? 'Show Diagram' : 'Show Source'}
        </button>
      </div>

      {showSource ? (
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <pre className="text-xs text-gray-800 overflow-x-auto">
            <code>{diagram}</code>
          </pre>
        </div>
      ) : (
        <div
          ref={diagramRef}
          className="diagram-output bg-white border border-gray-200 rounded p-4 overflow-auto"
          style={{ minHeight: '300px' }}
        />
      )}

      <style jsx>{`
        .erd-container {
          width: 100%;
        }

        .diagram-output :global(svg) {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
