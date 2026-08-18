import React from 'react';
import { Group, Line, Circle, Text, Path, Rect, Label, Tag } from 'react-konva';
import { ComponentInstance } from '../models/circuit';
import { BOARD_WIDTH, BOARD_HEIGHT, HOLES, getHolePosition } from './breadboardLayout';

interface Props {
  component: ComponentInstance;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onDblClick: () => void;
  onDragStart?: (e: any) => void;
  onDragEnd: (e: any) => void;
  onDragMove: (e: any) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  opacity?: number;
  mode: string;
  theme?: 'light' | 'dark';
  activeView?: 'schematic' | 'breadboard';
  multimeterReading?: string;
}

export const ComponentNode: React.FC<Props> = ({ component, isSelected, onSelect, onDblClick, onDragStart, onDragEnd, onDragMove, onMouseEnter, onMouseLeave, opacity = 1, mode, theme = 'light', activeView = 'schematic', multimeterReading }) => {
  const { type, position, color } = component;
  const defaultStroke = theme === 'dark' ? '#cdd6f4' : 'black';
  const strokeColor = isSelected ? '#3498db' : (color || defaultStroke);
  const textColor = theme === 'dark' ? '#a6adc8' : '#333';
  const subTextColor = theme === 'dark' ? '#7f849c' : '#666';

  const renderSchematicSymbol = () => {
    if (component.type === 'breadboard') {
      // In schematic view, a breadboard might just be a large empty rectangle 
      // or we can simply render nothing / a dashed box.
      return (
        <Group offsetX={BOARD_WIDTH / 2} offsetY={BOARD_HEIGHT / 2}>
          <Rect width={BOARD_WIDTH} height={BOARD_HEIGHT} stroke={isSelected ? '#3498db' : '#999'} dash={[5, 5]} strokeWidth={2} fill="transparent" />
          <Text text="Breadboard" x={10} y={10} fill="#999" fontSize={24} />
        </Group>
      );
    }
    switch (type) {
      case 'resistor':
        return (
          <Group>
            <Line points={[0, -20, 0, -10, -10, -5, 10, 5, -10, 15, 0, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'capacitor':
        return (
          <Group>
            <Line points={[0, -20, 0, -2]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -2, 10, -2]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, 2, 10, 2]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 2, 0, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'inductor':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Path data="M 0 -10 A 5 5 0 1 1 0 0 A 5 5 0 1 1 0 10" stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <Line points={[0, 10, 0, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'vsource':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Circle x={0} y={0} radius={10} stroke={strokeColor} strokeWidth={2} />
            {/* Vector + symbol */}
            <Line points={[-4, -5, 4, -5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, -9, 0, -1]} stroke={strokeColor} strokeWidth={2} />
            {/* Vector - symbol */}
            <Line points={[-4, 5, 4, 5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'isource':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Circle x={0} y={0} radius={10} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 5, 0, -5, -3, -2, 0, -5, 3, -2]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'ground':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -10, 10, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-6, -6, 6, -6]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-2, -2, 2, -2]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'diode':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -10, 10, -10, 0, 10]} closed fill={strokeColor} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, 10, 10, 10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'npn':
        return (
          <Group>
            <Line points={[-20, 0, -10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -15, -10, 15]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, -20, 20, -15, -10, -5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, 20, 20, 15, -10, 5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[10, 15, 15, 15, 15, 10]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'pnp':
        return (
          <Group>
            <Line points={[-20, 0, -10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -15, -10, 15]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, 20, 20, 15, -10, 5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, -20, 20, -15, -10, -5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, -10, -10, -5, -5, -3]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'nmos':
        return (
          <Group>
            <Line points={[-20, 0, -10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -15, -10, 15]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, -15, -5, -5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, -5, -5, 5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, 5, -5, 15]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, -20, 20, -10, -5, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, 20, 20, 10, -5, 10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, 10, 20, 0, -5, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, -5, -5, 0, 0, 5]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'pmos':
        return (
          <Group>
            <Line points={[-20, 0, -10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -15, -10, 15]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, -15, -5, -5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, -5, -5, 5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, 5, -5, 15]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, -20, 20, -10, -5, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, 20, 20, 10, -5, 10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, -10, 20, 0, -5, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-5, -5, 0, 0, -5, 5]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'opamp':
        return (
          <Group>
            <Line points={[-20, 10, -10, 10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-20, -10, -10, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, -20, 0, -13]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 20, 0, 13]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -20, -10, 20, 20, 0]} closed fill={theme === 'dark' ? '#1e1e2e' : "white"} stroke={strokeColor} strokeWidth={2} />
            <Text text="+" x={-8} y={5} fontSize={10} fill={strokeColor} />
            <Text text="-" x={-7} y={-14} fontSize={10} fill={strokeColor} />
          </Group>
        );

      case 'oscilloscope':
        return (
          <Group>
            <Rect x={-25} y={-20} width={50} height={40} stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <Text text="OSC" x={-10} y={-5} fontSize={10} fill={strokeColor} />
            <Line points={[-40, -20, -25, -20]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-40, 20, -25, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'multimeter': {
        const mode = component.params?.mode || 'voltage';
        let symbol = 'V';
        if (mode === 'current') symbol = 'A';
        if (mode === 'resistance') symbol = 'Ω';
        return (
          <Group>
            <Circle x={0} y={0} radius={18} stroke={strokeColor} strokeWidth={2} fill={theme === 'dark' ? '#1e1e2e' : 'white'} />
            <Text text={symbol} x={-6} y={-7} fontSize={14} fill={strokeColor} fontStyle="bold" align="center" width={12} />
            {/* Left lead to pin 1 (-22, 48) */}
            <Line points={[-18, 0, -22, 0, -22, 48]} stroke={strokeColor} strokeWidth={2} />
            <Text text="+" x={-32} y={20} fontSize={10} fill={strokeColor} fontStyle="bold" />
            {/* Right lead to pin 2 (22, 48) */}
            <Line points={[18, 0, 22, 0, 22, 48]} stroke={strokeColor} strokeWidth={2} />
            <Text text="-" x={26} y={20} fontSize={10} fill={strokeColor} fontStyle="bold" />
          </Group>
        );
      }
      default:
        return <Circle radius={10} fill="red" />;
    }
  };

  const renderPhysicalSymbol = () => {
    if (component.type === 'breadboard') {
      return (
        <Group offsetX={BOARD_WIDTH / 2} offsetY={BOARD_HEIGHT / 2}>
          <Rect
            x={0}
            y={0}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            fill={theme === 'dark' ? '#2a2a35' : '#ffffff'}
            cornerRadius={10}
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={10}
            shadowOffset={{ x: 0, y: 5 }}
            stroke={isSelected ? '#3498db' : undefined}
            strokeWidth={isSelected ? 2 : 0}
          />
          <Rect
            x={145}
            y={10}
            width={10}
            height={BOARD_HEIGHT - 20}
            fill={theme === 'dark' ? '#1e1e2e' : '#e0e0e0'}
            cornerRadius={5}
          />
          <Line points={[45, 10, 45, BOARD_HEIGHT - 10]} stroke="#e74c3c" strokeWidth={2} />
          <Line points={[15, 10, 15, BOARD_HEIGHT - 10]} stroke="#3498db" strokeWidth={2} />
          <Line points={[255, 10, 255, BOARD_HEIGHT - 10]} stroke="#e74c3c" strokeWidth={2} />
          <Line points={[285, 10, 285, BOARD_HEIGHT - 10]} stroke="#3498db" strokeWidth={2} />
          {HOLES.map((hole) => {
            const pos = getHolePosition(hole.id);
            if (!pos) return null;
            return (
              <Circle
                key={hole.id}
                x={pos.x}
                y={pos.y}
                radius={3}
                fill={theme === 'dark' ? '#1a1a2e' : '#333'}
              />
            );
          })}
        </Group>
      );
    }

    switch (type) {
      case 'resistor': {
        const bands = ['#8B4513', '#000000', '#FF0000', '#DAA520'];
        return (
          <Group>
            <Line points={[0, -20, 0, -12]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 12, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Rect x={-8} y={-12} width={16} height={24} fill="#f0c75e" cornerRadius={3} stroke={isSelected ? '#3498db' : '#c9a832'} strokeWidth={isSelected ? 2 : 1} />
            {bands.map((c, i) => (
              <Rect key={i} x={-8} y={-9 + i * 5} width={16} height={3} fill={c} />
            ))}
          </Group>
        );
      }
      case 'capacitor': {
        return (
          <Group>
            <Line points={[0, -20, 0, -8]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 8, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Circle x={0} y={0} radius={10} fill="#e67e22" stroke={isSelected ? '#3498db' : '#d35400'} strokeWidth={isSelected ? 2 : 1} />
            <Text text="104" x={-8} y={-4} fontSize={7} fill="#2c3e50" />
          </Group>
        );
      }
      case 'inductor': {
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Circle x={0} y={0} radius={10} fill="#27ae60" stroke={isSelected ? '#3498db' : '#1e8449'} strokeWidth={isSelected ? 2 : 1} />
            <Path data="M -3 -6 C 0 -9 3 -6 3 -3 C 3 0 0 3 -3 0 C -3 -3 0 -6 3 -9" stroke="#c0392b" strokeWidth={1.5} fill="transparent" />
          </Group>
        );
      }
      case 'vsource': {
        const sourceType = component.params?.type || 'dc';
        if (sourceType === 'sin' || sourceType === 'ac') {
          return (
            <Group>
              <Line points={[0, -20, 0, -14]} stroke="#e74c3c" strokeWidth={2} />
              <Line points={[0, 14, 0, 20]} stroke="#2c3e50" strokeWidth={2} />
              <Rect x={-20} y={-14} width={40} height={28} fill="#34495e" cornerRadius={4} stroke={isSelected ? '#3498db' : '#2c3e50'} strokeWidth={isSelected ? 2 : 1} />
              <Rect x={-16} y={-10} width={32} height={12} fill="#000" cornerRadius={2} />
              <Path data="M -10 -4 Q -5 -8 0 -4 T 10 -4" stroke="#0f0" strokeWidth={1.5} fill="transparent" />
              <Text text="FUNC" x={-20} y={4} width={40} align="center" fontSize={8} fill="#bdc3c7" />
            </Group>
          );
        } else {
          return (
            <Group>
              <Line points={[0, -20, 0, -14]} stroke="#e74c3c" strokeWidth={2} />
              <Line points={[0, 14, 0, 20]} stroke="#2c3e50" strokeWidth={2} />
              <Rect x={-20} y={-14} width={40} height={28} fill="#ecf0f1" cornerRadius={4} stroke={isSelected ? '#3498db' : '#bdc3c7'} strokeWidth={isSelected ? 2 : 1} />
              <Rect x={-16} y={-10} width={32} height={12} fill="#000" cornerRadius={2} />
              <Text text={component.params?.dc ? `${component.params.dc}V` : '5V'} x={-16} y={-8} width={32} align="center" fontSize={8} fill="#e74c3c" />
              <Text text="DC PWR" x={-20} y={4} width={40} align="center" fontSize={7} fill="#7f8c8d" />
            </Group>
          );
        }
      }
      case 'isource': {
        const iSourceType = component.params?.type || 'dc';
        if (iSourceType === 'sin' || iSourceType === 'ac') {
          return (
            <Group>
              <Line points={[0, -20, 0, -14]} stroke="#e74c3c" strokeWidth={2} />
              <Line points={[0, 14, 0, 20]} stroke="#2c3e50" strokeWidth={2} />
              <Rect x={-20} y={-14} width={40} height={28} fill="#34495e" cornerRadius={4} stroke={isSelected ? '#3498db' : '#2c3e50'} strokeWidth={isSelected ? 2 : 1} />
              <Rect x={-16} y={-10} width={32} height={12} fill="#000" cornerRadius={2} />
              <Path data="M -10 -4 Q -5 -8 0 -4 T 10 -4" stroke="#3498db" strokeWidth={1.5} fill="transparent" />
              <Text text="I~" x={-20} y={4} width={40} align="center" fontSize={8} fill="#bdc3c7" />
            </Group>
          );
        } else {
          return (
            <Group>
              <Line points={[0, -20, 0, -14]} stroke="#e74c3c" strokeWidth={2} />
              <Line points={[0, 14, 0, 20]} stroke="#2c3e50" strokeWidth={2} />
              <Rect x={-20} y={-14} width={40} height={28} fill="#ecf0f1" cornerRadius={4} stroke={isSelected ? '#3498db' : '#bdc3c7'} strokeWidth={isSelected ? 2 : 1} />
              <Rect x={-16} y={-10} width={32} height={12} fill="#000" cornerRadius={2} />
              <Text text={component.params?.dc ? `${component.params.dc}A` : '1mA'} x={-16} y={-8} width={32} align="center" fontSize={8} fill="#3498db" />
              <Text text="I DC" x={-20} y={4} width={40} align="center" fontSize={7} fill="#7f8c8d" />
            </Group>
          );
        }
      }
      case 'ground':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[-10, -10, 10, -10]} stroke="#7f8c8d" strokeWidth={3} />
            <Line points={[-6, -6, 6, -6]} stroke="#7f8c8d" strokeWidth={3} />
            <Line points={[-2, -2, 2, -2]} stroke="#7f8c8d" strokeWidth={3} />
          </Group>
        );
      case 'diode': {
        return (
          <Group>
            <Line points={[0, -20, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Rect x={-6} y={-10} width={12} height={20} fill="#2c3e50" cornerRadius={2} stroke={isSelected ? '#3498db' : undefined} strokeWidth={isSelected ? 2 : 0} />
            <Rect x={-6} y={6} width={12} height={3} fill="#ecf0f1" />
          </Group>
        );
      }
      case 'npn':
      case 'pnp': {
        return (
          <Group>
            <Line points={[20, -20, 20, -12]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[-20, 0, -12, 0]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[20, 20, 20, 12]} stroke="#bdc3c7" strokeWidth={2} />
            <Rect x={-12} y={-12} width={34} height={24} fill="#2c3e50" cornerRadius={[12, 4, 4, 12]} stroke={isSelected ? '#3498db' : undefined} strokeWidth={isSelected ? 2 : 0} />
            <Text text={type.toUpperCase()} x={-5} y={-5} fontSize={7} fill="white" />
          </Group>
        );
      }
      case 'nmos':
      case 'pmos': {
        return (
          <Group>
            <Line points={[20, -20, 20, -14]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[-20, 0, -14, 0]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[20, 20, 20, 14]} stroke="#bdc3c7" strokeWidth={2} />
            <Rect x={-14} y={-14} width={36} height={28} fill="#34495e" cornerRadius={3} stroke={isSelected ? '#3498db' : undefined} strokeWidth={isSelected ? 2 : 0} />
            <Rect x={14} y={-14} width={8} height={28} fill="#95a5a6" />
            <Text text={type.toUpperCase()} x={-8} y={-5} fontSize={7} fill="white" />
          </Group>
        );
      }
      case 'opamp': {
        return (
          <Group>
            <Rect x={-20} y={-15} width={40} height={30} fill={'#2c3e50'} cornerRadius={2} stroke={isSelected ? '#3498db' : undefined} strokeWidth={isSelected ? 2 : 0} />
            <Line points={[-20, -10, -25, -10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[-20, 10, -25, 10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[20, -10, 25, -10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[20, 10, 25, 10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, -15, 0, -20]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 15, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Circle x={-15} y={-10} radius={2} fill="#95a5a6" />
          </Group>
        );
      }
      case 'oscilloscope': {
        return (
          <Group>
            {/* Body */}
            <Rect x={-40} y={-30} width={80} height={60} fill={'#2c3e50'} cornerRadius={5} stroke={isSelected ? '#3498db' : '#1a252f'} strokeWidth={2} />
            
            {/* Screen on the right */}
            <Rect x={-15} y={-25} width={50} height={40} fill="#111" cornerRadius={3} />
            
            {/* Sine wave on screen */}
            <Path data="M -10 0 Q -5 -15 0 0 T 10 0 T 20 0 T 30 0" stroke="#2ecc71" strokeWidth={1} fill="transparent" />
            
            {/* CH1+ BNC Port at pin coordinate {-40, -20} */}
            <Circle x={-40} y={-20} radius={5} fill="#bdc3c7" />
            <Circle x={-40} y={-20} radius={2} fill="#2c3e50" />
            <Text text="CH1+" x={-32} y={-24} fontSize={8} fill="#ecf0f1" />

            {/* CH1- BNC Port at pin coordinate {-40, 20} */}
            <Circle x={-40} y={20} radius={5} fill="#bdc3c7" />
            <Circle x={-40} y={20} radius={2} fill="#2c3e50" />
            <Text text="CH1-" x={-32} y={16} fontSize={8} fill="#ecf0f1" />
          </Group>
        );
      }
      case 'multimeter': {
        const mode = component.params?.mode || 'voltage';
        let modeRot = 0;
        if (mode === 'voltage') modeRot = -45;
        if (mode === 'current') modeRot = 0;
        if (mode === 'resistance') modeRot = 45;

        return (
          <Group>
            {/* Main Body (Fluke yellow) */}
            <Rect
              x={-45}
              y={-75}
              width={90}
              height={150}
              fill="#f1c40f"
              cornerRadius={8}
              stroke={isSelected ? '#3498db' : '#d4ac0d'}
              strokeWidth={2}
              shadowColor="rgba(0,0,0,0.25)"
              shadowBlur={8}
              shadowOffsetY={4}
            />

            {/* LCD Screen bezel */}
            <Rect x={-35} y={-65} width={70} height={28} fill="#2c3e50" cornerRadius={4} />

            {/* LCD Screen glass */}
            <Rect x={-30} y={-61} width={60} height={20} fill="#95a5a6" cornerRadius={2} />

            {/* Reading text */}
            <Text
              text={multimeterReading || "0.00"}
              x={-28}
              y={-57}
              fontSize={12}
              fill="#2c3e50"
              fontStyle="bold"
              align="right"
              width={56}
            />

            {/* Rotary dial area */}
            <Circle x={0} y={-10} radius={22} fill="#34495e" />
            <Circle x={0} y={-10} radius={18} fill="#2c3e50" />

            {/* Mode indicators around dial */}
            <Text text="V" x={-18} y={-30} fontSize={9} fill="white" fontStyle="bold" />
            <Text text="A" x={-3} y={-38} fontSize={9} fill="white" fontStyle="bold" />
            <Text text="Ω" x={12} y={-30} fontSize={9} fill="white" fontStyle="bold" />

            {/* Dial knob */}
            <Group x={0} y={-10} rotation={modeRot}>
              <Rect x={-3} y={-16} width={6} height={32} fill="#7f8c8d" cornerRadius={3} />
              <Circle x={0} y={-12} radius={2} fill="#e74c3c" />
            </Group>

            {/* Labels placed cleanly ABOVE the sockets inside the body */}
            <Text text="V/Ω/A" x={-38} y={30} fontSize={8} fill="#2c3e50" fontStyle="bold" align="center" width={32} />
            <Text text="COM" x={6} y={30} fontSize={8} fill="#2c3e50" fontStyle="bold" align="center" width={32} />

            {/* Pin 1: Red Jack Socket at EXACTLY {-22, 48} */}
            <Circle x={-22} y={48} radius={8} fill="#c0392b" />
            <Circle x={-22} y={48} radius={5} fill="#bdc3c7" />
            <Circle x={-22} y={48} radius={3.5} fill="#111111" />

            {/* Pin 2: Black Jack Socket at EXACTLY {22, 48} */}
            <Circle x={22} y={48} radius={8} fill="#2c3e50" />
            <Circle x={22} y={48} radius={5} fill="#bdc3c7" />
            <Circle x={22} y={48} radius={3.5} fill="#111111" />
          </Group>
        );
      }
      default:
        return <Circle radius={10} fill="red" />;
    }
  };

  const renderLabels = () => {
    const isHorizontal = (component.rotation === 90 || component.rotation === 270);
    const isNativeHorizontal = (type === 'opamp' || type === 'multimeter');
    const isEffectivelyHorizontal = isNativeHorizontal ? !isHorizontal : isHorizontal;

    let dx = 0;
    let dy = 0;

    if (isEffectivelyHorizontal) {
      dx = -15; 
      dy = 20; // below component
    } else {
      dx = 20; 
      dy = -15; // to the right of component
    }


    if (type === 'ground') {
       dx = 15; dy = -10;
    }

    if (type === 'multimeter') {
       dx = -8;
       dy = activeView === 'breadboard' ? 82 : 55;
    }



    const bgFill = theme === 'dark' ? '#1e1e2e' : '#f0f0f0';

    const valStr = component.params?.value ? String(component.params.value) :
                   component.params?.resistance ? `${component.params.resistance}Ω` :
                   component.params?.capacitance ? `${component.params.capacitance}F` :
                   component.params?.inductance ? `${component.params.inductance}H` :
                   component.params?.dc ? `${component.params.dc}V` : null;

    return (
      <Group x={dx} y={dy}>
        <Label x={0} y={0}>
          <Tag fill={bgFill} cornerRadius={2} opacity={0.8} />
          <Text text={component.refDes || type.charAt(0).toUpperCase()} fontSize={12} fill={textColor} padding={2} />
        </Label>
        {valStr && (
          <Label x={0} y={15}>
            <Tag fill={bgFill} cornerRadius={2} opacity={0.8} />
            <Text text={valStr} fontSize={10} fill={subTextColor} padding={2} />
          </Label>
        )}
      </Group>
    );
  };

  return (
    <Group
      x={position.x}
      y={position.y}
      opacity={opacity}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onMouseEnter={(e) => {
        if (mode === 'select') {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
        }
        if (onMouseEnter) onMouseEnter();
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = '';
        }
        if (onMouseLeave) onMouseLeave();
      }}
    >
      <Group rotation={component.rotation || 0} scaleX={component.mirrored ? -1 : 1}>
        <Rect x={-10} y={-20} width={20} height={40} fill="transparent" />
        {activeView === 'breadboard' ? renderPhysicalSymbol() : renderSchematicSymbol()}
      </Group>
      
      {renderLabels()}
    </Group>
  );
};
