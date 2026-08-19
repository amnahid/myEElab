import sys

with open('packages/core/src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* Toolbars Container */}" in line:
        start_idx = i
    if "<main style={{ flex: 1, position: 'relative'" in line:
        end_idx = i

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

new_code = """        {/* Toolbars Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', background: colors.toolbarBg, padding: '5px 10px', borderRadius: '5px', position: 'relative' }}>
            <select 
              value={activeAnalysis} 
              onChange={(e) => {
                setActiveAnalysis(e.target.value as 'op' | 'tran' | 'ac');
                setShowAnalysisSettings(false);
              }}
              style={{ padding: '5px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: colors.inputBg, color: colors.text }}
            >
              <option value="op">DC (.op)</option>
              <option value="tran">Transient (.tran)</option>
              <option value="ac">AC Sweep (.ac)</option>
            </select>
            
            {activeAnalysis !== 'op' && (
              <button
                onClick={() => setShowAnalysisSettings(!showAnalysisSettings)}
                style={{ background: 'transparent', color: showAnalysisSettings ? 'var(--highlight)' : colors.text, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Analysis Settings"
              >
                <Settings size={18} />
              </button>
            )}

            {showAnalysisSettings && activeAnalysis !== 'op' && (
              <div style={{ 
                position: 'absolute', 
                top: '120%', 
                right: 0, 
                background: colors.panelBg, 
                padding: '15px', 
                borderRadius: '6px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '220px',
                border: `1px solid ${colors.border}`
              }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: colors.text, borderBottom: `1px solid ${colors.border}`, paddingBottom: '5px' }}>
                  {activeAnalysis === 'tran' ? 'Transient Settings' : 'AC Sweep Settings'}
                </h4>
                
                {activeAnalysis === 'tran' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Step Time (e.g. 100u)</label>
                      <input 
                        type="text" 
                        value={circuit.analyses.find(a => a.kind === 'tran')?.params.step || '100u'} 
                        onChange={(e) => updateAnalysis('tran', { step: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Stop Time (e.g. 10m)</label>
                      <input 
                        type="text" 
                        value={circuit.analyses.find(a => a.kind === 'tran')?.params.stop || '10m'} 
                        onChange={(e) => updateAnalysis('tran', { stop: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      />
                    </div>
                  </>
                )}
                
                {activeAnalysis === 'ac' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Sweep Type</label>
                      <select 
                        value={circuit.analyses.find(a => a.kind === 'ac')?.params.variation || 'dec'}
                        onChange={(e) => updateAnalysis('ac', { variation: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      >
                        <option value="dec">Decade</option>
                        <option value="oct">Octave</option>
                        <option value="lin">Linear</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Points / Sweep</label>
                      <input 
                        type="text" 
                        value={circuit.analyses.find(a => a.kind === 'ac')?.params.points || '10'} 
                        onChange={(e) => updateAnalysis('ac', { points: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: colors.text }}>Start Freq</label>
                        <input 
                          type="text" 
                          value={circuit.analyses.find(a => a.kind === 'ac')?.params.fstart || '1'} 
                          onChange={(e) => updateAnalysis('ac', { fstart: e.target.value })}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: colors.text }}>Stop Freq</label>
                        <input 
                          type="text" 
                          value={circuit.analyses.find(a => a.kind === 'ac')?.params.fstop || '1Meg'} 
                          onChange={(e) => updateAnalysis('ac', { fstop: e.target.value })}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button 
            title={showInstruments ? 'Hide Instruments' : 'Show Instruments'}
            onClick={() => setShowInstruments(!showInstruments)}
            style={{ padding: '8px 12px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '34px' }}
          >
            {showInstruments ? <EyeOff size={18} /> : <Eye size={18} />}
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              {showInstruments ? 'Hide Instruments' : 'Show Instruments'}
            </span>
          </button>

          <button 
            onClick={() => setActiveView(activeView === 'schematic' ? 'breadboard' : 'schematic')}
            style={{ padding: '8px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Go to {activeView === 'schematic' ? 'Breadboard' : 'Schematic'}
          </button>

          <button 
            onClick={() => useEditorStore.getState().setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ padding: '8px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      {simError && (
          <div style={{ position: 'absolute', top: '70px', right: '20px', background: '#e74c3c', color: 'white', padding: '10px', borderRadius: '4px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {simError}
          </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ 
          width: '70px', 
          backgroundColor: colors.headerBg, 
          borderRight: `1px solid ${colors.border}`,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '10px 0', 
          gap: '15px',
          overflowY: 'auto'
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', alignItems: 'center' }}>
            <button 
              onClick={() => setMode('select')}
              style={{ padding: '8px', background: mode === 'select' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px' }}
              title="Select / Move"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 3 3 l 7.07 16.97 2.51-7.39 7.39-2.51 L 3 3 z" />
                <path d="M 13 13 l 6 6" />
              </svg>
            </button>
            <button 
              onClick={() => setMode('wire')}
              style={{ padding: '8px', background: mode === 'wire' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px' }}
              title="Draw Wire"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 5 9 L 19 9" />
                <circle cx="5" cy="9" r="2" fill="currentColor" />
                <circle cx="19" cy="9" r="2" fill="currentColor" />
              </svg>
            </button>
            <button 
              onClick={() => setMode('probe')}
              style={{ padding: '8px', background: mode === 'probe' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px' }}
              title="Add Probe"
            >
              <ProbeMenuIcon size={20} color={colors.text} />
            </button>
          </div>

          <div style={{ width: '80%', height: '1px', backgroundColor: colors.border }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', alignItems: 'center' }}>
            {Object.entries(ComponentLibrary).map(([type, comp]) => (
              <button 
                key={type}
                title={`Place ${comp.name || type}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('componentType', type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => {
                  setMode('place', type);
                }}
                style={{
                  background: mode === 'place' && componentToPlace === type ? 'var(--highlight)' : 'transparent',
                  border: 'none',
                  color: colors.text,
                  padding: '8px',
                  borderRadius: '5px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', display: 'flex' }}>
                  {activeView === 'breadboard' ? PhysicalComponentIcons[type] : ComponentIcons[type]}
                </div>
              </button>
            ))}
          </div>
          
          <div style={{ flex: 1 }} />
          
          <div style={{ width: '80%', height: '1px', backgroundColor: colors.border }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', alignItems: 'center' }}>
            <button 
              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px' }}
              onClick={() => useEditorStore.temporal.getState().undo()} title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button 
              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px' }}
              onClick={() => useEditorStore.temporal.getState().redo()} title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
            <button 
              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px' }}
              onClick={() => rotateSelected()} title="Rotate (R)"
            >
              <RotateCw size={18} />
            </button>
            <button 
              style={{ padding: '8px', background: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', borderRadius: '5px' }}
              onClick={() => {
                if (window.confirm("Are you sure you want to clear the entire circuit?")) {
                  clearAll();
                  useEditorStore.temporal.getState().clear();
                }
              }} title="Clear Circuit"
            >
              <Trash2 size={18} />
            </button>
          </div>

        </aside>

"""

lines = lines[:start_idx] + [new_code] + lines[end_idx:]

with open('packages/core/src/App.tsx', 'w') as f:
    f.writelines(lines)

