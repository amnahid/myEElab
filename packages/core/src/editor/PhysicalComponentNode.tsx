import React from 'react';
import { Group, Line, Rect, Circle, Text } from 'react-konva';
import { ComponentInstance, BreadboardPlacement } from '../models/circuit';
import { getHolePosition } from './breadboardLayout';

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
