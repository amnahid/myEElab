import re

with open('packages/core/src/editor/WaveformViewer.tsx', 'r') as f:
    content = f.read()

new_render = """
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
"""

# Find the LAST occurrence of "  return (" just in case
idx = content.rfind("  return (")
content = content[:idx] + new_render + "\n};\n"

with open('packages/core/src/editor/WaveformViewer.tsx', 'w') as f:
    f.write(content)

print("Render replaced successfully")
