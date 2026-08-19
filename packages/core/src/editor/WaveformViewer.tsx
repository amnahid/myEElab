import React, { useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useEditorStore } from '../store/editorStore';

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

    const textColor = theme === 'dark' ? '#cdd6f4' : '#2c3e50';
    const gridColor = theme === 'dark' ? '#313244' : '#eeeeee';

    const opts: uPlot.Options = {
      title: "Transient Analysis",
      id: "chart",
      class: "waveform-plot",
      width: containerRef.current.offsetWidth,
      height: height - 50,
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
          height: height - 50
        });
      }
    };
    handleResize(); // ensure height is correct if only height changed without recreation
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, probes, theme, height]);

  const bgColor = theme === 'dark' ? '#181825' : 'white';
  const textColor = theme === 'dark' ? '#cdd6f4' : '#2c3e50';
  const borderColor = theme === 'dark' ? '#313244' : '#ccc';

  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

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

  return (
    <div style={{ padding: '10px', height: `${height}px`, background: bgColor, borderTop: `1px solid ${borderColor}`, position: 'relative' }}>
      <div 
        style={{ 
          position: 'absolute', top: -5, left: 0, right: 0, height: 10, 
          cursor: 'ns-resize', zIndex: 10 
        }} 
        onMouseDown={handleMouseDown}
      />
      <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', textAlign: 'center', color: textColor }}>Transient Analysis</h3>
      {probes.length === 0 ? (
        <div style={{ textAlign: 'center', color: theme === 'dark' ? '#7f8c8d' : '#7f8c8d', marginTop: '80px' }}>
          Click a node with the Probe tool to see its waveform.
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: 'calc(100% - 30px)' }} />
      )}
    </div>
  );
};
