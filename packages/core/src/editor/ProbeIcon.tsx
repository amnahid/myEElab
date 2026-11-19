import React, { useState } from 'react';
import { Group, Path, Circle, Label, Tag, Text } from 'react-konva';
import { useEditorStore } from '../store/editorStore';
import { getTextScale } from './wireUtils';

export interface ProbeProps {
  probe: { nodeId: string; color: string; x: number; y: number };
  theme?: 'light' | 'dark';
  isSelected?: boolean;
  mode?: string;
  listening?: boolean;
  onSelect?: (e: any) => void;
  onRemove?: () => void;
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
export const ProbeKonvaNode: React.FC<ProbeProps> = ({
  probe,
  theme = 'light',
  isSelected = false,
  mode = 'select',
  listening = true,
  onSelect,
  onRemove
}) => {
  const scale = useEditorStore(state => state.scale);
  const textScale = getTextScale(scale);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    if (mode === 'probe') {
      onRemove?.();
    } else {
      onSelect?.(e);
    }
  };

  const handleContextMenu = (e: any) => {
    e.evt?.preventDefault?.();
    e.cancelBubble = true;
    onRemove?.();
  };

  const labelText = `V(${probe.nodeId})`;
  const estWidth = labelText.length * 7.5 + 14;

  return (
    <Group
      x={probe.x}
      y={probe.y}
      listening={listening}
      onClick={handleClick}
      onTap={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={(e) => {
        setIsHovered(true);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = '';
      }}
    >
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

        {/* Selection Halo on Anchor Dot */}
        {isSelected && (
          <Circle
            cx={0}
            cy={0}
            r={8}
            stroke="#3498db"
            strokeWidth={2}
            dash={[3, 3]}
            fill="transparent"
          />
        )}
      </Group>

      {/* Node Name Label with interactive dismiss button */}
      <Group x={8} y={-35} scaleX={textScale} scaleY={textScale}>
        <Label x={0} y={0}>
          <Tag
            fill={theme === 'dark' ? (isHovered ? '#3b444a' : '#323A3F') : (isHovered ? '#ede7df' : '#E2DCD3')}
            stroke={isSelected ? '#3498db' : probe.color}
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={4}
            shadowColor="black"
            shadowBlur={isHovered ? 4 : 2}
            shadowOpacity={theme === 'dark' ? 0.4 : 0.2}
          />
          <Text
            text={labelText}
            fontFamily="sans-serif"
            fontSize={11}
            padding={4}
            fill={probe.color}
            fontStyle="bold"
          />
        </Label>

        {/* Dedicated Close '×' Icon on Probe Tag */}
        <Group
          x={estWidth}
          y={10}
          onClick={(e) => {
            e.cancelBubble = true;
            onRemove?.();
          }}
          onTap={(e) => {
            e.cancelBubble = true;
            onRemove?.();
          }}
        >
          <Circle
            cx={0}
            cy={0}
            r={6}
            fill={isHovered || isSelected ? '#e74c3c' : (theme === 'dark' ? '#444d56' : '#c8c2b7')}
          />
          <Text
            text="×"
            fontSize={10}
            fontStyle="bold"
            fill="white"
            align="center"
            x={-3.5}
            y={-5.5}
          />
        </Group>
      </Group>
    </Group>
  );
};
