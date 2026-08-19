import sys

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("overflowY: 'hidden'", "overflowY: 'auto', paddingBottom: '20px'")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
