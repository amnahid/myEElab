import React, { useState, useRef } from 'react';
import { Group, Circle, Line, Text, Rect } from 'react-konva';

interface KnobProps {
  x: number;
  y: number;
  radius?: number;
  value: number; // 0.0 to 1.0
  onChange: (newValue: number) => void;
  label?: string;
  theme?: 'light' | 'dark';
}

export const Knob: React.FC<KnobProps> = ({ x, y, radius = 15, value, onChange, label, theme = 'light' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startValue = useRef(0);

  // Map 0-1 value to an angle. Usually knobs go from -135deg to +135deg (270deg total)
  const angle = -135 + Math.max(0, Math.min(1, value)) * 270;

  const baseFill = theme === 'dark' ? '#34495e' : '#bdc3c7';
  const indicatorStroke = theme === 'dark' ? '#ecf0f1' : '#2c3e50';

  return (
    <Group x={x} y={y}>
      <Circle 
        radius={radius} 
        fill={baseFill} 
        stroke="#7f8c8d" 
        strokeWidth={1} 
        shadowColor="black" 
        shadowBlur={isDragging ? 5 : 2} 
        shadowOpacity={0.3} 
        shadowOffsetY={isDragging ? 4 : 2} 
      />
      <Group rotation={angle}>
        <Line points={[0, 0, 0, -radius + 3]} stroke={indicatorStroke} strokeWidth={2} lineCap="round" />
      </Group>
      {label && (
        <Text 
          x={-radius * 1.5} 
          y={radius + 8} 
          text={label} 
          width={radius * 3} 
          align="center" 
          fontSize={10} 
          fontStyle="bold"
          fill={theme === 'dark' ? '#ecf0f1' : '#7f8c8d'} 
        />
      )}
      <Rect
        x={-radius * 1.5} 
        y={-radius * 1.5} 
        width={radius * 3} 
        height={radius * 3} 
        fill="transparent"
        draggable
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'ns-resize';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = '';
        }}
        onDragStart={(e) => {
          e.cancelBubble = true;
          setIsDragging(true);
          dragStartY.current = e.evt.clientY || ((e.evt as any).touches ? (e.evt as any).touches[0].clientY : 0);
          startValue.current = value;
        }}
        onDragMove={(e) => {
          e.cancelBubble = true;
          const currentY = e.evt.clientY || ((e.evt as any).touches ? (e.evt as any).touches[0].clientY : 0);
          const deltaY = dragStartY.current - currentY; // Moving UP (negative delta) increases value
          // Sensitivity: 150 pixels for full range
          let newValue = startValue.current + deltaY / 150;
          newValue = Math.max(0, Math.min(1, newValue));
          onChange(newValue);
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          setIsDragging(false);
        }}
        dragBoundFunc={function (this: any) {
          return this.getAbsolutePosition();
        }}
      />
    </Group>
  );
};
