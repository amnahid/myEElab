import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add state and effect
state_injection = """  const [showAnalysisSettings, setShowAnalysisSettings] = useState(false);
  const [showMoreComponents, setShowMoreComponents] = useState(false);

  const componentsContainerRef = useRef<HTMLDivElement>(null);
  const [maxVisibleComponents, setMaxVisibleComponents] = useState(6);

  useEffect(() => {
    if (!componentsContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        const itemHeight = 44; // 36px button + 8px gap
        const totalItems = Object.keys(ComponentLibrary).length;
        if (totalItems * itemHeight <= height + 8) {
          setMaxVisibleComponents(totalItems);
        } else {
          setMaxVisibleComponents(Math.max(1, Math.floor((height - itemHeight) / itemHeight)));
        }
      }
    });
    observer.observe(componentsContainerRef.current);
    return () => observer.disconnect();
  }, []);"""

content = content.replace("  const [showAnalysisSettings, setShowAnalysisSettings] = useState(false);\n  const [showMoreComponents, setShowMoreComponents] = useState(false);", state_injection)

# 2. Update the components container
# Find the line: <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
# right after <div style={{ width: '80%', height: '1px', backgroundColor: colors.border }} />

old_container = "<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>"
new_container = "<div ref={componentsContainerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center', overflow: 'hidden' }}>"
content = content.replace(old_container, new_container)

# 3. Update the slice(0, 6)
content = content.replace("Object.entries(ComponentLibrary).slice(0, 6).map", "Object.entries(ComponentLibrary).slice(0, maxVisibleComponents).map")

# 4. Conditionally render the '...' button and the overflow components
# Currently we just have: <div style={{ position: 'relative' }}>
# We need to wrap it in: {Object.keys(ComponentLibrary).length > maxVisibleComponents && ( ... )}

old_more_button = """            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowMoreComponents(!showMoreComponents)}"""

new_more_button = """            {Object.keys(ComponentLibrary).length > maxVisibleComponents && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowMoreComponents(!showMoreComponents)}"""
content = content.replace(old_more_button, new_more_button)

# The end of that block is:
old_end_more_button = """                    </button>
                  ))}
                </div>
              )}
            </div>"""

new_end_more_button = """                    </button>
                  ))}
                </div>
              )}
            </div>
            )}"""
content = content.replace(old_end_more_button, new_end_more_button)

# Also update the overflow mapping
# From: Object.entries(ComponentLibrary).slice(6).map
# To: Object.entries(ComponentLibrary).slice(maxVisibleComponents).map
content = content.replace("Object.entries(ComponentLibrary).slice(6).map", "Object.entries(ComponentLibrary).slice(maxVisibleComponents).map")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
