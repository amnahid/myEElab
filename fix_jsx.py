import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Fix the broken braces
content = content.replace("<div style={ display: 'flex', flex: 1, overflow: 'hidden' }>", "<div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>")
content = content.replace("<aside style={ \n          width: '80px',", "<aside style={{ \n          width: '80px',")
content = content.replace("overflowY: 'auto'\n        }>", "overflowY: 'auto'\n        }}>")
content = content.replace("<div style={ flex: 1 } />", "<div style={{ flex: 1 }} />")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)

