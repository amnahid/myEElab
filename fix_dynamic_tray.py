import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Fix the Tools block: remove ref, remove flex: 1, remove overflow: hidden
old_tools_div = "<div ref={componentsContainerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center', overflow: 'hidden' }}>"
new_tools_div = "<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>"
# Only replace the first occurrence
content = content.replace(old_tools_div, new_tools_div, 1)

# 2. Fix itemHeight in ResizeObserver to 53
content = content.replace("const itemHeight = 44; // 36px button + 8px gap", "const itemHeight = 54; // 46px button + 8px gap")

# 3. Ensure the ResizeObserver logic accounts for the ... button properly
# It already does: (height - itemHeight) / itemHeight

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Fixed dynamic tray bugs")
