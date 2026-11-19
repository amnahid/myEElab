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
  acData?: {
    freq: number[];
    magnitudes: Record<string, number[]>;
    phases: Record<string, number[]>;
  };
  probes: { nodeId: string; color: string; x: number; y: number }[];
  activeAnalysis?: string;
  hasAcSource?: boolean;
}

export const WaveformViewer: React.FC<WaveformViewerProps> = React.memo(({ 
  data, 
  acData, 
  probes, 
  activeAnalysis = 'interactive',
  hasAcSource = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  const { theme, removeProbe, clearProbes } = useEditorStore();
  
  const [currentTab, setCurrentTab] = useState<'waveforms' | 'bode'>(
    activeAnalysis === 'ac' ? 'bode' : 'waveforms'
  );

  useEffect(() => {
    if (activeAnalysis === 'ac') setCurrentTab('bode');
    else if (activeAnalysis === 'tran') setCurrentTab('waveforms');
  }, [activeAnalysis]);

  const [height, setHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('waveform_height');
      if (saved) return parseInt(saved, 10);
    }
    return 250;
  });

  const [viewMode, setViewMode] = useState<'normal' | 'minimized' | 'fullscreen'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('waveform_viewMode');
      if (saved === 'normal' || saved === 'minimized' || saved === 'fullscreen') return saved;
    }
    return 'normal';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('waveform_height', height.toString());
    }
  }, [height]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('waveform_viewMode', viewMode);
    }
  }, [viewMode]);

  const prevThemeRef = useRef(theme);
  const prevTabRef = useRef(currentTab);

  useEffect(() => {
    if (viewMode === 'minimized') {
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
      return;
    }

    if (!containerRef.current || probes.length === 0) {
      if (plotRef.current) {
        plotRef.current.destroy();
        plotRef.current = null;
      }
      return;
    }

    const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
    const gridColor = theme === 'dark' ? '#323A3F' : '#D0C8B8';
    const plotWidth = Math.max(100, containerRef.current.offsetWidth || 100);
    const plotHeight = Math.max(100, viewMode === 'fullscreen' ? window.innerHeight - 110 : height - 50);

    let opts: uPlot.Options;
    let plotData: any[];

    if (currentTab === 'waveforms') {
      if (!data.time || data.time.length === 0) {
        if (plotRef.current) {
          plotRef.current.destroy();
          plotRef.current = null;
        }
        return;
      }

      const series: uPlot.Series[] = [
        { label: 'Time', value: (_u, v) => v == null ? "-" : (v * 1000).toFixed(2) + " ms" }
      ];
      plotData = [data.time];

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

      opts = {
        title: "",
        id: "waveform-chart",
        class: "waveform-plot",
        width: plotWidth,
        height: plotHeight,
        cursor: { points: { size: 6, width: 2 } },
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
    } else {
      // Bode Plot Tab (Frequency Domain)
      if (!acData || !acData.freq || acData.freq.length === 0) {
        if (plotRef.current) {
          plotRef.current.destroy();
          plotRef.current = null;
        }
        return;
      }

      const series: uPlot.Series[] = [
        { label: "Frequency", value: (_u, v) => v == null ? "-" : (v >= 1000 ? `${(v/1000).toFixed(2)} kHz` : `${v.toFixed(1)} Hz`) }
      ];
      plotData = [acData.freq];

      probes.forEach((probe) => {
        const node = probe.nodeId;
        const magKey = acData.magnitudes[node] !== undefined 
          ? node 
          : (acData.magnitudes[`v(${node})`] !== undefined ? `v(${node})` : Object.keys(acData.magnitudes || {}).find(k => k.toLowerCase() === `v(${node})`.toLowerCase()));

        if (magKey && acData.magnitudes[magKey] && acData.phases[magKey]) {
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
          plotData.push(acData.magnitudes[magKey]);
          plotData.push(acData.phases[magKey]);
        }
      });

      opts = {
        title: "",
        id: "bode-chart",
        class: "waveform-plot",
        width: plotWidth,
        height: plotHeight,
        cursor: { points: { size: 6, width: 2 } },
        scales: {
          x: { distr: 3, auto: true },
          dB: { auto: true },
          deg: { auto: true }
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
            side: 1,
            stroke: textColor,
            grid: { show: false },
            ticks: { stroke: gridColor },
            values: (_u, vals) => vals.map(v => v != null ? `${v.toFixed(0)}°` : '')
          }
        ],
        series
      };
    }

    const needsRecreation = !plotRef.current || 
      plotRef.current.series.length !== opts.series.length || 
      prevThemeRef.current !== theme ||
      prevTabRef.current !== currentTab;

    if (needsRecreation) {
      if (plotRef.current) {
        plotRef.current.destroy();
      }
      plotRef.current = new uPlot(opts, plotData, containerRef.current);
      prevThemeRef.current = theme;
      prevTabRef.current = currentTab;
    } else {
      plotRef.current?.setData(plotData as uPlot.AlignedData);
    }

    const handleResize = () => {
      if (plotRef.current && containerRef.current && containerRef.current.offsetWidth > 0) {
        plotRef.current.setSize({
          width: Math.max(100, containerRef.current.offsetWidth),
          height: Math.max(100, viewMode === 'fullscreen' ? window.innerHeight - 110 : height - 50)
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, acData, probes, theme, height, viewMode, currentTab]);

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
      const dy = startYRef.current - moveEvent.clientY;
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

  const renderHeight = viewMode === 'minimized' ? '40px' : (viewMode === 'fullscreen' ? 'calc(100vh - 60px)' : `${height}px`);
  const isFixed = viewMode === 'fullscreen';

  return (
    <div style={{ 
      boxSizing: 'border-box',
      padding: viewMode === 'minimized' ? '6px 16px' : '10px', 
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
      flexDirection: 'column',
      overflow: 'hidden'
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
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: viewMode === 'minimized' ? 0 : '8px', 
        paddingBottom: viewMode === 'minimized' ? 0 : '8px', 
        borderBottom: viewMode === 'minimized' ? 'none' : `1px solid ${borderColor}`,
        height: viewMode === 'minimized' ? '28px' : 'auto'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {activeAnalysis === 'interactive' ? (
            <div style={{ display: 'flex', gap: '4px', background: theme === 'dark' ? '#181C20' : '#DDD8CE', padding: '3px', borderRadius: '5px' }}>
              <button
                onClick={() => setCurrentTab('waveforms')}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.8rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: currentTab === 'waveforms' ? 'var(--signal)' : 'transparent',
                  color: currentTab === 'waveforms' ? '#fff' : textColor,
                  fontWeight: currentTab === 'waveforms' ? 600 : 'normal'
                }}
              >
                📈 Waveforms (Time)
              </button>
              <button
                onClick={() => setCurrentTab('bode')}
                style={{
                  padding: '3px 10px',
                  fontSize: '0.8rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: currentTab === 'bode' ? 'var(--signal)' : 'transparent',
                  color: currentTab === 'bode' ? '#fff' : textColor,
                  fontWeight: currentTab === 'bode' ? 600 : 'normal'
                }}
              >
                📊 Frequency (Bode)
              </button>
            </div>
          ) : (
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: textColor }}>
              {activeAnalysis === 'ac' ? 'AC Analysis (Bode Plot)' : 'Transient Analysis'}
            </h3>
          )}

          {currentTab === 'bode' && !hasAcSource && viewMode !== 'minimized' && (
            <span style={{ fontSize: '0.75rem', color: '#e67e22', background: 'rgba(230, 126, 34, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              Notice: No AC source in circuit (response is zero)
            </span>
          )}

          {/* Active Probe Badges */}
          {probes.length > 0 && viewMode !== 'minimized' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', maxWidth: '400px' }}>
              {probes.map(p => (
                <div
                  key={p.nodeId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: p.color,
                    background: theme === 'dark' ? '#181C20' : '#E8E2D8',
                    border: `1px solid ${p.color}88`,
                    borderRadius: '12px',
                    padding: '2px 8px'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: p.color }} />
                  <span>V({p.nodeId})</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProbe(p.nodeId);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: '11px',
                      lineHeight: 1,
                      padding: '0 2px',
                      marginLeft: '2px',
                      opacity: 0.8
                    }}
                    title={`Remove V(${p.nodeId})`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {probes.length > 1 && (
                <button
                  onClick={() => clearProbes()}
                  style={{
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                    opacity: 0.8
                  }}
                  title="Remove all probes"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {viewMode !== 'minimized' && currentTab === 'waveforms' && (
            <>
              <button title="Zoom In" onClick={() => handleZoom(0.5)} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                <ZoomIn size={18} />
              </button>
              <button title="Zoom Out" onClick={() => handleZoom(2.0)} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                <ZoomOut size={18} />
              </button>
              <div style={{ width: '1px', height: '16px', background: borderColor, margin: '0 4px' }} />
            </>
          )}
          
          <button title={viewMode === 'minimized' ? 'Restore' : 'Minimize'} onClick={() => setViewMode(viewMode === 'minimized' ? 'normal' : 'minimized')} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            {viewMode === 'minimized' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          <button title={viewMode === 'fullscreen' ? 'Restore' : 'Full Screen'} onClick={() => setViewMode(viewMode === 'fullscreen' ? 'normal' : 'fullscreen')} style={{ background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            {viewMode === 'fullscreen' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: viewMode === 'minimized' ? 'none' : 'block', position: 'relative', minHeight: 0 }}>
        {probes.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme === 'dark' ? '#7f8c8d' : '#7f8c8d', marginTop: '60px' }}>
            Click a wire or pin with the <strong>Probe</strong> tool to view its {currentTab === 'bode' ? 'frequency response' : 'waveform'}.
          </div>
        ) : (
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );
});
