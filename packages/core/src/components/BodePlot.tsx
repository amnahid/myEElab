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
}

export const BodePlot: React.FC<BodePlotProps> = ({ data }) => {
  const { theme } = useEditorStore();
  
  const options = useMemo<uPlot.Options>(() => {
    const series: uPlot.Series[] = [
      { label: "Frequency" }
    ];

    const colors = ["#5A8796", "#A9553D", "#B9924D", "#367985", "#30383E"];
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

    const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
    const gridColor = theme === 'dark' ? '#323A3F' : '#D0C8B8';

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
  }, [data, theme]);

  const plotData = useMemo(() => {
    const d: (number | null)[][] = [data.freq];
    
    Object.keys(data.magnitudes).forEach((node) => {
      d.push(data.magnitudes[node]);
      d.push(data.phases[node]);
    });

    return d as uPlot.AlignedData;
  }, [data]);

  if (!data.freq.length) return null;

  const bgColor = theme === 'dark' ? '#20252A' : '#EEEAE4';
  const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
  const borderColor = theme === 'dark' ? '#323A3F' : '#D0C8B8';

  return (
    <div style={{ padding: '10px', background: bgColor, borderTop: `2px solid ${borderColor}` }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: textColor }}>AC Analysis (Bode Plot)</h3>
      <UplotReact options={options} data={plotData} />
    </div>
  );
};
