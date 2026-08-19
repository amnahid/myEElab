import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# Restore theme toggle button in the header
# It was removed previously. Let's add it before the final </div> of the header.
header_end = "          </button>\n        </div>\n      </header>"
theme_btn = """          </button>

          <button 
            onClick={() => useEditorStore.getState().setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ padding: '8px', background: colors.toolbarBg, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>"""
if 'Dark Mode' not in content:
    content = content.replace(header_end, theme_btn)

# Fix Run Sim button color (#2ecc71 -> var(--signal))
content = content.replace("background: '#2ecc71'", "background: 'var(--signal)'")
# Fix Auto button color (#3498db -> var(--tech), #95a5a6 -> var(--ink))
content = content.replace("background: autoSimulate ? '#3498db' : '#95a5a6'", "background: autoSimulate ? 'var(--tech)' : 'gray'")
# Fix mode buttons
content = content.replace("background: mode === 'select' ? '#3498db' : 'transparent'", "background: mode === 'select' ? 'var(--highlight)' : 'transparent'")
content = content.replace("background: mode === 'wire' ? '#3498db' : 'transparent'", "background: mode === 'wire' ? 'var(--highlight)' : 'transparent'")
content = content.replace("background: mode === 'probe' ? '#3498db' : 'transparent'", "background: mode === 'probe' ? 'var(--highlight)' : 'transparent'")
content = content.replace("background: mode === 'place' && componentToPlace === type ? (theme === 'dark' ? '#4c566a' : '#ddd') : 'transparent'", "background: mode === 'place' && componentToPlace === type ? 'var(--highlight)' : 'transparent'")
content = content.replace("color: showAnalysisSettings ? '#3498db' : colors.text", "color: showAnalysisSettings ? 'var(--highlight)' : colors.text")

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)

