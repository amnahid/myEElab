import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Replace global header color
content = content.replace("backgroundColor: colors.headerBg, \n        color: 'white',", "backgroundColor: colors.headerBg, \n        color: colors.text,")

# Replace icons and transparent buttons
content = content.replace("background: mode === 'select' ? 'var(--highlight)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer'", "background: mode === 'select' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer'")
content = content.replace("background: mode === 'wire' ? 'var(--highlight)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer'", "background: mode === 'wire' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer'")
content = content.replace("background: mode === 'probe' ? 'var(--highlight)' : 'transparent', border: 'none', color: 'white', cursor: 'pointer'", "background: mode === 'probe' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer'")

# Toolbar place items
content = content.replace("border: 'none',\n                  color: 'white',\n                  padding: '8px',", "border: 'none',\n                  color: colors.text,\n                  padding: '8px',")

# Undo, Redo, Rotate
content = content.replace("style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}", "style={{ background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer' }}")

# Hide Instruments, Go to Breadboard, Dark Mode
content = content.replace("style={{ padding: '8px 12px', background: colors.toolbarBg, color: 'white', border: 'none', borderRadius: '5px'", "style={{ padding: '8px 12px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px'")
content = content.replace("style={{ padding: '8px', background: colors.toolbarBg, color: 'white', border: 'none', borderRadius: '5px'", "style={{ padding: '8px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px'")

# Replace ProbeMenuIcon color
content = content.replace("<ProbeMenuIcon size={20} color=\"white\" />", "<ProbeMenuIcon size={20} color={colors.text} />")

# Custom SPICE Apply button
content = content.replace("background: '#3498db', color: 'white', border: 'none'", "background: 'var(--signal)', color: 'white', border: 'none'")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
