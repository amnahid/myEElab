import sys

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update aside width and overflow
old_aside = """        <aside style={{ 
          width: '70px', 
          backgroundColor: colors.headerBg, 
          borderRight: `1px solid ${colors.border}`,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '10px 0', 
          gap: '15px',
          overflowY: 'auto'
        }}>"""

new_aside = """        <aside style={{ 
          width: '110px', 
          backgroundColor: colors.headerBg, 
          borderRight: `1px solid ${colors.border}`,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '10px 0', 
          gap: '15px',
          overflowY: 'hidden'
        }}>"""
content = content.replace(old_aside, new_aside)

# 2. Update Tools container
old_tools = "<div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', alignItems: 'center' }}>\n            <button \n              onClick={() => setMode('select')}"
new_tools = "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>\n            <button \n              onClick={() => setMode('select')}"
content = content.replace(old_tools, new_tools)

# 3. Update Components container
old_comps = "<div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', alignItems: 'center' }}>\n            {Object.entries(ComponentLibrary).map(([type, comp]) => ("
new_comps = "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>\n            {Object.entries(ComponentLibrary).map(([type, comp]) => ("
content = content.replace(old_comps, new_comps)

# 4. Update Actions container
old_actions = "<div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', alignItems: 'center' }}>\n            <button \n              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px' }}\n              onClick={() => useEditorStore.temporal.getState().undo()}"
new_actions = "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>\n            <button \n              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}\n              onClick={() => useEditorStore.temporal.getState().undo()}"
content = content.replace(old_actions, new_actions)

# For actions, we also need to add display: flex to the other buttons to center the icons.
content = content.replace("style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px' }}", "style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)

print("Success")
