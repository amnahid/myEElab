import re

with open('packages/core/src/editor/ProbeIcon.tsx', 'r') as f:
    content = f.read()

content = content.replace("stroke={theme === 'dark' ? '#cdd6f4' : '#34495e'}", "stroke={theme === 'dark' ? '#EEEAE4' : '#30383E'}")
content = content.replace("fill={theme === 'dark' ? '#181825' : '#ffffff'}", "fill={theme === 'dark' ? '#323A3F' : '#E2DCD3'}")

with open('packages/core/src/editor/ProbeIcon.tsx', 'w') as f:
    f.write(content)
