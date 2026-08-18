import React, { useMemo } from 'react';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';
import uPlot from 'uplot';

interface BodePlotProps {
  data: {
    freq: number[];
    magnitudes: Record<string, number[]>; // in dB
    phases: Record<string, number[]>;    // in degrees
  };
}

export const BodePlot: React.FC<BodePlotProps> = ({ data }) => {
  const options = useMemo<uPlot.Options>(() => {
    const series: uPlot.Series[] = [
      { label: "Frequency" }
    ];

    const colors = ["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6"];
    let colorIdx = 0;

    Object.keys(data.magnitudes).forEach((node) => {
      const color = colors[colorIdx % colors.length];
      series.push({
        label: `|v(${node})| dB`,
        stroke: color,
        width: 2,
        scale: "dB"
      });
      series.push({
        label: `∠v(${node}) °`,
        stroke: color,
        width: 2,
        dash: [5, 5],
        scale: "deg"
      });
      colorIdx++;
    });

    return {
      width: window.innerWidth - 40,
      height: 250,
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
          values: (_u, vals) => vals.map(v => v != null ? (v >= 1000 ? `${v/1000}k` : v.toString()) : '')
        },
        {
          scale: 'dB',
          values: (_u, vals) => vals.map(v => v != null ? `${v.toFixed(1)} dB` : '')
        },
        {
          scale: 'deg',
          side: 1, // Right side
          grid: { show: false },
          values: (_u, vals) => vals.map(v => v != null ? `${v.toFixed(0)}°` : '')
        }
      ],
      series
    };
  }, [data]);

  const plotData = useMemo(() => {
    const d: (number | null)[][] = [data.freq];
    
    Object.keys(data.magnitudes).forEach((node) => {
      d.push(data.magnitudes[node]);
      d.push(data.phases[node]);
    });

    return d as uPlot.AlignedData;
  }, [data]);

  if (!data.freq.length) return null;

  return (
    <div style={{ padding: '10px', background: '#fff', borderTop: '1px solid #ccc' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>AC Analysis (Bode Plot)</h3>
      <UplotReact options={options} data={plotData} />
    </div>
  );
};
