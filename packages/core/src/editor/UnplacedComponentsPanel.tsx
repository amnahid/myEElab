import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { ComponentLibrary } from '../engine/library';

export const UnplacedComponentsPanel: React.FC = () => {
  const { circuit, theme, startBreadboardPlacement, placingBreadboardComponentId, cancelBreadboardPlacement } = useEditorStore();

  const isDark = theme === 'dark';
  const panelBg = isDark ? '#181825' : 'white';
  const textCol = isDark ? '#cdd6f4' : '#2c3e50';
  const borderCol = isDark ? '#45475a' : '#bdc3c7';
  const hoverBg = isDark ? '#313244' : '#f0f0f0';
  const activeBg = '#3498db';
  const mutedCol = isDark ? '#a6adc8' : '#7f8c8d';

  const placedIds = new Set(circuit.breadboard?.placements.map(p => p.componentId) || []);
  const unplaced = circuit.components.filter(c => c.type !== 'ground' && !placedIds.has(c.id));
  const placed = circuit.components.filter(c => c.type !== 'ground' && placedIds.has(c.id));

  // Get pins for a component type
  const getPinCount = (type: string) => ComponentLibrary[type]?.pins?.length ?? 0;

  return (
    <div style={{
      width: '240px',
      minWidth: '240px',
      height: '100%',
      backgroundColor: panelBg,
      borderLeft: `1px solid ${borderCol}`,
      color: textCol,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Unplaced Section */}
      <div style={{ padding: '12px 14px 6px', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: mutedCol }}>
        Unplaced ({unplaced.length})
      </div>
      <div style={{ padding: '4px 10px' }}>
        {unplaced.length === 0 ? (
          <div style={{ color: mutedCol, fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
            All components placed! 🎉
          </div>
        ) : (
          unplaced.map(comp => {
            const isPlacing = placingBreadboardComponentId === comp.id;
            const pinCount = getPinCount(comp.type);
            return (
              <div 
                key={comp.id}
                onClick={() => isPlacing ? cancelBreadboardPlacement() : startBreadboardPlacement(comp.id)}
                style={{
                  padding: '8px 10px',
                  marginBottom: '4px',
                  backgroundColor: isPlacing ? activeBg : 'transparent',
                  color: isPlacing ? 'white' : textCol,
                  border: `1px solid ${isPlacing ? activeBg : borderCol}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                  fontSize: '0.9rem',
                }}
                onMouseEnter={e => {
                  if (!isPlacing) {
                    e.currentTarget.style.backgroundColor = hoverBg;
                    e.currentTarget.style.borderColor = isDark ? '#585b70' : '#95a5a6';
                  }
                }}
                onMouseLeave={e => {
                  if (!isPlacing) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = borderCol;
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>{comp.refDes || comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({pinCount} pins)</span>
                </div>
                {isPlacing && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px' }}>
                    Placing…
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Placed Section */}
      {placed.length > 0 && (
        <>
          <div style={{ padding: '12px 14px 6px', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: mutedCol, borderTop: `1px solid ${borderCol}`, marginTop: '8px' }}>
            On Board ({placed.length})
          </div>
          <div style={{ padding: '4px 10px' }}>
            {placed.map(comp => (
              <div key={comp.id} style={{
                padding: '6px 10px', marginBottom: '3px',
                fontSize: '0.85rem', opacity: 0.6,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc71', display: 'inline-block' }} />
                {comp.refDes || comp.type}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
