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
  onSegmentMouseDown?: (segIndex: number, e: any) => void;
  onDblClick?: () => void;
  theme?: 'light' | 'dark';
  listening?: boolean;
}

export const WireNode: React.FC<Props> = React.memo(({
  wire,
  isSelected,
  onSelect,
  onPointDragStart,
  onPointDragEnd,
  onPointDragMove,
  onSegmentMouseDown,
  onDblClick,
  theme = 'light',
  listening
}) => {
  const points = wire.points.flatMap(p => [p.x, p.y]);
  const defaultColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
  let color = wire.color || defaultColor;
  if (isSelected) color = '#B9924D';

  return (
    <Group listening={listening !== undefined ? listening : true}>
      {/* Base polyline */}
      <Line
        points={points}
        stroke={color}
        strokeWidth={2}
        hitStrokeWidth={10}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDblClick}
        onDblTap={onDblClick}
      />

      {/* Moveable edge segments when selected */}
      {isSelected && onSegmentMouseDown && wire.points.slice(0, -1).map((p1, i) => {
        const p2 = wire.points[i + 1];
        const isH = Math.abs(p2.y - p1.y) <= Math.abs(p2.x - p1.x);
        const cursor = isH ? 'ns-resize' : 'ew-resize';

        return (
          <Line
            key={`seg-hit-${i}`}
            points={[p1.x, p1.y, p2.x, p2.y]}
            stroke="transparent"
            strokeWidth={4}
            hitStrokeWidth={16}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = cursor;
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = '';
            }}
            onMouseDown={(e) => {
              e.cancelBubble = true;
              onSegmentMouseDown(i, e);
            }}
          />
        );
      })}

      {/* Corner point drag handles when selected */}
      {isSelected && wire.points.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={4}
          hitStrokeWidth={24}
          fill={theme === 'dark' ? '#323A3F' : '#E2DCD3'}
          stroke="#B9924D"
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
});
