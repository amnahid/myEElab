import React, { useMemo } from 'react';
import UplotReact from 'uplot-react';
import { useEditorStore } from '../store/editorStore';
import 'uplot/dist/uPlot.min.css';
import uPlot from 'uplot';

interface BodePlotProps {
  data: {
    freq: number[];
    magnitudes: Record<string, number[]>; // in dB
    phases: Record<string, number[]>;    // in degrees
  };
  probes?: { nodeId: string; color: string; x: number; y: number }[];
  hasAcSource?: boolean;
}

export const BodePlot: React.FC<BodePlotProps> = ({ data, probes, hasAcSource = true }) => {
  const { theme } = useEditorStore();

  const activeProbes = useMemo(() => {
    if (probes && probes.length > 0) return probes;
    return [];
  }, [probes]);

  const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
  const gridColor = theme === 'dark' ? '#323A3F' : '#D0C8B8';
  const bgColor = theme === 'dark' ? '#20252A' : '#EEEAE4';
  const borderColor = theme === 'dark' ? '#323A3F' : '#D0C8B8';

  const { options, plotData, plottedCount } = useMemo(() => {
    const series: uPlot.Series[] = [
      { 
        label: "Frequency",
        value: (_u, v) => v == null ? "-" : (v >= 1000 ? `${(v/1000).toFixed(2)} kHz` : `${v.toFixed(1)} Hz`)
      }
    ];

    const plotDataArr: uPlot.AlignedData = [data.freq || []];
    let count = 0;

    if (activeProbes.length > 0) {
      activeProbes.forEach((probe) => {
        const node = probe.nodeId;
        const magKey = data.magnitudes[node] !== undefined 
          ? node 
          : (data.magnitudes[`v(${node})`] !== undefined ? `v(${node})` : Object.keys(data.magnitudes || {}).find(k => k.toLowerCase() === `v(${node})`.toLowerCase()));

        if (magKey && data.magnitudes[magKey] && data.phases[magKey]) {
          series.push({
            label: `|V(${node})|`,
            stroke: probe.color,
            width: 2,
            scale: "dB",
            value: (_u, v) => v == null ? "-" : `${v.toFixed(1)} dB`
          });
          series.push({
            label: `∠V(${node})`,
            stroke: probe.color,
            width: 1.5,
            dash: [4, 4],
            scale: "deg",
            value: (_u, v) => v == null ? "-" : `${v.toFixed(1)}°`
          });
          plotDataArr.push(data.magnitudes[magKey]);
          plotDataArr.push(data.phases[magKey]);
          count++;
        }
      });
    }

    const opts: uPlot.Options = {
      width: Math.max(200, typeof window !== 'undefined' ? window.innerWidth - 40 : 800),
      height: 220,
      scales: {
        x: {
          distr: 3, // Logarithmic scale
          auto: true
        },
        dB: {
          auto: true
        },
        deg: {
          auto: true
        }
      },
      axes: [
        {
          scale: 'x',
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: gridColor },
          values: (_u, vals) => vals.map(v => v != null ? (v >= 1000 ? `${v/1000}k` : v.toString()) : '')
        },
        {
          scale: 'dB',
          stroke: textColor,
          grid: { stroke: gridColor },
          ticks: { stroke: gridColor },
          values: (_u, vals) => vals.map(v => v != null ? `${v.toFixed(1)} dB` : '')
        },
        {
          scale: 'deg',
          side: 1, // Right side
          stroke: textColor,
          grid: { show: false },
          ticks: { stroke: gridColor },
          values: (_u, vals) => vals.map(v => v != null ? `${v.toFixed(0)}°` : '')
        }
      ],
      series
    };

    return { options: opts, plotData: plotDataArr, plottedCount: count };
  }, [data, activeProbes, textColor, gridColor]);

  if (!data.freq || !data.freq.length) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: textColor, opacity: 0.7, background: bgColor }}>
        {!hasAcSource 
          ? "No AC source detected in circuit. Place a Function Generator or AC source to perform frequency analysis."
          : "No frequency sweep data available. Click 'Run Sim' to generate frequency response."}
      </div>
    );
  }

  if (activeProbes.length === 0 || plottedCount === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: textColor, opacity: 0.7, background: bgColor }}>
        Click a node with the <strong>Probe</strong> tool to view its frequency response.
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', background: bgColor, borderTop: `2px solid ${borderColor}` }}>
      {!hasAcSource && (
        <div style={{ padding: '4px 8px', marginBottom: '8px', background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', borderRadius: '4px', fontSize: '0.8rem' }}>
          Notice: Circuit has no AC source. All response magnitudes are zero. Add an AC voltage source or function generator to observe frequency response.
        </div>
      )}
      <UplotReact options={options} data={plotData} />
    </div>
  );
};
