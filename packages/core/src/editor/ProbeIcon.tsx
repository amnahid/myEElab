import React from 'react';
import { Group, Path, Circle, Label, Tag, Text } from 'react-konva';

export interface ProbeProps {
  probe: { nodeId: string; color: string; x: number; y: number };
  theme?: 'light' | 'dark';
}

// 1. The custom mouse cursor used when the Probe tool is active
export const getProbeCursorSvgUrl = (color: string = '%23e74c3c') => {
  // We use width=32 height=32 because OSes expect valid hotspot bounds within the dimensions.
  // The hotspot is at (2, 30).
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg transform='scale(0.85) translate(0, 5)'%3E%3Cpath d='M2 30 L 8 18' stroke='silver' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M8 18 L 11 16 L 15 20 L 12 23 Z' fill='${color}'/%3E%3Cpath d='M13 18 L 26 5 L 29 8 L 16 21 Z' fill='${color}' stroke='%23333' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E") 2 30, crosshair`;
};

// Custom SVG icon for the menu toolbar so it matches exactly
export const ProbeMenuIcon = ({ size = 18, color = "currentColor" }: { size?: number, color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32" fill="none">
    <g transform="scale(0.85) translate(2, 4)">
      <path d="M2 30 L 8 18" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M8 18 L 11 16 L 15 20 L 12 23 Z" fill={color} />
      <path d="M13 18 L 26 5 L 29 8 L 16 21 Z" fill="transparent" stroke={color} strokeWidth="2" />
    </g>
  </svg>
);

// 2. The physical probe rendered on the canvas
export const ProbeKonvaNode: React.FC<ProbeProps> = ({ probe, theme = 'light' }) => {
  // To update the canvas icon design, modify these Konva paths
  // Using scale={0.7} to make the physical probes a bit smaller
  return (
    <Group x={probe.x} y={probe.y} listening={false}>
      <Group scaleX={0.7} scaleY={0.7}>
        {/* Metal Tip */}
        <Path 
          data="M 0 0 L 8 -12" 
          stroke="#bdc3c7" 
          strokeWidth={3} 
          strokeLinecap="round" 
        />
        {/* Flange/Guard */}
        <Path 
          data="M 6 -14 L 10 -10" 
          stroke={probe.color} 
          strokeWidth={5} 
          strokeLinecap="round" 
        />
        {/* Probe Body */}
        <Path 
          data="M 8 -12 L 20 -28" 
          stroke={probe.color} 
          strokeWidth={8} 
          strokeLinecap="round" 
        />
        {/* Wire sticking out back */}
        <Path 
          data="M 19 -27 C 25 -32, 28 -20, 25 -10" 
          stroke={theme === 'dark' ? '#EEEAE4' : '#30383E'} 
          strokeWidth={2} 
          strokeLinecap="round" 
          fill="transparent"
        />
        {/* Little anchor dot */}
        <Circle cx={0} cy={0} r={4} fill={probe.color} stroke="white" strokeWidth={1} />
      </Group>

      {/* Node Name Label - not scaled down so it remains legible */}
      <Label x={8} y={-35}>
        <Tag
          fill={theme === 'dark' ? '#323A3F' : '#E2DCD3'}
          stroke={probe.color}
          strokeWidth={1}
          cornerRadius={4}
          shadowColor="black"
          shadowBlur={2}
          shadowOpacity={theme === 'dark' ? 0.4 : 0.2}
        />
        <Text
          text={`V(${probe.nodeId})`}
          fontFamily="sans-serif"
          fontSize={11}
          padding={4}
          fill={probe.color}
          fontStyle="bold"
        />
      </Label>
    </Group>
  );
};
