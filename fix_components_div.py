import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Replace overflow: 'hidden' with overflow: 'visible' in the componentsContainerRef div
old_div = "<div ref={componentsContainerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center', overflow: 'hidden' }}>"
new_div = "<div ref={componentsContainerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center', overflow: 'visible' }}>"
content = content.replace(old_div, new_div)

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
