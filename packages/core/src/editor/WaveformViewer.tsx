import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

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

    const opts: uPlot.Options = {
      title: "Transient Analysis",
      id: "chart",
      class: "waveform-plot",
      width: containerRef.current.offsetWidth,
      height: 300,
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
          values: (_u, vals) => vals.map(v => (v * 1000).toPrecision(3) + 'm')
        },
        {
          label: 'Voltage (V)',
          values: (_u, vals) => vals.map(v => v.toPrecision(3))
        }
      ]
    };

    if (!plotRef.current) {
      plotRef.current = new uPlot(opts, plotData, containerRef.current);
    } else {
      // Reinitialize if series count changed, else just setData
      if (plotRef.current.series.length !== series.length) {
        plotRef.current.destroy();
        plotRef.current = new uPlot(opts, plotData, containerRef.current);
      } else {
        plotRef.current.setData(plotData);
      }
    }

    const handleResize = () => {
      if (plotRef.current && containerRef.current) {
        plotRef.current.setSize({
          width: containerRef.current.offsetWidth,
          height: 300
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, probes]);

  return (
    <div style={{ padding: '10px', height: '250px', background: 'white', borderTop: '1px solid #ccc', position: 'relative' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', textAlign: 'center' }}>Transient Analysis</h3>
      {probes.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '80px' }}>
          Click a node with the Probe tool to see its waveform.
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '300px' }} />
      )}
    </div>
  );
};
