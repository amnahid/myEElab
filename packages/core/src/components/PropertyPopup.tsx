import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { ComponentLibrary } from '../engine/library';
import { ValueUnitInput } from './ValueUnitInput';

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
    bg: '#323A3F',
    text: '#EEEAE4',
    border: '#EEEAE4',
    inputBg: '#20252A',
    headerBg: '#262D32',
  } : {
    bg: '#E2DCD3',
    text: '#30383E',
    border: '#30383E',
    inputBg: '#EEEAE4',
    headerBg: '#D0C8B8',
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
        width: '300px',
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
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', overflowX: 'hidden', maxHeight: '400px' }}>
        
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
            <ValueUnitInput colors={colors} value={editingComponent.params.resistance || '1k'} onChange={val => updateComponentParams(editingComponent.id, { resistance: val })} />
          </div>
        )}
        
        {editingComponent && editingComponent.type === 'capacitor' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Capacitance (F)</label>
            <ValueUnitInput colors={colors} value={editingComponent.params.capacitance || '1u'} onChange={val => updateComponentParams(editingComponent.id, { capacitance: val })} />
          </div>
        )}
        
        {editingComponent && editingComponent.type === 'inductor' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Inductance (H)</label>
            <ValueUnitInput colors={colors} value={editingComponent.params.inductance || '1m'} onChange={val => updateComponentParams(editingComponent.id, { inductance: val })} />
          </div>
        )}

        {editingComponent && (editingComponent.type === 'vsource' || editingComponent.type === 'function_generator' || editingComponent.type === 'isource') && (
          <>
            {editingComponent.type !== 'vsource' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Source Type</label>
                <select 
                  value={editingComponent.params.type || (editingComponent.type === 'function_generator' ? 'sin' : 'dc')} 
                  onChange={e => updateComponentParams(editingComponent.id, { type: e.target.value })}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }}
                >
                  <option value="dc">DC</option>
                  <option value="ac">AC</option>
                  <option value="sin">Sine (Transient)</option>
                </select>
              </div>
            )}
            {(!editingComponent.params.type || editingComponent.params.type === 'dc') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>DC Value ({(editingComponent.type === 'vsource' || editingComponent.type === 'function_generator') ? 'V' : 'A'})</label>
                <ValueUnitInput colors={colors} value={editingComponent.params.dc || editingComponent.params.value || '0'} onChange={val => updateComponentParams(editingComponent.id, { dc: val })} />
              </div>
            )}
            {editingComponent.params.type === 'ac' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>DC Bias ({(editingComponent.type === 'vsource' || editingComponent.type === 'function_generator') ? 'V' : 'A'})</label>
                  <ValueUnitInput colors={colors} value={editingComponent.params.dc || '0'} onChange={val => updateComponentParams(editingComponent.id, { dc: val })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>AC Magnitude ({(editingComponent.type === 'vsource' || editingComponent.type === 'function_generator') ? 'V' : 'A'})</label>
                  <ValueUnitInput colors={colors} value={editingComponent.params.acMag || '1'} onChange={val => updateComponentParams(editingComponent.id, { acMag: val })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>AC Phase (°)</label>
                  <input type="text" value={editingComponent.params.acPhase || '0'} onChange={e => updateComponentParams(editingComponent.id, { acPhase: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
                </div>
              </>
            )}
            {editingComponent.params.type === 'sin' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>DC Offset ({(editingComponent.type === 'vsource' || editingComponent.type === 'function_generator') ? 'V' : 'A'})</label>
                  <ValueUnitInput colors={colors} value={editingComponent.params.offset || '0'} onChange={val => updateComponentParams(editingComponent.id, { offset: val })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Amplitude ({(editingComponent.type === 'vsource' || editingComponent.type === 'function_generator') ? 'V' : 'A'})</label>
                  <ValueUnitInput colors={colors} value={editingComponent.params.amplitude || '5'} onChange={val => updateComponentParams(editingComponent.id, { amplitude: val })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Amplitude Mode</label>
                  <select
                    value={editingComponent.params.amplitudeMode || 'peak'}
                    onChange={e => updateComponentParams(editingComponent.id, { amplitudeMode: e.target.value })}
                    style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }}
                  >
                    <option value="peak">Peak</option>
                    <option value="pp">P-P</option>
                    <option value="rms">RMS</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Frequency (Hz)</label>
                  <ValueUnitInput colors={colors} value={editingComponent.params.frequency || '1k'} onChange={val => updateComponentParams(editingComponent.id, { frequency: val })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Phase (°)</label>
                  <input type="number" value={editingComponent.params.phase || '0'} onChange={e => updateComponentParams(editingComponent.id, { phase: e.target.value })} style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }} />
                </div>
              </>
            )}
          </>
        )}

        {editingComponent && editingComponent.type === 'multimeter' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: colors.text }}>Mode</label>
            <select
              value={editingComponent.params.mode || 'voltage'}
              onChange={e => updateComponentParams(editingComponent.id, { mode: e.target.value })}
              style={{ width: '100%', padding: '6px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text, boxSizing: 'border-box' }}
            >
              <option value="voltage">DC Voltage (V)</option>
              <option value="ac_voltage">AC Voltage (V rms)</option>
              <option value="current">DC Current (A)</option>
              <option value="ac_current">AC Current (A rms)</option>
              <option value="resistance">Resistance (Ω)</option>
            </select>
          </div>
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
