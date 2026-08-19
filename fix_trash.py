import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Fix the separator
bad_html = "<div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />\n              <Trash2"
# I want it outside the button.
# Let's just find the trash button and fix it.
# Actually it's easier to just do a string replace on the whole block.
content = content.replace("<div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />\n              <Trash2", "<Trash2")
content = content.replace("title=\"Rotate (R)\"\n            >\n              <RotateCw size={18} />\n            </button>\n            <button", "title=\"Rotate (R)\"\n            >\n              <RotateCw size={18} />\n            </button>\n            <div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />\n            <button")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Fixed")
