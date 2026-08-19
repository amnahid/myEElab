import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update lucide-react import
content = content.replace("EyeOff } from 'lucide-react';", "EyeOff, MoreHorizontal } from 'lucide-react';")

# 2. Add state
content = content.replace("const [showInstruments, setShowInstruments] = useState(true);", "const [showInstruments, setShowInstruments] = useState(true);\n  const [showMoreComponents, setShowMoreComponents] = useState(false);")

# 3. Define the new components block
new_components_block = """          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
            {Object.entries(ComponentLibrary).slice(0, 6).map(([type, comp]) => (
              <button 
                key={type}
                title={`Place ${comp.name || type}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('componentType', type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => {
                  setMode('place', type);
                }}
                style={{
                  background: mode === 'place' && componentToPlace === type ? 'var(--highlight)' : 'transparent',
                  border: 'none',
                  color: colors.text,
                  padding: '8px',
                  borderRadius: '5px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', display: 'flex' }}>
                  {activeView === 'breadboard' ? PhysicalComponentIcons[type] : ComponentIcons[type]}
                </div>
              </button>
            ))}

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowMoreComponents(!showMoreComponents)}
                style={{ padding: '8px', background: showMoreComponents ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="More Components"
              >
                <MoreHorizontal size={20} />
              </button>

              {showMoreComponents && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '-150%',
                  marginLeft: '15px',
                  background: colors.panelBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '5px',
                  padding: '10px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  {Object.entries(ComponentLibrary).slice(6).map(([type, comp]) => (
                    <button 
                      key={type}
                      title={`Place ${comp.name || type}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('componentType', type);
                        e.dataTransfer.effectAllowed = 'copy';
                        setShowMoreComponents(false);
                      }}
                      onClick={() => {
                        setMode('place', type);
                        setShowMoreComponents(false);
                      }}
                      style={{
                        background: mode === 'place' && componentToPlace === type ? 'var(--highlight)' : 'transparent',
                        border: 'none',
                        color: colors.text,
                        padding: '8px',
                        borderRadius: '5px',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', display: 'flex' }}>
                        {activeView === 'breadboard' ? PhysicalComponentIcons[type] : ComponentIcons[type]}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>"""

# Find the old components block and replace it.
# We'll use regex to capture it from `<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>` to its `</div>` right before the flex: 1 spacer.
# Since it's multiline and could have nested divs, we'll manually slice.
idx1 = content.find("Object.entries(ComponentLibrary).map")
if idx1 != -1:
    div_start = content.rfind("<div", 0, idx1)
    # The end is right before `<div style={{ flex: 1 }} />`
    flex_1_idx = content.find("<div style={{ flex: 1 }} />", idx1)
    
    # We want to replace from div_start to the `</div>` before flex_1_idx
    div_end = content.rfind("</div>", idx1, flex_1_idx) + 6
    
    content = content[:div_start] + new_components_block + content[div_end:]

# Turn off overflowY: auto so it doesn't scroll
content = content.replace("overflowY: 'auto', paddingBottom: '20px'", "overflowY: 'hidden'")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
