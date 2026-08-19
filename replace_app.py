import re

with open('packages/core/src/App.tsx', 'r') as f:
    content = f.read()

# 1. Replace PhysicalComponentIcons
new_icons = """const PhysicalComponentIcons: Record<string, React.ReactNode> = {
  resistor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="6" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="6" y="8" width="12" height="8" fill="var(--highlight)" stroke="var(--accent)" strokeWidth="1" rx="2" />
      <rect x="8" y="8" width="2" height="8" fill="#8B4513" />
      <rect x="12" y="8" width="2" height="8" fill="#000000" />
      <rect x="16" y="8" width="2" height="8" fill="#FF0000" />
    </svg>
  ),
  capacitor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="8" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="16" x2="12" y2="22" stroke="var(--foreground)" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1" />
    </svg>
  ),
  inductor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="8" y="6" width="8" height="12" fill="var(--ink)" rx="3" />
      <path d="M 8 9 h 8 M 8 12 h 8 M 8 15 h 8" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  ),
  vsource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" fill="var(--background)" rx="2" />
      <rect x="6" y="6" width="12" height="6" fill="var(--ink)" rx="1" />
      <circle cx="8" cy="16" r="2" fill="var(--accent)" />
      <circle cx="16" cy="16" r="2" fill="var(--foreground)" />
    </svg>
  ),
  function_generator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" fill="var(--foreground)" rx="2" />
      <rect x="6" y="6" width="12" height="6" fill="var(--ink)" rx="1" />
      <path d="M 8 9 Q 10 7 12 9 T 16 9" stroke="var(--signal)" strokeWidth="1.5" />
      <circle cx="12" cy="16" r="2" fill="var(--accent)" />
    </svg>
  ),
  isource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="var(--foreground)" rx="2" />
      <path d="M 12 18 V 6 M 9 9 l 3 -3 l 3 3" stroke="var(--highlight)" strokeWidth="1.5" />
    </svg>
  ),
  ground: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 4 v 8" />
      <path d="M 6 12 h 12" />
      <path d="M 8 16 h 8" />
      <path d="M 10 20 h 4" />
    </svg>
  ),
  diode: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="6" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="6" y="8" width="12" height="8" fill="var(--accent)" rx="1" />
      <rect x="16" y="8" width="2" height="8" fill="var(--ink)" />
    </svg>
  ),
  npn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 4 20 Q 12 4 20 20" fill="var(--foreground)" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  pnp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 4 20 Q 12 4 20 20" fill="var(--foreground)" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  nmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="var(--foreground)" rx="1" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  pmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="var(--foreground)" rx="1" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  opamp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" fill="var(--ink)" rx="1" />
      <circle cx="7" cy="9" r="1" fill="var(--panel)" />
      <line x1="4" y1="8" x2="2" y2="8" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="4" y1="12" x2="2" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="4" y1="16" x2="2" y2="16" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="20" y1="8" x2="22" y2="8" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="20" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="20" y1="16" x2="22" y2="16" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),

  oscilloscope: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" fill="var(--foreground)" rx="2" />
      <rect x="4" y="6" width="12" height="10" fill="var(--signal)" />
      <circle cx="18" cy="8" r="1" fill="var(--panel)" />
      <circle cx="18" cy="12" r="1" fill="var(--panel)" />
      <circle cx="18" cy="16" r="1" fill="var(--panel)" />
    </svg>
  ),
  multimeter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" fill="var(--highlight)" rx="2" />
      <rect x="6" y="4" width="12" height="6" fill="var(--panel)" rx="1" />
      <circle cx="12" cy="14" r="3" fill="var(--foreground)" />
      <circle cx="8" cy="19" r="1" fill="var(--accent)" />
      <circle cx="16" cy="19" r="1" fill="var(--ink)" />
    </svg>
  ),
  current_probe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" stroke="var(--foreground)" />
      <path d="M12 2v4" stroke="var(--accent)" />
      <path d="M12 18v4" stroke="var(--ink)" />
    </svg>
  ),
  breadboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="1" rx="2" />
      <circle cx="6" cy="10" r="1" fill="var(--ink)" />
      <circle cx="10" cy="10" r="1" fill="var(--ink)" />
      <circle cx="14" cy="10" r="1" fill="var(--ink)" />
      <circle cx="18" cy="10" r="1" fill="var(--ink)" />
      <circle cx="6" cy="14" r="1" fill="var(--ink)" />
      <circle cx="10" cy="14" r="1" fill="var(--ink)" />
      <circle cx="14" cy="14" r="1" fill="var(--ink)" />
      <circle cx="18" cy="14" r="1" fill="var(--ink)" />
    </svg>
  )
};"""
content = re.sub(r'const PhysicalComponentIcons: Record<string, React\.ReactNode> = \{.*?\n\};\n', new_icons + '\n', content, flags=re.DOTALL)

# 2. Add setTheme and useEffect for system theme
new_hooks = """  } = useEditorStore();
  const theme = useEditorStore(state => state.theme);
  const setTheme = useEditorStore(state => state.setTheme);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      
      // Set initial
      setTheme(mediaQuery.matches ? 'dark' : 'light');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [setTheme]);"""

content = re.sub(
    r'  \} = useEditorStore\(\);\n  const theme = useEditorStore\(state => state\.theme\);\n  const toggleTheme = useEditorStore\(state => state\.toggleTheme\);',
    new_hooks,
    content
)

# 3. Update colors object
new_colors = """  // Theme palette
  const colors = {
    bg: 'var(--background)',
    headerBg: 'var(--panel)',
    toolbarBg: 'var(--panel)',
    panelBg: 'var(--panel)',
    text: 'var(--foreground)',
    border: 'var(--ink)',
    inputBg: 'var(--background)',
    buttonHover: 'var(--ink)'
  };"""

content = re.sub(
    r'  // Theme palette\n  const colors = \{.*?  \};',
    new_colors,
    content,
    flags=re.DOTALL
)

# 4. Remove Theme Toggle button
content = re.sub(
    r'          <button \n            onClick=\{toggleTheme\}\n            style=\{\{ padding: \'8px\', background: colors\.toolbarBg, color: \'white\', border: \'none\', borderRadius: \'5px\', cursor: \'pointer\' \}\}\n          >\n            \{isDark \? \'Light Mode\' : \'Dark Mode\'\}\n          </button>\n',
    '',
    content
)

with open('packages/core/src/App.tsx', 'w') as f:
    f.write(content)
