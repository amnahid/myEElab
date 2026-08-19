import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Change aside width back to 70px
content = content.replace("width: '110px',", "width: '70px',")

# Revert grid back to flex column
old_grid = "display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', width: '100%', padding: '0 10px', boxSizing: 'border-box'"
new_flex = "display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center'"
content = content.replace(old_grid, new_flex)

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Reverted to single column")
