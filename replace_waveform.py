import re

with open('packages/core/src/editor/WaveformViewer.tsx', 'r') as f:
    content = f.read()

content = content.replace("const textColor = theme === 'dark' ? '#cdd6f4' : '#2c3e50';", "const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';")
content = content.replace("const gridColor = theme === 'dark' ? '#313244' : '#eeeeee';", "const gridColor = theme === 'dark' ? '#323A3F' : '#E2DCD3';")
content = content.replace("const bgColor = theme === 'dark' ? '#181825' : 'white';", "const bgColor = theme === 'dark' ? '#323A3F' : '#EEEAE4';")
content = content.replace("const borderColor = theme === 'dark' ? '#313244' : '#ccc';", "const borderColor = theme === 'dark' ? '#323A3F' : '#30383E';")

with open('packages/core/src/editor/WaveformViewer.tsx', 'w') as f:
    f.write(content)
