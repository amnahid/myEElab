import React from 'react';
import { Group, Line, Rect, Circle, Text } from 'react-konva';
import { ComponentInstance, BreadboardPlacement } from '../models/circuit';
import { getHolePosition } from './breadboardLayout';
import { useEditorStore } from '../store/editorStore';

interface Props {
  component: ComponentInstance;
  placement: BreadboardPlacement;
}

export const PhysicalComponentNode: React.FC<Props> = ({ component, placement }) => {
  const { type } = component;

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
      // Simplified colors:
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
          {/* Body (LED Dome) */}
          <Circle x={distance / 2} y={0} radius={8} fill={ledColor} opacity={0.85} shadowColor={ledColor} shadowBlur={5} shadowOpacity={0.5} />
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

  // Render Pushbutton
  if (type === 'pushbutton') {
    const pos1 = getHolePosition(placement.legHoles['1']); // L1
    const pos2 = getHolePosition(placement.legHoles['2']); // L2
    const pos3 = getHolePosition(placement.legHoles['3']); // R1
    const pos4 = getHolePosition(placement.legHoles['4']); // R2
    
    // Find average center
    const validPos = [pos1, pos2, pos3, pos4].filter(p => p);
    if (validPos.length > 0) {
      const cx = validPos.reduce((sum, p) => sum + p!.x, 0) / validPos.length;
      const cy = validPos.reduce((sum, p) => sum + p!.y, 0) / validPos.length;
      const isClosed = component.params?.state === 'closed';

      return (
        <Group x={cx} y={cy}>
          {/* Draw legs from center to holes */}
          {pos1 && <Line points={[0, 0, pos1.x - cx, pos1.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          {pos2 && <Line points={[0, 0, pos2.x - cx, pos2.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          {pos3 && <Line points={[0, 0, pos3.x - cx, pos3.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          {pos4 && <Line points={[0, 0, pos4.x - cx, pos4.y - cy]} stroke="#bdc3c7" strokeWidth={2} />}
          
          {/* Body (6x6 mm typical switch, scale a bit) */}
          <Rect x={-12} y={-12} width={24} height={24} fill="#2c3e50" cornerRadius={2} />
          {/* Button */}
          <Circle x={0} y={0} radius={isClosed ? 5 : 6} fill={isClosed ? "#c0392b" : "#e74c3c"} />
          
          {/* Interactive Hitbox */}
          <Rect x={-12} y={-12} width={24} height={24} fill="transparent"
            onMouseDown={(e) => {
              e.cancelBubble = true;
              useEditorStore.getState().updateComponentParams(component.id, { state: 'closed' });
            }}
            onMouseUp={(e) => {
              e.cancelBubble = true;
              useEditorStore.getState().updateComponentParams(component.id, { state: 'open' });
            }}
            onMouseLeave={() => {
              useEditorStore.getState().updateComponentParams(component.id, { state: 'open' });
            }}
          />
        </Group>
      );
    }
  }

  // For unsupported components, just draw red dots at holes
  const p1 = getHolePosition(placement.legHoles['1'] || placement.legHoles['c'] || placement.legHoles['d'] || placement.legHoles['in+']);
  const p2 = getHolePosition(placement.legHoles['2'] || placement.legHoles['e'] || placement.legHoles['s'] || placement.legHoles['out']);
  
  return (
    <Group>
      {p1 && <Circle x={p1.x} y={p1.y} radius={4} fill="magenta" />}
      {p2 && <Circle x={p2.x} y={p2.y} radius={4} fill="magenta" />}
    </Group>
  );
};
