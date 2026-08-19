import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# The actions block in the sidebar starts with:
actions_start = "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>\n            <button \n              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}\n              onClick={() => useEditorStore.temporal.getState().undo()}"

# Wait, let's just find the Undo button and capture the whole grid div.
# Instead of regex, let's use string splitting.
idx1 = content.find("onClick={() => useEditorStore.temporal.getState().undo()}")
if idx1 != -1:
    div_start = content.rfind("<div style={{", 0, idx1)
    div_end = content.find("</div>", content.find("Trash2", idx1)) + 6
    actions_html = content[div_start:div_end]
    
    # Remove it from sidebar
    content = content[:div_start] + content[div_end:]
    
    # Wait, there's also a separator line before it.
    sep = "<div style={{ width: '80%', height: '1px', backgroundColor: colors.border }} />"
    sep_idx = content.rfind(sep, 0, div_start)
    if sep_idx != -1 and (div_start - sep_idx) < 100: # Ensure it's close
        content = content[:sep_idx] + content[sep_idx + len(sep):]
    
    # Now format actions_html for the horizontal topbar
    actions_html = actions_html.replace("display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px', width: '100%', padding: '0 10px', boxSizing: 'border-box'", "display: 'flex', gap: '5px', background: colors.toolbarBg, padding: '5px', borderRadius: '5px'")
    
    # Add the separator back between Rotate and Trash inside the flex row
    # Oh wait, we had a vertical separator in the topbar before.
    actions_html = actions_html.replace("<Trash2", "<div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />\n              <Trash2")
    
    # Insert into the topbar.
    # We want it after Auto: ON/OFF
    insert_target = "{/* Toolbars Container */}\n        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>"
    content = content.replace(insert_target, insert_target + "\n          " + actions_html)

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
