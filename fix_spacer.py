import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Remove the flex: 1 spacer at the end of the aside
content = content.replace("<div style={{ flex: 1 }} />\n          \n          \n\n          \n\n        </aside>", "</aside>")
# Also try replacing just the div if there are different whitespaces
content = re.sub(r"<div style={{ flex: 1 }} />\s*</aside>", "</aside>", content)

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
