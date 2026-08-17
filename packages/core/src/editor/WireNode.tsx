import React from 'react';
import { Line, Circle, Group } from 'react-konva';
import { Wire } from '../models/circuit';

interface Props {
  wire: Wire;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onPointDragEnd: (index: number, x: number, y: number) => void;
  onPointDragStart?: () => void;
  onPointDragMove?: (index: number, x: number, y: number) => void;
  theme?: 'light' | 'dark';
}

export const WireNode: React.FC<Props> = ({ wire, isSelected, onSelect, onPointDragStart, onPointDragEnd, onPointDragMove, theme = 'light' }) => {
  const points = wire.points.flatMap(p => [p.x, p.y]);
  // Wire is selected ? bright blue : (dark ? pastel blue : dark navy)
  const defaultColor = theme === 'dark' ? '#89b4fa' : '#34495e';
  const color = isSelected ? '#3498db' : defaultColor;

  return (
    <Group>
      <Line
        points={points}
        stroke={color}
        strokeWidth={2}
        hitStrokeWidth={10}
        onClick={onSelect}
        onTap={onSelect}
      />
      {isSelected && wire.points.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={4}
          hitStrokeWidth={12}
          fill="white"
          stroke="blue"
          strokeWidth={2}
          draggable
          onDragStart={() => {
            if (onPointDragStart) onPointDragStart();
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true;
            onPointDragEnd(i, e.target.x(), e.target.y());
          }}
          onDragMove={(e) => {
            if (onPointDragMove) {
              onPointDragMove(i, e.target.x(), e.target.y());
            }
          }}
        />
      ))}
    </Group>
  );
};
