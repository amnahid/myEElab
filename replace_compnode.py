import re

with open('packages/core/src/editor/ComponentNode.tsx', 'r') as f:
    content = f.read()

# Replace specific contrast colors
content = content.replace("const defaultStroke = theme === 'dark' ? '#cdd6f4' : 'black';", "const defaultStroke = theme === 'dark' ? '#EEEAE4' : '#30383E';")
content = content.replace("const textColor = theme === 'dark' ? '#a6adc8' : '#333';", "const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';")
content = content.replace("const subTextColor = theme === 'dark' ? '#7f849c' : '#666';", "const subTextColor = theme === 'dark' ? '#E2DCD3' : '#30383E';")
content = content.replace("fill={theme === 'dark' ? '#1e1e2e' : \"white\"}", "fill={theme === 'dark' ? '#20252A' : '#EEEAE4'}")
content = content.replace("fill={theme === 'dark' ? '#1e1e2e' : 'white'}", "fill={theme === 'dark' ? '#20252A' : '#EEEAE4'}")
content = content.replace("fill={theme === 'dark' ? '#2a2a35' : '#ffffff'}", "fill={theme === 'dark' ? '#323A3F' : '#E2DCD3'}")
content = content.replace("fill={theme === 'dark' ? '#1e1e2e' : '#e0e0e0'}", "fill={theme === 'dark' ? '#20252A' : '#E2DCD3'}")
content = content.replace("fill={theme === 'dark' ? '#1a1a2e' : '#333'}", "fill={theme === 'dark' ? '#20252A' : '#30383E'}")
content = content.replace("const bgFill = theme === 'dark' ? '#1e1e2e' : '#f0f0f0';", "const bgFill = theme === 'dark' ? '#20252A' : '#EEEAE4';")
content = content.replace("stroke={isSelected ? '#3498db' : strokeColor}", "stroke={isSelected ? '#B9924D' : strokeColor}")
content = content.replace("stroke={isSelected ? '#3498db' : 'transparent'}", "stroke={isSelected ? '#B9924D' : 'transparent'}")

with open('packages/core/src/editor/ComponentNode.tsx', 'w') as f:
    f.write(content)
