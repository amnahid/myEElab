import React, { useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useEditorStore } from '../store/editorStore';
import { Minimize2, Maximize2, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';

interface WaveformViewerProps {
  data: {
    time: number[];
    vectors: Record<string, number[]>;
  };
  probes: { nodeId: string, color: string, x: number, y: number }[];
}

export const WaveformViewer: React.FC<WaveformViewerProps> = ({ data, probes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const { theme } = useEditorStore();
  const [height, setHeight] = useState(250);
  const [viewMode, setViewMode] = useState<'normal' | 'minimized' | 'fullscreen'>('normal');

  // Keep track of previous theme to force recreate uPlot
  const prevThemeRef = useRef(theme);

  useEffect(() => {
    if (!containerRef.current || probes.length === 0 || !data.time || data.time.length === 0) {
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
      return;
    }

    const series: uPlot.Series[] = [
      { label: 'Time', value: (_u, v) => v == null ? "-" : (v * 1000).toFixed(2) + " ms" }
    ];
    
    const plotData: uPlot.AlignedData = [data.time];

    probes.forEach((probe) => {
      const node = probe.nodeId;
      const vec = data.vectors[node] || data.vectors[`v(${node})`] || data.vectors[`V(${node})`] || data.vectors[`v(${node})#branch`];
      if (vec) {
        series.push({
          label: `V(${node})`,
          stroke: probe.color,
          width: 2,
          value: (_u, v) => v == null ? "-" : v.toFixed(3) + " V"
        });
        plotData.push(vec);
      }
    });

    const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
    const gridColor = theme === 'dark' ? '#323A3F' : '#D0C8B8';

    const opts: uPlot.Options = {
      title: "",
      id: "chart",
      class: "waveform-plot",
      width: containerRef.current.offsetWidth,
      height: viewMode === 'fullscreen' ? window.innerHeight - 110 : (viewMode === 'minimized' ? 0 : height - 50),
      cursor: {
        points: {
          size: 6,
          width: 2
        }
      },
      series,
      axes: [
        {
          label: 'Time (s)',
          values: (_u, vals) => vals.map(v => (v * 1000).toPrecision(3) + 'm'),
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: gridColor }
        },
        {
          label: 'Voltage (V)',
          values: (_u, vals) => vals.map(v => v.toPrecision(3)),
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: gridColor }
        }
      ]
    };

    if (!plotRef.current) {
      plotRef.current = new uPlot(opts, plotData, containerRef.current);
      prevThemeRef.current = theme;
    } else {
      // Reinitialize if series count changed or theme changed, else just setData
      if (plotRef.current.series.length !== series.length || prevThemeRef.current !== theme) {
        plotRef.current.destroy();
        plotRef.current = new uPlot(opts, plotData, containerRef.current);
        prevThemeRef.current = theme;
      } else {
        plotRef.current.setData(plotData);
      }
    }

    const handleResize = () => {
      if (plotRef.current && containerRef.current) {
        plotRef.current.setSize({
          width: containerRef.current.offsetWidth,
          height: viewMode === 'fullscreen' ? window.innerHeight - 110 : (viewMode === 'minimized' ? 0 : height - 50)
        });
      }
    };
    handleResize(); // ensure height is correct if only height changed without recreation
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, probes, theme, height, viewMode]);

  const bgColor = theme === 'dark' ? '#20252A' : '#EEEAE4';
  const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
  const borderColor = theme === 'dark' ? '#323A3F' : '#D0C8B8';

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleZoom = (factor: number) => {
    if (!plotRef.current) return;
    const x = plotRef.current.scales.x;
    if (x.min == null || x.max == null) return;
    const range = x.max - x.min;
    const center = x.min + range / 2;
    const newRange = range * factor;
    plotRef.current.setScale('x', { min: center - newRange / 2, max: center + newRange / 2 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dy = startYRef.current - moveEvent.clientY; // dragging up increases height
      const newHeight = Math.max(100, Math.min(startHeightRef.current + dy, window.innerHeight - 100));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  const renderHeight = viewMode === 'minimized' ? 40 : (viewMode === 'fullscreen' ? 'calc(100vh - 60px)' : `${height}px`);
  const isFixed = viewMode === 'fullscreen';

  return (
    <div style={{ 
      padding: '10px', 
      height: renderHeight, 
      background: bgColor, 
      borderTop: `2px solid var(--signal)`, 
      position: isFixed ? 'fixed' : 'relative',
      top: isFixed ? 60 : 'auto',
      left: isFixed ? 0 : 'auto',
      right: isFixed ? 0 : 'auto',
      bottom: isFixed ? 0 : 'auto',
      zIndex: isFixed ? 1000 : 10,
      boxShadow: 'inset 0 4px 6px -4px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {viewMode === 'normal' && (
        <div 
          style={{ 
            position: 'absolute', top: -5, left: 0, right: 0, height: 10, 
            cursor: 'ns-resize', zIndex: 10 
          }} 
          onMouseDown={handleMouseDown}
        />
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: viewMode === 'minimized' ? 0 : '10px', paddingBottom: viewMode === 'minimized' ? 0 : '10px', borderBottom: viewMode === 'minimized' ? 'none' : `1px solid ${borderColor}` }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: textColor }}>Transient Analysis</h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button title="Zoom In" onClick={() => handleZoom(0.5)} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            <ZoomIn size={18} />
          </button>
          <button title="Zoom Out" onClick={() => handleZoom(2.0)} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            <ZoomOut size={18} />
          </button>
          
          <div style={{ width: '1px', background: borderColor, margin: '0 4px' }} />
          
          <button title={viewMode === 'minimized' ? 'Restore' : 'Minimize'} onClick={() => setViewMode(viewMode === 'minimized' ? 'normal' : 'minimized')} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            {viewMode === 'minimized' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          <button title={viewMode === 'fullscreen' ? 'Restore' : 'Full Screen'} onClick={() => setViewMode(viewMode === 'fullscreen' ? 'normal' : 'fullscreen')} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            {viewMode === 'fullscreen' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: viewMode === 'minimized' ? 'none' : 'block', position: 'relative' }}>
        {probes.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme === 'dark' ? '#7f8c8d' : '#7f8c8d', marginTop: '80px' }}>
            Click a node with the Probe tool to see its waveform.
          </div>
        ) : (
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );

};
