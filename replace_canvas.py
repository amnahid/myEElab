import re

with open('packages/core/src/editor/Canvas.tsx', 'r') as f:
    content = f.read()

# backgroundColor
content = content.replace("theme === 'dark' ? '#1e1e2e' : '#f0f0f0'", "theme === 'dark' ? '#20252A' : '#EEEAE4'")

# Selection outline
content = content.replace("theme === 'dark' ? '#f39c12' : '#e67e22'", "theme === 'dark' ? '#B9924D' : '#B9924D'")

# Junction circles
content = content.replace("theme === 'dark' ? '#cdd6f4' : '#34495e'", "theme === 'dark' ? '#EEEAE4' : '#30383E'")

# Wires/general strokes
content = content.replace("theme === 'dark' ? '#cdd6f4' : '#95a5a6'", "theme === 'dark' ? '#EEEAE4' : '#30383E'")

# Node terminal fills
content = content.replace("theme === 'dark' ? '#181825' : '#ffffff'", "theme === 'dark' ? '#323A3F' : '#E2DCD3'")

# Node terminal active strokes
content = content.replace("theme === 'dark' ? '#89b4fa' : '#3498db'", "theme === 'dark' ? '#367985' : '#367985'")
content = content.replace("theme === 'dark' ? '#89b4fa' : '#2980b9'", "theme === 'dark' ? '#367985' : '#367985'")

# Snap circles
content = content.replace("theme === 'dark' ? '#f1c40f' : '#e67e22'", "theme === 'dark' ? '#B9924D' : '#B9924D'")

with open('packages/core/src/editor/Canvas.tsx', 'w') as f:
    f.write(content)
