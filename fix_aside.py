import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Change overflowY: 'hidden' to overflow: 'visible' in aside
content = content.replace("overflowY: 'hidden'", "overflow: 'visible'")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
