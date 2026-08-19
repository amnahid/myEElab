import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Update colors
colors_old = """    headerBg: isDark ? '#323A3F' : '#E2DCD3',
    toolbarBg: isDark ? '#323A3F' : '#E2DCD3',"""
colors_new = """    headerBg: isDark ? '#323A3F' : '#E2DCD3',
    toolbarBg: isDark ? '#262D32' : '#D0C8B8',"""
content = content.replace(colors_old, colors_new)

# 2. Extract tools, components, and actions from the header.
# They are inside:
# {/* Toolbars Container */}
# <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
#   <div style={{ display: 'flex', gap: '5px', background: colors.toolbarBg...
# ...
#   <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto'... (Analysis)

tools_pattern = r"(<div style={{ display: 'flex', gap: '5px', background: colors\.toolbarBg, padding: '5px', borderRadius: '5px' }}>\s*<button[\s\S]*?title=\"Add Probe\"\s*>\s*<ProbeMenuIcon[\s\S]*?</button>\s*</div>)"
components_pattern = r"(<div style={{ display: 'flex', gap: '8px', background: colors\.toolbarBg, padding: '8px', borderRadius: '5px', overflowX: 'auto' }}>\s*\{Object\.entries\(ComponentLibrary\)\.map[\s\S]*?</button>\s*\)\)}\s*</div>)"
actions_pattern = r"(<div style={{ display: 'flex', gap: '5px', background: colors\.toolbarBg, padding: '5px', borderRadius: '5px' }}>\s*<button[\s\S]*?title=\"Undo.*?[\s\S]*?</button>\s*</div>)"

tools_match = re.search(tools_pattern, content)
components_match = re.search(components_pattern, content)
actions_match = re.search(actions_pattern, content)

if not (tools_match and components_match and actions_match):
    print("Could not match toolbar sections!")
    exit(1)

tools_html = tools_match.group(1)
components_html = components_match.group(1)
actions_html = actions_match.group(1)

# Remove them from the header
content = content.replace(tools_html, "")
content = content.replace(components_html, "")
content = content.replace(actions_html, "")

# Modify the styling of these sections for vertical layout
tools_html = tools_html.replace("display: 'flex', gap: '5px'", "display: 'flex', flexDirection: 'column', gap: '5px'")
components_html = components_html.replace("display: 'flex', gap: '8px', background: colors.toolbarBg, padding: '8px', borderRadius: '5px', overflowX: 'auto'", "display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', background: 'transparent', padding: '0'")
actions_html = actions_html.replace("display: 'flex', gap: '5px'", "display: 'flex', flexDirection: 'column', gap: '5px'")
actions_html = actions_html.replace("<div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />", "<div style={{ height: '1px', width: '100%', background: colors.border, margin: '5px 0' }} />")

# 3. Create the sidebar and wrap the main area
sidebar_html = f"""
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ 
          width: '80px', 
          backgroundColor: colors.headerBg, 
          borderRight: `1px solid ${{colors.border}}`,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '10px 0', 
          gap: '20px',
          overflowY: 'auto'
        }}>
          {tools_html}
          {components_html}
          <div style={{ flex: 1 }} />
          {actions_html}
        </aside>
"""

main_start = "<main style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden', backgroundColor: colors.bg }}>"
content = content.replace(main_start, sidebar_html + "\n        " + main_start)

# Close the flex container at the end of main
main_end = "</main>"
content = content.replace(main_end, "</main>\n      </div>")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
print("Success")
