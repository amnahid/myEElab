import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [showAnalysisSettings, setShowAnalysisSettings] = useState(false);", "const [showAnalysisSettings, setShowAnalysisSettings] = useState(false);\n  const [showMoreComponents, setShowMoreComponents] = useState(false);")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
