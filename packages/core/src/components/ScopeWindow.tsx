import React, { useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { ComponentInstance } from '../models/circuit';

interface ScopeWindowProps {
  oscilloscope: ComponentInstance;
  data: {
    time: number[];
    vectors: Record<string, number[]>;
  };
  onClose: () => void;
  nodeMap: Map<string, string>; // Maps pin id to node name
}

export const ScopeWindow: React.FC<ScopeWindowProps> = ({ oscilloscope, data, onClose, nodeMap }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !data.time || data.time.length === 0) {
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

    const ch1PlusNode = nodeMap.get('1');
    const ch1MinusNode = nodeMap.get('2');
    
    const vecPlus = ch1PlusNode ? (data.vectors[ch1PlusNode] || data.vectors[`v(${ch1PlusNode})`] || data.vectors[`V(${ch1PlusNode})`]) : null;
    const vecMinus = ch1MinusNode ? (data.vectors[ch1MinusNode] || data.vectors[`v(${ch1MinusNode})`] || data.vectors[`V(${ch1MinusNode})`]) : null;
    
    if (vecPlus || vecMinus) {
      const length = data.time.length;
      const diffVec = new Array(length).fill(0);
      for (let i = 0; i < length; i++) {
        const vP = vecPlus ? (vecPlus[i] || 0) : 0;
        const vM = vecMinus ? (vecMinus[i] || 0) : 0;
        diffVec[i] = vP - vM;
      }

      series.push({
        label: `CH1`,
        stroke: '#00ff00',
        width: 2,
        value: (_u, v) => v == null ? "-" : v.toFixed(3) + " V"
      });
      plotData.push(diffVec);
    }

    const opts: uPlot.Options = {
      title: "Oscilloscope",
      id: "scope-chart",
      class: "scope-plot",
      width: containerRef.current.offsetWidth,
      height: isExpanded ? window.innerHeight * 0.6 : 300,
      cursor: {
        points: { size: 6, width: 2 }
      },
      series,
      axes: [
        {
          label: 'Time (s)',
          stroke: '#00ff00',
          grid: { stroke: '#004400', width: 1 },
          values: (_u, vals) => vals.map(v => (v * 1000).toPrecision(3) + 'm')
        },
        {
          label: 'Voltage (V)',
          stroke: '#00ff00',
          grid: { stroke: '#004400', width: 1 },
          values: (_u, vals) => vals.map(v => v.toPrecision(3))
        }
      ]
    };

    if (!plotRef.current) {
      plotRef.current = new uPlot(opts, plotData, containerRef.current);
    } else {
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
          height: isExpanded ? window.innerHeight * 0.6 : 300
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, oscilloscope, nodeMap, isExpanded]);

  // Apply custom dark styling to uPlot
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .scope-plot .u-title { color: #00ff00; }
      .scope-plot .u-legend { color: #00ff00; }
      .scope-plot canvas { background-color: #050505; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    }
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: isExpanded ? '10%' : '50px',
      left: isExpanded ? '10%' : '50px',
      width: isExpanded ? '80%' : '500px',
      background: '#111',
      border: '2px solid #333',
      borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        background: '#222',
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #444'
      }}>
        <div style={{ color: '#ccc', fontWeight: 'bold', fontSize: '14px' }}>Oscilloscope ({oscilloscope.refDes || 'Scope'})</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => {
              if (plotRef.current && data.time.length > 0) {
                plotRef.current.setScale('x', { min: data.time[0], max: data.time[data.time.length - 1] });
                plotRef.current.setScale('Voltage (V)', { min: null as any, max: null as any });
                // Note: The y-axis might have a different scale key, uPlot usually defaults to the first series scale or 'y'
                // Let's reset the default scales
                const scales = plotRef.current.scales;
                for (const key in scales) {
                  if (key !== 'x') {
                    plotRef.current.setScale(key, { min: null as any, max: null as any });
                  }
                }
              }
            }}
            style={{ background: '#333', border: '1px solid #555', color: '#ddd', cursor: 'pointer', borderRadius: '4px', fontSize: '11px', padding: '2px 6px', marginRight: '8px' }}
          >
            Reset Zoom
          </button>
          <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <div ref={containerRef} style={{ width: '100%', minHeight: isExpanded ? '60vh' : '300px' }} />
      </div>
    </div>
  );
};
