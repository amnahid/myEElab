import React from 'react';
import { Group, Line, Rect, Circle, Text } from 'react-konva';
import { ComponentInstance, BreadboardPlacement } from '../models/circuit';
import { getHolePosition } from './breadboardLayout';
import { useEditorStore } from '../store/editorStore';
import { ComponentLibrary } from '../engine/library';

interface Props {
  component: ComponentInstance;
  placement: BreadboardPlacement;
  isLedLit?: boolean;
  ledIntensity?: number;
}

export const PhysicalComponentNode: React.FC<Props> = React.memo(({ component, placement, isLedLit, ledIntensity }) => {
  const { type } = component;
  const libComp = component.customDefinition || ComponentLibrary[type];
  const pkg = libComp?.package || 'discrete';

  // Render Resistor
  if (type === 'resistor') {
    const pos1 = getHolePosition(placement.legHoles['1']);
    const pos2 = getHolePosition(placement.legHoles['2']);
    
    if (pos1 && pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      // Color bands for resistance
      const bands = ['#8B4513', '#000000', '#FF0000', '#DAA520']; 

      return (
        <Group x={pos1.x} y={pos1.y} rotation={angle}>
          {/* Legs */}
          <Line points={[0, 0, distance, 0]} stroke="#bdc3c7" strokeWidth={2} />
          {/* Body */}
          <Rect x={distance / 2 - 15} y={-5} width={30} height={10} fill="#f1c40f" cornerRadius={3} />
          {/* Bands */}
          <Rect x={distance / 2 - 10} y={-5} width={3} height={10} fill={bands[0]} />
          <Rect x={distance / 2 - 4} y={-5} width={3} height={10} fill={bands[1]} />
          <Rect x={distance / 2 + 2} y={-5} width={3} height={10} fill={bands[2]} />
          <Rect x={distance / 2 + 10} y={-5} width={2} height={10} fill={bands[3]} />
        </Group>
      );
    }
  }

  // Render Capacitor
  if (type === 'capacitor') {
    const pos1 = getHolePosition(placement.legHoles['1']);
    const pos2 = getHolePosition(placement.legHoles['2']);
    
    if (pos1 && pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      return (
        <Group x={pos1.x} y={pos1.y} rotation={angle}>
          {/* Legs */}
          <Line points={[0, 0, distance / 2 - 5, 0]} stroke="#bdc3c7" strokeWidth={2} />
          <Line points={[distance / 2 + 5, 0, distance, 0]} stroke="#bdc3c7" strokeWidth={2} />
          {/* Body (Ceramic disc) */}
          <Circle x={distance / 2} y={0} radius={8} fill="#e67e22" />
          <Text x={distance / 2 - 6} y={-4} text="104" fontSize={6} fill="black" />
        </Group>
      );
    }
  }

  // Render Diode
  if (type === 'diode') {
    const pos1 = getHolePosition(placement.legHoles['1']); // Anode
    const pos2 = getHolePosition(placement.legHoles['2']); // Cathode
    
    if (pos1 && pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      return (
        <Group x={pos1.x} y={pos1.y} rotation={angle}>
          {/* Legs */}
          <Line points={[0, 0, distance, 0]} stroke="#bdc3c7" strokeWidth={2} />
          {/* Body (Glass/Black cylinder) */}
          <Rect x={distance / 2 - 10} y={-4} width={20} height={8} fill="#c0392b" cornerRadius={2} />
          {/* Cathode Stripe */}
          <Rect x={distance / 2 + 4} y={-4} width={4} height={8} fill="#2c3e50" />
        </Group>
      );
    }
  }

  // Render LED
  if (type === 'led') {
    const pos1 = getHolePosition(placement.legHoles['1']); // Anode
    const pos2 = getHolePosition(placement.legHoles['2']); // Cathode
    
    if (pos1 && pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const ledColor = (component.params?.color as string) || '#ff0000';

      return (
        <Group x={pos1.x} y={pos1.y} rotation={angle}>
          {/* Legs */}
          <Line points={[0, 0, distance, 0]} stroke="#bdc3c7" strokeWidth={2} />
          {/* Glow if lit */}
          {isLedLit && (
            <>
              <Circle x={distance / 2} y={0} radius={16} fill={ledColor} opacity={0.35 * (ledIntensity || 1)} listening={false} />
              <Circle x={distance / 2} y={0} radius={24} fill={ledColor} opacity={0.15 * (ledIntensity || 1)} listening={false} />
            </>
          )}
          {/* Body (LED Dome) */}
          <Circle x={distance / 2} y={0} radius={8} fill={isLedLit ? '#ffffff' : ledColor} opacity={isLedLit ? 0.95 : 0.85} />
          {isLedLit && (
            <Circle x={distance / 2} y={0} radius={5} fill={ledColor} opacity={0.8} listening={false} />
          )}
          <Rect x={distance / 2 - 2} y={-8} width={10} height={16} fill={ledColor} opacity={0.85} cornerRadius={[0, 8, 8, 0]} />
          {/* Flat spot for cathode */}
          <Line points={[distance / 2 + 7, -7, distance / 2 + 7, 7]} stroke="#2c3e50" strokeWidth={2} />
        </Group>
      );
    }
  }

  // Render Zener Diode
  if (type === 'zener') {
    const pos1 = getHolePosition(placement.legHoles['1']); // Anode
    const pos2 = getHolePosition(placement.legHoles['2']); // Cathode
    
    if (pos1 && pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      return (
        <Group x={pos1.x} y={pos1.y} rotation={angle}>
          {/* Legs */}
          <Line points={[0, 0, distance, 0]} stroke="#bdc3c7" strokeWidth={2} />
          {/* Body (Glass cylinder) */}
          <Rect x={distance / 2 - 10} y={-4} width={20} height={8} fill="#e67e22" cornerRadius={1} />
          {/* Cathode Stripe (Black) */}
          <Rect x={distance / 2 + 4} y={-4} width={4} height={8} fill="#000000" />
        </Group>
      );
    }
  }
  
  // Render VSource (Battery)
  if (type === 'vsource') {
    const pos1 = getHolePosition(placement.legHoles['1']); // +
    const pos2 = getHolePosition(placement.legHoles['2']); // -
    
    if (pos1 && pos2) {
      return (
        <Group>
          {/* Draw a battery pack off to the side, with wires to pos1/pos2 */}
          <Rect x={-100} y={pos1.y - 20} width={60} height={40} fill="#2c3e50" cornerRadius={5} />
          <Text x={-80} y={pos1.y - 5} text="9V" fill="white" fontSize={14} />
          <Line points={[-40, pos1.y - 10, pos1.x, pos1.y]} stroke="red" strokeWidth={3} />
          <Line points={[-40, pos1.y + 10, pos2.x, pos2.y]} stroke="black" strokeWidth={3} />
        </Group>
      );
    }
  }

  // Render Clock (Pulse Generator Source)
  if (type === 'clock') {
    const pos1 = getHolePosition(placement.legHoles['1']); // + (CLK)
    const pos2 = getHolePosition(placement.legHoles['2']); // - (GND)
    
    if (pos1 && pos2) {
      const freq = component.params?.frequency || '1k';
      return (
        <Group>
          {/* Module box */}
          <Rect x={-110} y={pos1.y - 25} width={70} height={50} fill="#1a252f" stroke="#34495e" strokeWidth={1.5} cornerRadius={4} />
          <Text x={-105} y={pos1.y - 18} text="CLK GEN" fill="#2ecc71" fontSize={10} fontStyle="bold" />
          <Text x={-105} y={pos1.y - 2} text={`${freq}Hz`} fill="#ecf0f1" fontSize={11} />
          {/* Leads */}
          <Line points={[-40, pos1.y - 10, pos1.x, pos1.y]} stroke="#e74c3c" strokeWidth={3} />
          <Line points={[-40, pos1.y + 10, pos2.x, pos2.y]} stroke="#34495e" strokeWidth={3} />
        </Group>
      );
    }
  }

  // Render Pushbutton
  if (type === 'pushbutton') {
    const pos1 = getHolePosition(placement.legHoles['1']); // L1
    const pos2 = getHolePosition(placement.legHoles['2']); // L2
    const pos3 = getHolePosition(placement.legHoles['3']); // R1
    const pos4 = getHolePosition(placement.legHoles['4']); // R2
    
    const validPos = [pos1, pos2, pos3, pos4].filter((p): p is { x: number; y: number } => Boolean(p));
    if (validPos.length > 0) {
      const cx = validPos.reduce((sum, p) => sum + p.x, 0) / validPos.length;
      const cy = validPos.reduce((sum, p) => sum + p.y, 0) / validPos.length;
      const isClosed = component.params?.state === 'closed';

      return (
        <Group x={cx} y={cy}>
          {/* Draw legs from center to holes */}
          {pos1 && <Line points={[0, 0, pos1.x - cx, pos1.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          {pos2 && <Line points={[0, 0, pos2.x - cx, pos2.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          {pos3 && <Line points={[0, 0, pos3.x - cx, pos3.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          {pos4 && <Line points={[0, 0, pos4.x - cx, pos4.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          
          {/* Body */}
          <Rect x={-12} y={-12} width={24} height={24} fill="#2c3e50" cornerRadius={2} />
          {/* Button */}
          <Circle x={0} y={0} radius={isClosed ? 5 : 6} fill={isClosed ? "#c0392b" : "#e74c3c"} />
          
          {/* Interactive Hitbox */}
          <Rect x={-12} y={-12} width={24} height={24} fill="transparent"
            onMouseDown={(e) => {
              if (component.id === 'ghost') return;
              e.cancelBubble = true;
              useEditorStore.getState().updateComponentParams(component.id, { state: 'closed' });
            }}
            onMouseUp={(e) => {
              if (component.id === 'ghost') return;
              e.cancelBubble = true;
              useEditorStore.getState().updateComponentParams(component.id, { state: 'open' });
            }}
            onMouseLeave={() => {
              if (component.id === 'ghost') return;
              useEditorStore.getState().updateComponentParams(component.id, { state: 'open' });
            }}
          />
        </Group>
      );
    }
  }

  // Render Switch (SPST Slide Switch)
  if (type === 'switch') {
    const pos1 = getHolePosition(placement.legHoles['1']);
    const pos2 = getHolePosition(placement.legHoles['2']);
    
    if (pos1 && pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const isClosed = component.params?.state === 'closed';

      return (
        <Group x={pos1.x} y={pos1.y} rotation={angle}>
          {/* Connecting wire leads */}
          <Line points={[0, 0, distance, 0]} stroke="#bdc3c7" strokeWidth={2} />
          {/* Main switch body */}
          <Rect x={distance / 2 - 14} y={-8} width={28} height={16} fill="#27272a" cornerRadius={2} stroke="#3f3f46" strokeWidth={1} />
          {/* Metal housing cover */}
          <Rect x={distance / 2 - 12} y={-6} width={24} height={12} fill="#71717a" cornerRadius={1.5} />
          {/* Slider track */}
          <Rect x={distance / 2 - 8} y={-3} width={16} height={6} fill="#18181b" cornerRadius={1} />
          {/* Actuator handle */}
          <Rect 
            x={isClosed ? distance / 2 : distance / 2 - 8} 
            y={-5} 
            width={8} 
            height={10} 
            fill={isClosed ? '#22c55e' : '#e4e4e7'} 
            cornerRadius={1}
            stroke="#09090b"
            strokeWidth={0.5}
          />
          {/* Clickable toggle hit area */}
          <Rect 
            x={distance / 2 - 14} y={-8} width={28} height={16} fill="transparent"
            onClick={(e) => {
              if (component.id === 'ghost') return;
              e.cancelBubble = true;
              const nextState = isClosed ? 'open' : 'closed';
              useEditorStore.getState().updateComponentParams(component.id, { state: nextState });
            }}
            onTap={(e) => {
              if (component.id === 'ghost') return;
              e.cancelBubble = true;
              const nextState = isClosed ? 'open' : 'closed';
              useEditorStore.getState().updateComponentParams(component.id, { state: nextState });
            }}
          />
        </Group>
      );
    }
  }

  // Render DIP Package (DIP-8, DIP-14, DIP-16, NE555, TL072, 74HC, etc.)
  const isDIP = pkg === 'dip8' || pkg === 'dip14' || pkg === 'dip16' || type === 'ne555' || type === 'tl072' || type === 'opamp' || type.startsWith('74hc');
  if (isDIP) {
    const holeEntries = Object.entries(placement.legHoles)
      .map(([pinId, hId]) => ({ pinId, pos: getHolePosition(hId) }))
      .filter((e): e is { pinId: string; pos: { x: number; y: number } } => Boolean(e.pos));

    if (holeEntries.length >= 2) {
      const xs = holeEntries.map(e => e.pos.x);
      const ys = holeEntries.map(e => e.pos.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const bodyWidth = Math.max(22, (maxX - minX) - 8);
      const bodyHeight = (maxY - minY) + 14;
      const chipName = (component.params?.model as string) || libComp?.name || type.toUpperCase();

      return (
        <Group>
          {/* Silver pins to holes */}
          {holeEntries.map(e => (
            <Line
              key={e.pinId}
              points={[centerX > e.pos.x ? centerX - bodyWidth / 2 : centerX + bodyWidth / 2, e.pos.y, e.pos.x, e.pos.y]}
              stroke="#bdc3c7"
              strokeWidth={3}
            />
          ))}

          {/* IC Body */}
          <Rect
            x={centerX - bodyWidth / 2}
            y={minY - 7}
            width={bodyWidth}
            height={bodyHeight}
            fill="#1e272e"
            stroke="#111111"
            strokeWidth={1}
            cornerRadius={2}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.4}
          />

          {/* Pin 1 Notch at top */}
          <Circle
            x={centerX}
            y={minY - 7}
            radius={3.5}
            fill="#111111"
          />

          {/* Pin 1 Index Dot */}
          <Circle
            x={centerX - bodyWidth / 2 + 4}
            y={minY - 1}
            radius={1.5}
            fill="#718093"
          />

          {/* Laser-etched text */}
          <Text
            text={chipName}
            x={centerX - bodyWidth / 2}
            y={centerY - 4}
            width={bodyWidth}
            align="center"
            fontSize={7}
            fill="#d2dae2"
            fontStyle="bold"
          />
        </Group>
      );
    }
  }

  // Render TO-220 Package (LM7805, Power Regulators/MOSFETs)
  if (pkg === 'to220' || type === 'lm7805') {
    const pos1 = getHolePosition(placement.legHoles['1']);
    const pos2 = getHolePosition(placement.legHoles['2']);
    const pos3 = getHolePosition(placement.legHoles['3']);
    const valid = [pos1, pos2, pos3].filter((p): p is { x: number; y: number } => Boolean(p));

    if (valid.length >= 2) {
      const cx = valid.reduce((sum, p) => sum + p.x, 0) / valid.length;
      const cy = valid.reduce((sum, p) => sum + p.y, 0) / valid.length;

      return (
        <Group x={cx} y={cy}>
          {/* Leads */}
          {valid.map((p, idx) => (
            <Line key={idx} points={[0, 0, p.x - cx, p.y - cy]} stroke="#bdc3c7" strokeWidth={2.5} />
          ))}
          {/* Metal Heatsink Tab */}
          <Rect x={-12} y={-18} width={24} height={8} fill="#bdc3c7" stroke="#7f8c8d" strokeWidth={1} cornerRadius={1} />
          {/* Mounting Hole */}
          <Circle x={0} y={-14} radius={2.5} fill="#7f8c8d" />
          {/* Black molded epoxy body */}
          <Rect x={-12} y={-10} width={24} height={14} fill="#2c3e50" stroke="#1a252f" strokeWidth={1} cornerRadius={1} />
          <Text text="7805" x={-12} y={-6} width={24} align="center" fontSize={6.5} fill="#ecf0f1" fontStyle="bold" />
        </Group>
      );
    }
  }

  // Render TO-92 Package (Transistors NPN/PNP, BS170)
  if (pkg === 'to92' || type === 'npn' || type === 'pnp' || type === 'nmos' || type === 'pmos') {
    const pins = [
      getHolePosition(placement.legHoles['1'] || placement.legHoles['c'] || placement.legHoles['d']),
      getHolePosition(placement.legHoles['2'] || placement.legHoles['b'] || placement.legHoles['g']),
      getHolePosition(placement.legHoles['3'] || placement.legHoles['e'] || placement.legHoles['s'])
    ].filter((p): p is { x: number; y: number } => Boolean(p));

    if (pins.length >= 2) {
      const cx = pins.reduce((sum, p) => sum + p.x, 0) / pins.length;
      const cy = pins.reduce((sum, p) => sum + p.y, 0) / pins.length;
      const label = (component.params?.model as string) || (type === 'npn' ? '2N3904' : type === 'pnp' ? '2N3906' : 'BS170');

      return (
        <Group x={cx} y={cy}>
          {pins.map((p, idx) => (
            <Line key={idx} points={[0, 0, p.x - cx, p.y - cy]} stroke="#bdc3c7" strokeWidth={2} />
          ))}
          {/* D-shaped package */}
          <Circle x={0} y={-2} radius={7} fill="#2c3e50" stroke="#1a252f" strokeWidth={1} />
          <Rect x={-7} y={-2} width={14} height={6} fill="#2c3e50" stroke="#1a252f" strokeWidth={1} />
          <Line points={[-7, 4, 7, 4]} stroke="#1a252f" strokeWidth={1.5} />
          <Text text={label.slice(0, 5)} x={-7} y={-5} width={14} align="center" fontSize={5} fill="#bdc3c7" />
        </Group>
      );
    }
  }

  // Fallback for unsupported components: draw red/magenta dots at holes
  const p1 = getHolePosition(placement.legHoles['1'] || placement.legHoles['c'] || placement.legHoles['d'] || placement.legHoles['in+']);
  const p2 = getHolePosition(placement.legHoles['2'] || placement.legHoles['e'] || placement.legHoles['s'] || placement.legHoles['out']);
  
  return (
    <Group>
      {p1 && <Circle x={p1.x} y={p1.y} radius={4} fill="magenta" />}
      {p2 && <Circle x={p2.x} y={p2.y} radius={4} fill="magenta" />}
    </Group>
  );
});
