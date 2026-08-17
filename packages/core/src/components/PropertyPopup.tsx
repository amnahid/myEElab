import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { ComponentLibrary } from '../engine/library';

export const PropertyPopup: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const { circuit, editingComponentId, updateComponentParams, updateWireColor, setEditingComponent, scale, stagePos } = useEditorStore();
  const editingComponent = circuit.components.find(c => c.id === editingComponentId);
  const editingWire = circuit.wires.find(w => w.id === editingComponentId);

  // For making the popup draggable
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Position it initially near the component or wire
  useEffect(() => {
    if (editingComponentId) {
      let screenX, screenY;
      if (editingComponent) {
        screenX = editingComponent.position.x * scale + stagePos.x;
        screenY = editingComponent.position.y * scale + stagePos.y;
      } else if (editingWire) {
        screenX = editingWire.points[0].x * scale + stagePos.x;
        screenY = editingWire.points[0].y * scale + stagePos.y;
      }
      
      if (screenX !== undefined && screenY !== undefined) {
        setPosition({ x: screenX + 50, y: screenY - 50 });
      }
    }
  }, [editingComponentId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition(prev => ({
          x: prev.x + (e.clientX - dragStart.current.x),
          y: prev.y + (e.clientY - dragStart.current.y)
        }));
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!editingComponent && !editingWire) return null;

  const isDark = theme === 'dark';
  const colors = isDark ? {
    bg: '#1e1e2e',
    text: '#cdd6f4',
    border: '#313244',
    inputBg: '#181825',
    headerBg: '#313244',
  } : {
    bg: '#ffffff',
    text: '#2c3e50',
    border: '#bdc3c7',
    inputBg: '#ecf0f1',
    headerBg: '#ecf0f1',
  };

  const libComp = editingComponent ? ComponentLibrary[editingComponent.type] : null;
  const compName = editingComponent ? (libComp?.name || editingComponent.type) : 'Wire';

  return (
    <div 
      ref={popupRef}
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        width: '260px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header / Drag Handle */}
      <div 
        style={{
          padding: '10px 15px',
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          dragStart.current = { x: e.clientX, y: e.clientY };
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: colors.text }}>
          {compName} Properties
        </span>
        <button 
          onClick={() => setEditingComponent(null)}
          style={{
            background: 'none', border: 'none', color: colors.text, cursor: 'pointer',
            fontSize: '1.2rem', padding: '0 5px', lineHeight: 1
          }}
        >
          &times;
        </button>
      </div>

      {/* Form Content */}
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '400px' }}>
        
        {editingComponent && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>RefDes (Name)</label>
              <input 
                type="text" 
                value={editingComponent.refDes || ''} 
                onChange={e => updateComponentParams(editingComponent.id, { refDes: e.target.value })}
                placeholder={`Auto (${editingComponent.type})`}
                style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Color</label>
              <input 
                type="color"
                value={editingComponent.color || '#000000'}
                onChange={(e) => updateComponentParams(editingComponent.id, { color: e.target.value })}
                style={{ width: '100%', height: '30px', padding: '0', border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer' }}
              />
            </div>
          </>
        )}

        {editingWire && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Wire Color</label>
            <input 
              type="color"
              value={editingWire.color || (isDark ? '#89b4fa' : '#34495e')}
              onChange={(e) => updateWireColor(editingWire.id, e.target.value)}
              style={{ width: '100%', height: '30px', padding: '0', border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer' }}
            />
          </div>
        )}

        {/* Component-Specific Properties */}
        {editingComponent && editingComponent.type === 'resistor' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Resistance (Ω)</label>
            <input type="text" value={editingComponent.params.resistance || '1k'} onChange={e => updateComponentParams(editingComponent.id, { resistance: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
          </div>
        )}
        
        {editingComponent && editingComponent.type === 'capacitor' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Capacitance (F)</label>
            <input type="text" value={editingComponent.params.capacitance || '1u'} onChange={e => updateComponentParams(editingComponent.id, { capacitance: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
          </div>
        )}
        
        {editingComponent && editingComponent.type === 'inductor' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Inductance (H)</label>
            <input type="text" value={editingComponent.params.inductance || '1m'} onChange={e => updateComponentParams(editingComponent.id, { inductance: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
          </div>
        )}

        {editingComponent && (editingComponent.type === 'vsource' || editingComponent.type === 'isource') && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Source Type</label>
              <select 
                value={editingComponent.params.type || 'dc'} 
                onChange={e => updateComponentParams(editingComponent.id, { type: e.target.value })}
                style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }}
              >
                <option value="dc">DC</option>
                <option value="ac">AC</option>
                <option value="sin">Sine (Transient)</option>
              </select>
            </div>
            {(!editingComponent.params.type || editingComponent.params.type === 'dc') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>DC Value ({editingComponent.type === 'vsource' ? 'V' : 'A'})</label>
                <input type="text" value={editingComponent.params.dc || editingComponent.params.value || '0'} onChange={e => updateComponentParams(editingComponent.id, { dc: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
              </div>
            )}
            {editingComponent.params.type === 'sin' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>DC Offset ({editingComponent.type === 'vsource' ? 'V' : 'A'})</label>
                  <input type="text" value={editingComponent.params.offset || '0'} onChange={e => updateComponentParams(editingComponent.id, { offset: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Amplitude ({editingComponent.type === 'vsource' ? 'V' : 'A'})</label>
                  <input type="text" value={editingComponent.params.amplitude || '5'} onChange={e => updateComponentParams(editingComponent.id, { amplitude: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Frequency (Hz)</label>
                  <input type="text" value={editingComponent.params.frequency || '1k'} onChange={e => updateComponentParams(editingComponent.id, { frequency: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
                </div>
              </>
            )}
          </>
        )}

        {editingComponent && editingComponent.type === 'powersupply' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>DC Voltage (V)</label>
            <input type="text" value={editingComponent.params.dc || '5'} onChange={e => updateComponentParams(editingComponent.id, { dc: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
          </div>
        )}

        {editingComponent && editingComponent.type === 'functiongenerator' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Waveform</label>
              <select 
                value={editingComponent.params.type || 'sine'} 
                onChange={e => updateComponentParams(editingComponent.id, { type: e.target.value })}
                style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }}
              >
                <option value="sine">Sine</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Amplitude (V)</label>
              <input type="text" value={editingComponent.params.amplitude || '5'} onChange={e => updateComponentParams(editingComponent.id, { amplitude: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Frequency (Hz)</label>
              <input type="text" value={editingComponent.params.frequency || '1k'} onChange={e => updateComponentParams(editingComponent.id, { frequency: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
            </div>
          </>
        )}

        {editingComponent && ['diode', 'npn', 'pnp', 'nmos', 'pmos', 'opamp'].includes(editingComponent.type) && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Spice Model</label>
            <input 
              type="text" 
              value={editingComponent.params.model || libComp?.defaultParams?.model || ''} 
              onChange={e => updateComponentParams(editingComponent.id, { model: e.target.value })}
              style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};
