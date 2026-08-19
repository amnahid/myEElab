import re

with open('packages/core/src/editor/WaveformViewer.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { useEditorStore } from '../store/editorStore';", "import { useEditorStore } from '../store/editorStore';\nimport { Minimize2, Maximize2, ZoomIn, ZoomOut, ChevronDown, ChevronUp } from 'lucide-react';")

# 2. Add viewMode state
content = content.replace("const [height, setHeight] = useState(250);", "const [height, setHeight] = useState(250);\n  const [viewMode, setViewMode] = useState<'normal' | 'minimized' | 'fullscreen'>('normal');")

# 3. Update useEffect dependencies and height logic
# Wait, the resize logic relies on `height`. If fullscreen, height should be window.innerHeight - 60 (header).
# I'll just change the opts.height dynamically.
opts_block = """
    const opts: uPlot.Options = {
      title: "Transient Analysis",
      id: "chart",
      class: "waveform-plot",
      width: containerRef.current.offsetWidth,
      height: viewMode === 'fullscreen' ? window.innerHeight - 100 : (viewMode === 'minimized' ? 0 : height - 50),
"""
content = content.replace("height: height - 50,", "height: viewMode === 'fullscreen' ? window.innerHeight - 110 : (viewMode === 'minimized' ? 0 : height - 50),")

handle_resize = """        plotRef.current.setSize({
          width: containerRef.current.offsetWidth,
          height: height - 50
        });"""
new_handle_resize = """        plotRef.current.setSize({
          width: containerRef.current.offsetWidth,
          height: viewMode === 'fullscreen' ? window.innerHeight - 110 : (viewMode === 'minimized' ? 0 : height - 50)
        });"""
content = content.replace(handle_resize, new_handle_resize)

content = content.replace("}, [data, probes, theme, height]);", "}, [data, probes, theme, height, viewMode]);")

# 4. Zoom functions
zoom_logic = """
  const handleZoom = (factor: number) => {
    if (!plotRef.current) return;
    const x = plotRef.current.scales.x;
    if (x.min == null || x.max == null) return;
    const range = x.max - x.min;
    const center = x.min + range / 2;
    const newRange = range * factor;
    plotRef.current.setScale('x', { min: center - newRange / 2, max: center + newRange / 2 });
  };
"""

# Insert before handleMouseDown
content = content.replace("const handleMouseDown", zoom_logic + "\n  const handleMouseDown")

# 5. Render logic
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

# Extract the old return block
idx1 = content.find("  return (")
content = content[:idx1] + new_render

# Also remove the title from opts to avoid duplicate title
content = content.replace('title: "Transient Analysis",', 'title: "",')

with open('packages/core/src/editor/WaveformViewer.tsx', 'w') as f:
    f.write(content)
print("Done")
