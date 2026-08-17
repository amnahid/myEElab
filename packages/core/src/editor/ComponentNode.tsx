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
}

export const ComponentNode: React.FC<Props> = ({ component, isSelected, onSelect, onDblClick, onDragStart, onDragEnd, onDragMove, onMouseEnter, onMouseLeave, opacity = 1, mode, theme = 'light', activeView = 'schematic' }) => {
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
            <Text text="+" x={-4} y={-9} fontSize={10} fill={strokeColor} />
            <Text text="-" x={-3} y={2} fontSize={10} fill={strokeColor} />
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
      case 'powersupply':
        return (
          <Group>
            <Rect x={-20} y={-20} width={40} height={40} stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <Text text="DC" x={-8} y={-15} fontSize={10} fill={strokeColor} />
            <Text text="+" x={-4} y={-35} fontSize={10} fill={strokeColor} />
            <Text text="-" x={-4} y={25} fontSize={10} fill={strokeColor} />
            <Line points={[0, -20, 0, -40]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 20, 0, 40]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'functiongenerator':
        return (
          <Group>
            <Circle x={0} y={0} radius={20} stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <Path data="M -10 0 Q -5 -10 0 0 T 10 0" stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <Line points={[0, -20, 0, -40]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 20, 0, 40]} stroke={strokeColor} strokeWidth={2} />
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

    const bodyColor = isSelected ? '#3498db' : undefined;
    switch (type) {
      case 'resistor': {
        const bands = ['#8B4513', '#000000', '#FF0000', '#DAA520'];
        return (
          <Group>
            <Line points={[0, -20, 0, -12]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 12, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Rect x={-8} y={-12} width={16} height={24} fill={bodyColor || '#f0c75e'} cornerRadius={3} stroke="#c9a832" strokeWidth={1} />
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
            <Circle x={0} y={0} radius={10} fill={bodyColor || '#e67e22'} stroke="#d35400" strokeWidth={1} />
            <Text text="104" x={-8} y={-4} fontSize={7} fill="#2c3e50" />
          </Group>
        );
      }
      case 'inductor': {
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Circle x={0} y={0} radius={10} fill={bodyColor || '#27ae60'} stroke="#1e8449" strokeWidth={1} />
            <Path data="M -3 -6 C 0 -9 3 -6 3 -3 C 3 0 0 3 -3 0 C -3 -3 0 -6 3 -9" stroke="#c0392b" strokeWidth={1.5} fill="transparent" />
          </Group>
        );
      }
      case 'vsource': {
        return (
          <Group>
            <Line points={[0, -20, 0, -14]} stroke="#e74c3c" strokeWidth={2} />
            <Line points={[0, 14, 0, 20]} stroke="#2c3e50" strokeWidth={2} />
            <Rect x={-10} y={-14} width={20} height={28} fill={bodyColor || '#2c3e50'} cornerRadius={3} stroke="#1a252f" strokeWidth={1} />
            <Rect x={-4} y={-14} width={8} height={4} fill="#95a5a6" cornerRadius={1} />
            <Text text="+" x={-4} y={-11} fontSize={8} fill="white" />
            <Text text={component.params?.dc ? `${component.params.dc}V` : '9V'} x={-8} y={2} fontSize={7} fill="white" />
          </Group>
        );
      }
      case 'isource':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Circle x={0} y={0} radius={10} fill={bodyColor || '#8e44ad'} stroke="#6c3483" strokeWidth={1} />
            <Line points={[0, 5, 0, -5, -3, -2, 0, -5, 3, -2]} stroke="white" strokeWidth={1.5} />
          </Group>
        );
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
            <Rect x={-6} y={-10} width={12} height={20} fill={bodyColor || '#2c3e50'} cornerRadius={2} />
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
            <Rect x={-12} y={-12} width={34} height={24} fill={bodyColor || '#2c3e50'} cornerRadius={[12, 4, 4, 12]} />
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
            <Rect x={-14} y={-14} width={36} height={28} fill={bodyColor || '#34495e'} cornerRadius={3} />
            <Rect x={14} y={-14} width={8} height={28} fill="#95a5a6" />
            <Text text={type.toUpperCase()} x={-8} y={-5} fontSize={7} fill="white" />
          </Group>
        );
      }
      case 'opamp': {
        return (
          <Group>
            <Line points={[-20, 10, -14, 10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[-20, -10, -14, -10]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, -20, 0, -14]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[0, 20, 0, 14]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[20, 0, 14, 0]} stroke="#bdc3c7" strokeWidth={2} />
            <Rect x={-14} y={-14} width={28} height={28} fill={bodyColor || '#1a1a2e'} cornerRadius={2} />
            <Circle x={-8} y={-8} radius={3} fill="#333" stroke="#555" strokeWidth={0.5} />
            <Text text="OP" x={-6} y={-4} fontSize={8} fill="#ccc" />
          </Group>
        );
      }
      case 'powersupply': {
        return (
          <Group>
            <Rect x={-40} y={-30} width={80} height={60} fill={bodyColor || '#2c3e50'} cornerRadius={5} stroke="#1a252f" strokeWidth={2} />
            <Rect x={-30} y={-20} width={60} height={25} fill="#000" cornerRadius={2} />
            <Text text={component.params?.dc ? `${component.params.dc} V` : '5.00 V'} x={-22} y={-15} fontSize={14} fill="#e74c3c" fontFamily="monospace" />
            <Circle x={-20} y={15} radius={6} fill="#e74c3c" />
            <Circle x={20} y={15} radius={6} fill="#34495e" />
            <Line points={[-20, 15, -20, 30]} stroke="#e74c3c" strokeWidth={2} />
            <Line points={[20, 15, 20, 30]} stroke="#34495e" strokeWidth={2} />
            <Text text="+" x={-23} y={23} fontSize={10} fill="#fff" />
            <Text text="-" x={18} y={22} fontSize={10} fill="#fff" />
          </Group>
        );
      }
      case 'functiongenerator': {
        return (
          <Group>
            <Rect x={-40} y={-30} width={80} height={60} fill={bodyColor || '#34495e'} cornerRadius={5} stroke="#2c3e50" strokeWidth={2} />
            <Rect x={-30} y={-20} width={40} height={15} fill="#000" cornerRadius={2} />
            <Text text={component.params?.frequency ? `${component.params.frequency}Hz` : '1kHz'} x={-25} y={-16} fontSize={10} fill="#2ecc71" fontFamily="monospace" />
            <Circle x={25} y={-12} radius={6} fill="#7f8c8d" />
            <Circle x={-20} y={15} radius={6} fill="#e74c3c" />
            <Circle x={10} y={15} radius={6} fill="#34495e" />
            <Line points={[-20, 15, -20, 30]} stroke="#e74c3c" strokeWidth={2} />
            <Line points={[10, 15, 10, 30]} stroke="#34495e" strokeWidth={2} />
          </Group>
        );
      }
      case 'oscilloscope': {
        return (
          <Group>
            <Rect x={-40} y={-30} width={80} height={60} fill={bodyColor || '#2c3e50'} cornerRadius={5} stroke="#1a252f" strokeWidth={2} />
            <Rect x={-35} y={-25} width={50} height={40} fill="#111" cornerRadius={3} />
            <Path data="M -30 0 Q -25 -15 -20 0 T -10 0 T 0 0 T 10 0" stroke="#2ecc71" strokeWidth={1} fill="transparent" />
            <Circle x={25} y={-10} radius={6} fill="#95a5a6" />
            <Circle x={25} y={10} radius={6} fill="#95a5a6" />
            <Line points={[25, -10, 40, -10]} stroke="#95a5a6" strokeWidth={2} />
            <Line points={[25, 10, 40, 10]} stroke="#95a5a6" strokeWidth={2} />
          </Group>
        );
      }
      default:
        return <Circle radius={10} fill="red" />;
    }
  };

  const renderLabels = () => {
    const isHorizontal = (component.rotation === 90 || component.rotation === 270);
    const isNativeHorizontal = (type === 'opamp');
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

    if (type === 'powersupply') {
       dx = 15; dy = -10;
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
        <Rect x={-20} y={-30} width={40} height={60} fill="transparent" />
        {activeView === 'breadboard' ? renderPhysicalSymbol() : renderSchematicSymbol()}
      </Group>
      
      {renderLabels()}
    </Group>
  );
};
