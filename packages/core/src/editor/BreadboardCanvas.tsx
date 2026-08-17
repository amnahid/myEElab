import React, { useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Group, Line, Text, Circle } from 'react-konva';
import { useEditorStore } from '../store/editorStore';
import { ComponentLibrary } from '../engine/library';
import { PhysicalComponentNode } from './PhysicalComponentNode';
import { getHolePosition, HOLES, GRID_SIZE, BOARD_WIDTH, BOARD_HEIGHT, START_Y } from './breadboardLayout';

// Breadboard tool modes
type BreadboardTool = 'select' | 'jumper';

export const BreadboardCanvas: React.FC = () => {
  const {
    circuit, theme, activeView, mode, componentToPlace,
    placingBreadboardComponentId, placedLegs,
    addPlacedLeg, cancelBreadboardPlacement, placeOnBreadboard,
    addJumperWire, setSelection, addComponent,
  } = useEditorStore();

  const [hoveredHole, setHoveredHole] = useState<string | null>(null);
  const [bbTool, setBbTool] = useState<BreadboardTool>('select');
  const [jumperStart, setJumperStart] = useState<string | null>(null);

  // Build a set of occupied holes for highlighting
  const occupiedHoles = useMemo(() => {
    const set = new Set<string>();
    for (const p of circuit.breadboard?.placements || []) {
      for (const holeId of Object.values(p.legHoles)) {
        set.add(holeId);
      }
    }
    return set;
  }, [circuit.breadboard?.placements]);

  // Figure out what pin we're placing next
  const placingComponent = circuit.components.find(c => c.id === placingBreadboardComponentId);
  const placingPins = placingComponent ? (ComponentLibrary[placingComponent.type]?.pins || []) : [];
  const remainingPins = placingPins.filter(p => !placedLegs[p.id]);
  const nextPin = remainingPins.length > 0 ? remainingPins[0] : null;

  if (activeView !== 'breadboard') return null;

  const isDark = theme === 'dark';
  const bgFill = isDark ? '#1e1e2e' : '#f0f0f0';
  const boardFill = isDark ? '#e8e8e8' : '#ffffff';
  const holeFill = '#444';
  const holeOccupiedFill = '#2ecc71';
  const holeHoverFill = '#3498db';
  const holePlacingFill = '#e67e22';

  const handleHoleClick = useCallback((holeId: string) => {
    // Priority 1: If we're in jumper mode
    if (bbTool === 'jumper') {
      if (!jumperStart) {
        setJumperStart(holeId);
      } else {
        // Complete the jumper
        const startPos = getHolePosition(jumperStart);
        const endPos = getHolePosition(holeId);
        if (startPos && endPos) {
          const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          addJumperWire(jumperStart, holeId, color, [startPos, endPos]);
        }
        setJumperStart(null);
      }
      return;
    }

    // Priority 2: If we're in place mode from toolbar (no placement started yet)
    if (mode === 'place' && componentToPlace && !placingBreadboardComponentId) {
      if (occupiedHoles.has(holeId)) return;
      // addComponent in breadboard mode auto-starts placement
      addComponent(componentToPlace, { x: 0, y: 0 });
      // The store will set placingBreadboardComponentId, but we need to wait
      // for next render. The first pin click will be handled on the next click.
      return;
    }

    // Priority 3: If we're placing a component's pins
    if (placingBreadboardComponentId && nextPin) {
      // Check if hole is already occupied
      if (occupiedHoles.has(holeId)) return;

      const newLegs = { ...placedLegs, [nextPin.id]: holeId };
      addPlacedLeg(nextPin.id, holeId);

      // Check if all pins are now placed
      const allPlaced = placingPins.every(p => newLegs[p.id]);
      if (allPlaced) {
        placeOnBreadboard(placingBreadboardComponentId, newLegs);
      }
    }
  }, [bbTool, jumperStart, mode, componentToPlace, placingBreadboardComponentId, nextPin, placedLegs, placingPins, occupiedHoles, addPlacedLeg, placeOnBreadboard, addJumperWire, addComponent]);

  // Keyboard handler for Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (jumperStart) {
        setJumperStart(null);
      } else if (placingBreadboardComponentId) {
        cancelBreadboardPlacement();
      } else if (bbTool === 'jumper') {
        setBbTool('select');
      }
    }
  }, [jumperStart, placingBreadboardComponentId, cancelBreadboardPlacement, bbTool]);

  // Status bar message
  let statusMsg = '';
  if (mode === 'place' && componentToPlace && !placingBreadboardComponentId) {
    statusMsg = `Click a hole to place a new ${componentToPlace}. (Esc to cancel)`;
  } else if (placingBreadboardComponentId && nextPin) {
    const compLabel = placingComponent?.refDes || placingComponent?.type || '';
    statusMsg = `Click a hole to place pin "${nextPin.label || nextPin.id}" of ${compLabel}. (Esc to cancel)`;
  } else if (bbTool === 'jumper') {
    if (jumperStart) {
      statusMsg = `Click another hole to finish the jumper wire. (Esc to cancel)`;
    } else {
      statusMsg = `Click a hole to start a jumper wire. (Esc to exit jumper mode)`;
    }
  }

  // Get hole fill color
  const getHoleFill = (holeId: string) => {
    if (hoveredHole === holeId) {
      if (placingBreadboardComponentId) return holePlacingFill;
      if (bbTool === 'jumper') return '#9b59b6';
      return holeHoverFill;
    }
    if (occupiedHoles.has(holeId)) return holeOccupiedFill;
    // Highlight already-placed legs during placement
    if (Object.values(placedLegs).includes(holeId)) return holePlacingFill;
    if (jumperStart === holeId) return '#9b59b6';
    return holeFill;
  };

  return (
    <div
      style={{ flex: 1, height: '100%', background: bgFill, overflow: 'hidden', position: 'relative', outline: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Breadboard Toolbar */}
      <div style={{
        position: 'absolute', top: '10px', left: '10px', zIndex: 20,
        display: 'flex', gap: '5px',
        background: isDark ? '#313244' : '#34495e',
        padding: '5px', borderRadius: '5px',
      }}>
        <button
          onClick={() => { setBbTool('select'); setJumperStart(null); }}
          style={{
            padding: '6px 12px', border: 'none', borderRadius: '3px', cursor: 'pointer',
            background: bbTool === 'select' ? '#3498db' : 'transparent',
            color: 'white', fontWeight: 'bold', fontSize: '0.85rem'
          }}
        >
          Select
        </button>
        <button
          onClick={() => { setBbTool('jumper'); cancelBreadboardPlacement(); }}
          style={{
            padding: '6px 12px', border: 'none', borderRadius: '3px', cursor: 'pointer',
            background: bbTool === 'jumper' ? '#9b59b6' : 'transparent',
            color: 'white', fontWeight: 'bold', fontSize: '0.85rem'
          }}
        >
          Jumper Wire
        </button>
      </div>

      {/* Status Bar */}
      {statusMsg && (
        <div style={{
          position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: isDark ? '#313244' : '#2c3e50',
          color: 'white', padding: '8px 16px', borderRadius: '20px',
          fontSize: '0.9rem', fontWeight: '500', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap'
        }}>
          {statusMsg}
        </div>
      )}

      <Stage width={window.innerWidth - 250} height={window.innerHeight - 50}>
        <Layer>
          <Group x={150} y={30}>
            {/* Breadboard Base */}
            <Rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill={boardFill} cornerRadius={10} shadowBlur={10} shadowOpacity={0.2} />

            {/* Center Trench */}
            <Rect x={145} y={10} width={10} height={BOARD_HEIGHT - 20} fill="#ccc" cornerRadius={5} />

            {/* Power Lines Red/Blue */}
            <Line points={[27, 20, 27, BOARD_HEIGHT - 20]} stroke="#3498db" strokeWidth={1.5} dash={[4, 4]} />
            <Line points={[42, 20, 42, BOARD_HEIGHT - 20]} stroke="#e74c3c" strokeWidth={1.5} dash={[4, 4]} />
            <Line points={[258, 20, 258, BOARD_HEIGHT - 20]} stroke="#e74c3c" strokeWidth={1.5} dash={[4, 4]} />
            <Line points={[273, 20, 273, BOARD_HEIGHT - 20]} stroke="#3498db" strokeWidth={1.5} dash={[4, 4]} />

            {/* Row Labels */}
            {Array.from({ length: 30 }, (_, i) => (
              <Text
                key={`lbl-${i}`}
                x={55}
                y={START_Y + i * GRID_SIZE - 4}
                text={`${i + 1}`}
                fontSize={7}
                fill="#999"
              />
            ))}

            {/* Column Labels */}
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((col, idx) => {
              const x = idx < 5 ? 70 + idx * GRID_SIZE : 160 + (idx - 5) * GRID_SIZE;
              return (
                <Text key={`col-${col}`} x={x - 2} y={12} text={col} fontSize={7} fill="#999" />
              );
            })}

            {/* Holes */}
            {HOLES.map(hole => {
              const pos = getHolePosition(hole.id);
              if (!pos) return null;

              const fill = getHoleFill(hole.id);
              const size = (hoveredHole === hole.id) ? 8 : 6;

              return (
                <Rect
                  key={hole.id}
                  x={pos.x - size / 2}
                  y={pos.y - size / 2}
                  width={size}
                  height={size}
                  fill={fill}
                  cornerRadius={1}
                  onMouseEnter={() => setHoveredHole(hole.id)}
                  onMouseLeave={() => setHoveredHole(null)}
                  onClick={() => handleHoleClick(hole.id)}
                  onTap={() => handleHoleClick(hole.id)}
                />
              );
            })}

            {/* Jumper Wires */}
            {circuit.breadboard?.jumperWires.map(jumper => {
              const startPos = getHolePosition(jumper.startHole);
              const endPos = getHolePosition(jumper.endHole);
              if (!startPos || !endPos) return null;
              return (
                <Group key={jumper.id}>
                  <Line
                    points={[startPos.x, startPos.y, endPos.x, endPos.y]}
                    stroke={jumper.color}
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.3}
                    hitStrokeWidth={12}
                    onClick={() => setSelection([jumper.id])}
                  />
                  <Circle x={startPos.x} y={startPos.y} radius={4} fill={jumper.color} />
                  <Circle x={endPos.x} y={endPos.y} radius={4} fill={jumper.color} />
                </Group>
              );
            })}

            {/* Jumper preview line */}
            {jumperStart && hoveredHole && jumperStart !== hoveredHole && (() => {
              const startPos = getHolePosition(jumperStart);
              const endPos = getHolePosition(hoveredHole);
              if (!startPos || !endPos) return null;
              return (
                <Line
                  points={[startPos.x, startPos.y, endPos.x, endPos.y]}
                  stroke="#9b59b6"
                  strokeWidth={3}
                  dash={[6, 4]}
                  opacity={0.6}
                  listening={false}
                />
              );
            })()}

            {/* Components */}
            {circuit.breadboard?.placements.map(placement => {
              const comp = circuit.components.find(c => c.id === placement.componentId);
              if (!comp) return null;
              return <PhysicalComponentNode key={placement.componentId} component={comp} placement={placement} />;
            })}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};
