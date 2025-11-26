"use client"
import { useState, useEffect, useRef } from 'react';
import { useDataExplorer } from '@/context/DataExplorerContext';
import mermaid from 'mermaid';

interface ERDiagramProps {
  objectId: string;
  schemaJson?: string | object;
}

export default function ERDiagram({ objectId, schemaJson: _schemaJson }: ERDiagramProps) {
  const { dataProducerClient } = useDataExplorer();
  const [diagram, setDiagram] = useState<string>('');
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [_baseZoom, setBaseZoom] = useState(100); // natural/container scale (starting point)
  const [minZoom, setMinZoom] = useState(10); // Dynamic min (container/natural for fit-to-width)
  const [maxZoom, setMaxZoom] = useState(200); // Dynamic max (2x baseZoom)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [_scrollPos, _setScrollPos] = useState({ x: 0, y: 0 });
  const diagramRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Render diagram when we have the code and we're not showing source
  useEffect(() => {
    if (diagram && !showSource) {
      renderDiagram(diagram);
    }
  }, [diagram, showSource]);

  // Calculate optimal zoom and apply styles to SVG after it's rendered
  useEffect(() => {
    if (renderedSvg && diagramRef.current && containerRef.current) {
      const svgElement = diagramRef.current.querySelector('svg');
      if (svgElement) {
        // Get natural dimensions from SVG viewBox or width attribute
        const viewBox = svgElement.getAttribute('viewBox');
        let naturalW = 0;

        if (viewBox) {
          const parts = viewBox.split(' ');
          if (parts.length === 4) {
            naturalW = parseFloat(parts[2]);
          }
        } else {
          const widthAttr = svgElement.getAttribute('width');
          if (widthAttr) {
            naturalW = parseFloat(widthAttr.replace('px', ''));
          }
        }

        // Get container width
        const containerW = containerRef.current.clientWidth;

        // All zoom levels calculated dynamically from natural and container dimensions
        if (naturalW > 0 && containerW > 0) {
          // Base zoom: Show diagram at natural size (natural / container)
          // Example: 11307px / 846px = 1337%
          const base = Math.round((naturalW / containerW) * 100);

          // Min zoom: Fit entire diagram in container (container / natural)
          // Example: 846px / 11307px = 7.5% (inverted ratio)
          const min = Math.max(1, Math.round((containerW / naturalW) * 100));

          // Max zoom: 2x natural size for detail viewing
          // Example: 1337% * 2 = 2674%
          const max = base * 2;

          console.log(`SVG: ${naturalW}px, Container: ${containerW}px`);
          console.log(`Zoom range: ${min}% (fit) → ${base}% (natural) → ${max}% (2x)`);

          setMinZoom(min);
          setBaseZoom(base);
          setMaxZoom(max);
          setZoom(base); // Start at natural size
        } else {
          // Fallback only if dimensions can't be determined
          setMinZoom(10);
          setBaseZoom(100);
          setMaxZoom(200);
          setZoom(100);
        }

        // Set SVG to its natural size
        svgElement.style.display = 'block';
        svgElement.style.width = naturalW ? `${naturalW}px` : 'auto';
        svgElement.style.height = 'auto';
      }
    }
  }, [renderedSvg]);

  const generateERD = async () => {
    setLoading(true);
    setError(null);

    try {
      // The SQL module implements ERD as a function at database level: /db:{database}/function:erd
      // Extract database, schema, and table from objectId
      // e.g., /db:mydb/schema:public/table:users -> db=mydb, schema=public, table=users
      const parts = objectId.split('/').filter(p => p); // Remove empty strings

      if (parts.length >= 1 && parts[0].startsWith('db:')) {
        const dbId = `/${parts[0]}/function:erd`;

        // Extract schema and table names if available (for filtering)
        let schemaName: string | undefined;
        let tableName: string | undefined;

        parts.forEach(part => {
          if (part.startsWith('schema:')) {
            schemaName = part.substring(7); // Remove 'schema:' prefix
          } else if (part.startsWith('table:') || part.startsWith('view:')) {
            tableName = part.substring(part.indexOf(':') + 1); // Remove 'table:' or 'view:' prefix
          }
        });

        // Build ERD function parameters
        const erdParams: any = {};

        // If we have a specific schema, filter to that schema
        if (schemaName) {
          erdParams.schemas = [schemaName];
        }

        // If we have a specific table, include that table and related tables
        if (tableName) {
          erdParams.tables = [tableName];
        }

        // Invoke ERD function with filter parameters
        const functionsApi = (dataProducerClient as any).getFunctionsApi?.();
        if (functionsApi && typeof functionsApi.invokeFunction === 'function') {
          console.log('Calling ERD function:', dbId, 'with params:', erdParams);

          try {
            const result = await functionsApi.invokeFunction(dbId, erdParams);

            console.log('ERD function returned:', typeof result);
            console.log('Result is string?', typeof result === 'string');
            console.log('Result is object?', typeof result === 'object');

            // The SQL module now returns JSON: { diagram: "..." }
            let erdData = result;

            // If it's an object, extract the diagram property
            if (result && typeof result === 'object') {
              const keys = Object.keys(result);
              console.log('Result has', keys.length, 'keys');

              // Check for the diagram property (SQL module wraps it now)
              if (result.diagram && typeof result.diagram === 'string') {
                erdData = result.diagram;
              }
              // Also check legacy properties for backward compatibility
              else if (result.data && typeof result.data === 'string') {
                erdData = result.data;
              } else if (result.erd && typeof result.erd === 'string') {
                erdData = result.erd;
              } else if (result.result && typeof result.result === 'string') {
                erdData = result.result;
              }
            }

            // Now check if we have a valid string
            if (erdData && typeof erdData === 'string') {
              console.log('Got ERD data, length:', erdData.length);
              console.log('First 500 chars:', erdData.substring(0, 500));

              setDiagram(erdData);
              await renderDiagram(erdData);
              return; // Success!
            } else {
              console.error('ERD function returned unexpected format:', typeof erdData);
              setError('ERD function returned invalid data format');
            }
          } catch (invocationError: any) {
            console.error('Failed to invoke ERD function:', invocationError);
            setError(`Failed to invoke ERD function: ${invocationError.message}`);
            return;
          }
        } else {
          setError('ERD function not available for this database');
        }
      } else {
        setError('Unable to generate ERD: not a database object');
      }
    } catch (err: any) {
      console.error('Failed to generate ERD:', err);
      setError(`Failed to generate diagram: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderDiagram = async (diagramCode: string) => {
    if (!diagramCode || diagramCode.trim().length === 0) {
      console.error('Diagram code is empty');
      setError('No diagram data to render');
      return;
    }

    try {
      console.log('Rendering diagram with code length:', diagramCode.length);
      console.log('First 200 chars:', diagramCode.substring(0, 200));

      // Generate unique ID
      const id = `mermaid-${Date.now()}`;

      // Render with mermaid
      const { svg } = await mermaid.render(id, diagramCode);
      console.log('Mermaid render succeeded, SVG length:', svg.length);

      if (!svg || svg.trim().length === 0) {
        console.error('Mermaid returned empty SVG');
        setError('Mermaid returned empty diagram');
        return;
      }

      // Store the SVG in state - React will handle rendering it
      setRenderedSvg(svg);
      console.log('SVG stored in state');
    } catch (err: any) {
      console.error('Mermaid render error:', err);
      setError(`Failed to render diagram: ${err.message || err}`);
    }
  };

  // Add wheel listener with non-passive option
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Much more aggressive: 10% of current zoom per scroll tick
      // At 1337%, 10% = 133.7 units per tick
      // At 100%, 10% = 10 units per tick
      // This gives ~7-10 scrolls to halve/double the zoom
      const deltaPercent = 0.10; // 10% of current zoom per scroll tick
      const scaledDelta = zoom * deltaPercent;

      const delta = e.deltaY > 0 ? -scaledDelta : scaledDelta;

      // Clamp between dynamic min and max
      setZoom(prev => Math.max(minZoom, Math.min(prev + delta, maxZoom)));
    };

    // Add with { passive: false } to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, minZoom, maxZoom]);

  // Click and drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX + scrollContainerRef.current.scrollLeft,
      y: e.clientY + scrollContainerRef.current.scrollTop
    });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollContainerRef.current) return;
    scrollContainerRef.current.scrollLeft = panStart.x - e.clientX;
    scrollContainerRef.current.scrollTop = panStart.y - e.clientY;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.cursor = 'grab';
      }
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Minimal Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.375rem 0.75rem',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb',
        flexShrink: 0
      }}>
        <span style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          fontFamily: 'var(--font-roboto), Roboto, sans-serif'
        }}>
          Zoom: {zoom}% • Scroll wheel to zoom • Click and drag to pan
        </span>
        <button
          onClick={() => setShowSource(!showSource)}
          style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-roboto), Roboto, sans-serif'
          }}
        >
          {showSource ? 'Show Diagram' : 'Show Source'}
        </button>
      </div>

      {showSource ? (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '0.25rem',
          padding: '0.5rem',
          flex: 1,
          overflow: 'auto'
        }}>
          <pre style={{ fontSize: '0.75rem', color: '#1f2937', margin: 0, fontFamily: 'monospace' }}>
            <code>{diagram}</code>
          </pre>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            background: 'white',
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            position: 'relative',
            cursor: isPanning ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
        >
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                border: '2px solid #2563eb',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '0.75rem'
              }}></div>
              <span style={{ color: '#4b5563', fontSize: '0.875rem', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
                Generating diagram...
              </span>
            </div>
          )}

          {error && !loading && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fde047',
              borderRadius: '0.25rem',
              padding: '1rem',
              margin: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
                {error}
              </p>
              <button
                onClick={generateERD}
                style={{
                  fontSize: '0.875rem',
                  color: '#a16207',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'var(--font-roboto), Roboto, sans-serif'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#78350f'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#a16207'}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && !renderedSvg && (
            <div style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}>
              No diagram data available
            </div>
          )}

          {!loading && !error && renderedSvg && (
            <div
              ref={diagramRef}
              dangerouslySetInnerHTML={{ __html: renderedSvg }}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
                display: 'inline-block',
                pointerEvents: isPanning ? 'none' : 'auto'
              }}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
