import React from 'react';
import { Group, Line, Circle, Text, Path, Rect, Label, Tag } from 'react-konva';
import { ComponentInstance } from '../models/circuit';
import { useEditorStore } from '../store/editorStore';
import { Knob } from './Knob';
import { BOARD_WIDTH, BOARD_HEIGHT, HOLES, getHolePosition } from './breadboardLayout';
import { ComponentLibrary } from '../engine/library';

const UnmirroredText = (props: React.ComponentProps<typeof Text> & { mirrored?: boolean }) => {
  const { mirrored, x = 0, width = 0, ...rest } = props;
  if (!mirrored) {
    return <Text x={x} width={width || undefined} {...rest} />;
  }
  const w = width || 20;
  const actualX = width ? x : x - w / 2;
  return <Text x={-actualX - w} width={w} scaleX={-1} offsetX={w} align={props.align || (width ? undefined : 'center')} {...rest} />;
};

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
  powerDissipation?: number;
}

export const ComponentNode: React.FC<Props> = ({ component, isSelected, onSelect, onDblClick, onDragStart, onDragEnd, onDragMove, onMouseEnter, onMouseLeave, opacity = 1, mode, theme = 'light', activeView = 'schematic', multimeterReading, powerDissipation }) => {
  const { type, position, color } = component;
  const defaultStroke = theme === 'dark' ? '#EEEAE4' : '#30383E';
  
  const libComp = ComponentLibrary[type];
  const maxPower = libComp?.maxPower || Infinity;
  const power = powerDissipation || 0;
  const isBurnt = power >= maxPower && maxPower < Infinity;
  const heatRatio = maxPower < Infinity ? Math.min(1, Math.max(0, power / maxPower)) : 0;
  const isHeating = heatRatio > 0.05 && !isBurnt;

  const strokeColor = isBurnt ? '#000000' : (isSelected ? '#3498db' : (color || defaultStroke));
  const textColor = theme === 'dark' ? '#EEEAE4' : '#30383E';
  const subTextColor = theme === 'dark' ? '#E2DCD3' : '#30383E';

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
      case 'transformer':
        return (
          <Group>
            {/* Primary */}
            <Line points={[-20, -20, -20, -10]} stroke={strokeColor} strokeWidth={2} />
            <Path data="M -20 -10 A 5 5 0 1 0 -20 0 A 5 5 0 1 0 -20 10" stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <Line points={[-20, 10, -20, 20]} stroke={strokeColor} strokeWidth={2} />
            {/* Core */}
            <Line points={[-5, -10, -5, 10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[5, -10, 5, 10]} stroke={strokeColor} strokeWidth={2} />
            {/* Secondary */}
            <Line points={[20, -20, 20, -10]} stroke={strokeColor} strokeWidth={2} />
            <Path data="M 20 -10 A 5 5 0 1 1 20 0 A 5 5 0 1 1 20 10" stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <Line points={[20, 10, 20, 20]} stroke={strokeColor} strokeWidth={2} />
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
      case 'function_generator':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Circle x={0} y={0} radius={10} stroke={strokeColor} strokeWidth={2} />
            <Path data="M -5 0 Q -2.5 -5 0 0 T 5 0" stroke={strokeColor} strokeWidth={2} fill="transparent" />
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
      case 'led':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -10, 10, -10, 0, 10]} closed fill={strokeColor} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, 10, 10, 10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke={strokeColor} strokeWidth={2} />
            {/* Arrows pointing outward */}
            <Line points={[12, -2, 20, -10]} stroke={strokeColor} strokeWidth={1.5} />
            <Line points={[16, -10, 20, -10, 20, -6]} stroke={strokeColor} strokeWidth={1.5} />
            <Line points={[12, 6, 20, -2]} stroke={strokeColor} strokeWidth={1.5} />
            <Line points={[16, -2, 20, -2, 20, 2]} stroke={strokeColor} strokeWidth={1.5} />
          </Group>
        );
      case 'zener':
        return (
          <Group>
            <Line points={[0, -20, 0, -10]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -10, 10, -10, 0, 10]} closed fill={strokeColor} stroke={strokeColor} strokeWidth={2} />
            {/* Zener cathode line */}
            <Line points={[-10, 5, -10, 10, 10, 10, 10, 15]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[0, 10, 0, 20]} stroke={strokeColor} strokeWidth={2} />
          </Group>
        );
      case 'npn':
        return (
          <Group>
            <Line points={[-20, 0, -10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -15, -10, 15]} stroke={strokeColor} strokeWidth={2.5} />
            <Line points={[20, -20, -10, -5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, 20, -10, 5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[16, 18, 12, 12, 9, 18.5]} closed fill={strokeColor} stroke={strokeColor} strokeWidth={1} />
          </Group>
        );
      case 'pnp':
        return (
          <Group>
            <Line points={[-20, 0, -10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-10, -15, -10, 15]} stroke={strokeColor} strokeWidth={2.5} />
            <Line points={[20, 20, -10, 5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, -20, -10, -5]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-2, -9, 5, -8.5, 2, -15]} closed fill={strokeColor} stroke={strokeColor} strokeWidth={1} />
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
            <Line points={[-10, -20, -10, 20, 20, 0]} closed fill={theme === 'dark' ? '#20252A' : '#EEEAE4'} stroke={strokeColor} strokeWidth={2} />
            <UnmirroredText text="+" x={-10} y={5} width={10} align="center" fontSize={10} fill={strokeColor} mirrored={component.mirrored} />
            <UnmirroredText text="-" x={-10} y={-14} width={10} align="center" fontSize={10} fill={strokeColor} mirrored={component.mirrored} />
          </Group>
        );

      case 'oscilloscope':
        return (
          <Group>
            <Rect x={-50} y={-90} width={100} height={210} stroke={strokeColor} strokeWidth={2} fill="transparent" />
            <UnmirroredText text="OSC" x={-20} y={5} width={40} align="center" fontSize={16} fill={strokeColor} fontStyle="bold" mirrored={component.mirrored} />
            
            <Line points={[-80, -70, -50, -70]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-80, -50, -50, -50]} stroke={strokeColor} strokeWidth={2} />
            
            <Line points={[-80, -20, -50, -20]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-80, 0, -50, 0]} stroke={strokeColor} strokeWidth={2} />
            
            <Line points={[-80, 30, -50, 30]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-80, 50, -50, 50]} stroke={strokeColor} strokeWidth={2} />
            
            <Line points={[-80, 80, -50, 80]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[-80, 100, -50, 100]} stroke={strokeColor} strokeWidth={2} />
            
            <UnmirroredText text="CH1" x={-45} y={-64} width={20} fontSize={10} fill={strokeColor} mirrored={component.mirrored} />
            <UnmirroredText text="CH2" x={-45} y={-14} width={20} fontSize={10} fill={strokeColor} mirrored={component.mirrored} />
            <UnmirroredText text="CH3" x={-45} y={36} width={20} fontSize={10} fill={strokeColor} mirrored={component.mirrored} />
            <UnmirroredText text="CH4" x={-45} y={86} width={20} fontSize={10} fill={strokeColor} mirrored={component.mirrored} />
          </Group>
        );
      case 'multimeter': {
        const mode = component.params?.mode || 'voltage';
        let symbol = 'V';
        if (mode === 'current') symbol = 'A';
        if (mode === 'resistance') symbol = 'Ω';
        return (
          <Group>
            <Circle x={0} y={0} radius={18} stroke={strokeColor} strokeWidth={2} fill={theme === 'dark' ? '#20252A' : '#EEEAE4'} />
            <UnmirroredText text={symbol} x={-10} y={-7} width={20} align="center" fontSize={14} fill={strokeColor} fontStyle="bold" mirrored={component.mirrored} />
            {/* Left lead to pin 1 (-22, 48) */}
            <Line points={[-18, 0, -22, 0, -22, 48]} stroke={strokeColor} strokeWidth={2} />
            <UnmirroredText text="+" x={-37} y={20} width={10} align="center" fontSize={10} fill={strokeColor} fontStyle="bold" mirrored={component.mirrored} />
            {/* Right lead to pin 2 (22, 48) */}
            <Line points={[18, 0, 22, 0, 22, 48]} stroke={strokeColor} strokeWidth={2} />
            <UnmirroredText text="-" x={21} y={20} width={10} align="center" fontSize={10} fill={strokeColor} fontStyle="bold" mirrored={component.mirrored} />
          </Group>
        );
      }
      case 'pushbutton': {
        const isClosed = component.params?.state === 'closed';
        return (
          <Group>
            <Line points={[-20, 0, -10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Line points={[20, 0, 10, 0]} stroke={strokeColor} strokeWidth={2} />
            <Circle x={-10} y={0} radius={2} fill={strokeColor} />
            <Circle x={10} y={0} radius={2} fill={strokeColor} />
            <Line points={[-10, 0, 10, isClosed ? 0 : -10]} stroke={strokeColor} strokeWidth={2} />
            <Rect x={-15} y={-15} width={30} height={30} fill="transparent" 
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
            fill={theme === 'dark' ? '#323A3F' : '#E2DCD3'}
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
            fill={theme === 'dark' ? '#20252A' : '#E2DCD3'}
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
                fill={theme === 'dark' ? '#20252A' : '#30383E'}
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
            <UnmirroredText text="104" x={-15} y={-4} width={30} align="center" fontSize={7} fill="#2c3e50" mirrored={component.mirrored} />
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
      case 'transformer': {
        const pinColor = "#f1c40f";
        const coreColor = "#bdc3c7";
        const coreSideColor = "#95a5a6";
        const bobbinColor = "#f5eedc";
        const copperColor = "#b84e14";
        const wireHighlight = "#e67e22";

        return (
          <Group>
            {/* Pins (Gold/Brass colored) */}
            <Line points={[-20, -10, -20, -20]} stroke={pinColor} strokeWidth={2.5} />
            <Line points={[-20, 10, -20, 20]} stroke={pinColor} strokeWidth={2.5} />
            <Line points={[20, -10, 20, -20]} stroke={pinColor} strokeWidth={2.5} />
            <Line points={[20, 10, 20, 20]} stroke={pinColor} strokeWidth={2.5} />
            
            {/* Steel Core (Behind) */}
            {/* Left and Right vertical legs */}
            <Rect x={-22} y={-12} width={12} height={24} fill={coreSideColor} />
            <Rect x={10} y={-12} width={12} height={24} fill={coreSideColor} />
            {/* Top and Bottom horizontal bars */}
            <Rect x={-24} y={-16} width={48} height={8} fill={coreColor} cornerRadius={3} stroke={isSelected ? '#3498db' : '#7f8c8d'} strokeWidth={isSelected ? 2 : 1} />
            <Rect x={-24} y={8} width={48} height={8} fill={coreColor} cornerRadius={3} stroke={isSelected ? '#3498db' : '#7f8c8d'} strokeWidth={isSelected ? 2 : 1} />
            
            {/* Left Bobbin and Coil (Primary) */}
            <Rect x={-24} y={-10} width={16} height={3} fill={bobbinColor} cornerRadius={1.5} stroke="#d1c7b3" strokeWidth={1} />
            <Rect x={-24} y={7} width={16} height={3} fill={bobbinColor} cornerRadius={1.5} stroke="#d1c7b3" strokeWidth={1} />
            <Rect x={-22} y={-7} width={12} height={14} fill={copperColor} />
            {/* Left Coil Windings */}
            {[...Array(7)].map((_, i) => (
              <Line key={`l-${i}`} points={[-22, -6 + i * 2, -10, -6 + i * 2]} stroke={wireHighlight} strokeWidth={1} />
            ))}

            {/* Right Bobbin and Coil (Secondary) */}
            <Rect x={8} y={-10} width={16} height={3} fill={bobbinColor} cornerRadius={1.5} stroke="#d1c7b3" strokeWidth={1} />
            <Rect x={8} y={7} width={16} height={3} fill={bobbinColor} cornerRadius={1.5} stroke="#d1c7b3" strokeWidth={1} />
            <Rect x={10} y={-7} width={12} height={14} fill={copperColor} />
            {/* Right Coil Windings */}
            {[...Array(7)].map((_, i) => (
              <Line key={`r-${i}`} points={[10, -6 + i * 2, 22, -6 + i * 2]} stroke={wireHighlight} strokeWidth={1} />
            ))}
            
            {/* Small Rivets on Core */}
            <Circle x={-16} y={-12} radius={1.5} fill="#7f8c8d" />
            <Circle x={16} y={-12} radius={1.5} fill="#7f8c8d" />
            <Circle x={-16} y={12} radius={1.5} fill="#7f8c8d" />
            <Circle x={16} y={12} radius={1.5} fill="#7f8c8d" />
          </Group>
        );
      }
      case 'function_generator': {
          const typeStr = component.params?.type || 'sin';
          const isAC = typeStr === 'ac';
          const isDC = typeStr === 'dc';
          const isSin = typeStr === 'sin';

          let freqVal = parseFloat(String(component.params?.frequency || '1000'));
          if (isNaN(freqVal)) freqVal = 1000;
          let ampVal = parseFloat(String(component.params?.amplitude || '5'));
          if (isNaN(ampVal)) ampVal = 5;
          const dcVal = component.params?.dc || component.params?.value || '0';
          const acMag = component.params?.acMag || '1';

          let topText = '';
          if (isSin) topText = freqVal >= 1000 ? `${(freqVal/1000).toFixed(1)}kHz` : `${Math.round(freqVal)}Hz`;
          else if (isAC) topText = `${acMag}V AC`;
          else if (isDC) topText = `${dcVal}V DC`;

          let bottomText = 'FUNCTION GENERATOR';
          if (isSin) bottomText += ` (${ampVal.toFixed(1)}V)`;

          let wavePath = '';
          const screenStartX = -170;
          const screenWidth = 110;
          const centerY = -28;
          if (isSin || isAC) {
            let cycles = Math.max(1, Math.min(6, Math.log10(freqVal + 1) * 1.5));
            const segments = Math.floor(cycles * 20);
            const step = screenWidth / segments;
            let d = `M ${screenStartX} ${centerY}`;
            for (let i = 1; i <= segments; i++) {
              const px = screenStartX + i * step;
              const py = centerY - Math.sin((i / segments) * cycles * 2 * Math.PI) * 10;
              d += ` L ${px} ${py}`;
            }
            wavePath = d;
          } else if (isDC) {
            wavePath = `M ${screenStartX} ${centerY} L ${screenStartX + screenWidth} ${centerY}`;
          }

          let freqKnobVal = Math.log10(Math.max(1, freqVal)) / 6.0;
          let ampKnobVal = ampVal / 10.0;

          return (
            <Group>
              <Rect x={-200} y={-60} width={220} height={130} fill="#34495e" cornerRadius={6} stroke={isSelected ? '#3498db' : '#2c3e50'} strokeWidth={isSelected ? 3 : 2} />
              
              <Rect x={-180} y={-45} width={130} height={50} fill="#111" cornerRadius={4} />
              <Path data={wavePath} stroke="#0f0" strokeWidth={2.5} fill="transparent" />
              <UnmirroredText text={topText} x={-180} y={-14} width={130} align="center" fontSize={12} fill="#2ecc71" mirrored={component.mirrored} />

              <UnmirroredText text={bottomText} x={-190} y={10} width={180} align="center" fontSize={10} fill="#bdc3c7" mirrored={component.mirrored} />

              {isSin && (
                <Group>
                  <Knob 
                    x={-145} y={45} radius={10} theme="dark"
                    value={freqKnobVal} 
                    label="FREQ" 
                    onChange={(val) => {
                      const newFreq = Math.pow(10, val * 6);
                      useEditorStore.getState().updateComponentParams(component.id, { frequency: newFreq.toFixed(0) });
                    }} 
                  />
                  <Knob 
                    x={-85} y={45} radius={10} theme="dark"
                    value={ampKnobVal} 
                    label="AMPL" 
                    onChange={(val) => {
                      const newAmp = (val * 10).toFixed(1);
                      useEditorStore.getState().updateComponentParams(component.id, { amplitude: newAmp });
                    }} 
                  />
                </Group>
              )}

              {/* + BNC Port */}
              <Circle x={0} y={-20} radius={6} fill="#e74c3c" />
              <Circle x={0} y={-20} radius={3} fill="#111" />
              <UnmirroredText text="+" x={-20} y={-25} width={10} align="center" fontSize={10} fill="#e74c3c" fontStyle="bold" mirrored={component.mirrored} />

              {/* - BNC Port */}
              <Circle x={0} y={20} radius={6} fill="#bdc3c7" />
              <Circle x={0} y={20} radius={3} fill="#111" />
              <UnmirroredText text="-" x={-20} y={15} width={10} align="center" fontSize={12} fill="#ecf0f1" fontStyle="bold" mirrored={component.mirrored} />
            </Group>
          );
      }
      case 'vsource': {
          let currentDc = parseFloat(String(component.params?.dc || '5.0'));
          if (isNaN(currentDc)) currentDc = 5.0;
          return (
            <Group>
              <Rect x={-200} y={-60} width={220} height={130} fill="#ecf0f1" cornerRadius={6} stroke={isSelected ? '#3498db' : '#bdc3c7'} strokeWidth={isSelected ? 3 : 2} />
              
              <Rect x={-180} y={-45} width={130} height={45} fill="#000" cornerRadius={4} />
              <UnmirroredText text={`${currentDc.toFixed(2)}V`} x={-175} y={-40} width={120} align="center" fontSize={22} fill="#e74c3c" fontStyle="bold" mirrored={component.mirrored} />
              <UnmirroredText text="0.00A" x={-175} y={-15} width={120} align="center" fontSize={14} fill="#3498db" mirrored={component.mirrored} />

              <UnmirroredText text="DC POWER SUPPLY" x={-190} y={10} width={180} align="center" fontSize={10} fill="#7f8c8d" mirrored={component.mirrored} />

              <Knob 
                x={-115} y={45} radius={12} 
                value={currentDc / 30.0} 
                label="VOLTAGE" 
                onChange={(val) => {
                  useEditorStore.getState().updateComponentParams(component.id, { dc: (val * 30).toFixed(2) });
                }} 
              />

              {/* + Port */}
              <Circle x={0} y={-20} radius={6} fill="#c0392b" />
              <Circle x={0} y={-20} radius={3} fill="#111" />
              <UnmirroredText text="+" x={-20} y={-25} width={10} align="center" fontSize={10} fill="#c0392b" fontStyle="bold" mirrored={component.mirrored} />

              {/* - Port */}
              <Circle x={0} y={20} radius={6} fill="#2c3e50" />
              <Circle x={0} y={20} radius={3} fill="#111" />
              <UnmirroredText text="-" x={-20} y={15} width={10} align="center" fontSize={12} fill="#2c3e50" fontStyle="bold" mirrored={component.mirrored} />
            </Group>
          );
      }
      case 'isource': {
        const iSourceType = component.params?.type || 'dc';
        if (iSourceType === 'sin' || iSourceType === 'ac') {
          return (
            <Group>
              <Rect x={-200} y={-60} width={220} height={120} fill="#34495e" cornerRadius={6} stroke={isSelected ? '#3498db' : '#2c3e50'} strokeWidth={isSelected ? 3 : 2} />
              
              <Rect x={-180} y={-45} width={130} height={50} fill="#111" cornerRadius={4} />
              <Path data="M -160 -20 Q -140 -40 -120 -20 T -80 -20 T -40 -20" stroke="#3498db" strokeWidth={2.5} fill="transparent" />
              <UnmirroredText text="I~" x={-170} y={-5} width={110} align="center" fontSize={12} fill="#3498db" mirrored={component.mirrored} />
              <UnmirroredText text="AC CURRENT SOURCE" x={-190} y={15} width={180} align="center" fontSize={10} fill="#bdc3c7" mirrored={component.mirrored} />

              {/* + BNC Port */}
              <Circle x={0} y={-20} radius={6} fill="#3498db" />
              <Circle x={0} y={-20} radius={3} fill="#111" />
              <UnmirroredText text="+" x={-20} y={-25} width={10} align="center" fontSize={10} fill="#3498db" fontStyle="bold" mirrored={component.mirrored} />

              {/* - BNC Port */}
              <Circle x={0} y={20} radius={6} fill="#bdc3c7" />
              <Circle x={0} y={20} radius={3} fill="#111" />
              <UnmirroredText text="-" x={-20} y={15} width={10} align="center" fontSize={12} fill="#ecf0f1" fontStyle="bold" mirrored={component.mirrored} />
            </Group>
          );
        } else {
          return (
            <Group>
              <Rect x={-200} y={-60} width={220} height={120} fill="#ecf0f1" cornerRadius={6} stroke={isSelected ? '#3498db' : '#bdc3c7'} strokeWidth={isSelected ? 3 : 2} />
              
              <Rect x={-180} y={-45} width={130} height={45} fill="#000" cornerRadius={4} />
              <UnmirroredText text={component.params?.dc ? `${component.params.dc}A` : '1.00A'} x={-175} y={-40} width={120} align="center" fontSize={22} fill="#3498db" fontStyle="bold" mirrored={component.mirrored} />
              <UnmirroredText text="5.00V" x={-175} y={-15} width={120} align="center" fontSize={14} fill="#e74c3c" mirrored={component.mirrored} />

              <UnmirroredText text="DC CURRENT SOURCE" x={-190} y={15} width={180} align="center" fontSize={10} fill="#7f8c8d" mirrored={component.mirrored} />

              {/* + Port */}
              <Circle x={0} y={-20} radius={6} fill="#3498db" />
              <Circle x={0} y={-20} radius={3} fill="#111" />
              <UnmirroredText text="+" x={-20} y={-25} width={10} align="center" fontSize={10} fill="#3498db" fontStyle="bold" mirrored={component.mirrored} />

              {/* - Port */}
              <Circle x={0} y={20} radius={6} fill="#2c3e50" />
              <Circle x={0} y={20} radius={3} fill="#111" />
              <UnmirroredText text="-" x={-20} y={15} width={10} align="center" fontSize={12} fill="#2c3e50" fontStyle="bold" mirrored={component.mirrored} />
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
      case 'led': {
        const ledColor = (component.params?.color as string) || '#ff0000';
        return (
          <Group>
            <Line points={[-5, -20, -5, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Line points={[5, -20, 5, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Circle x={0} y={0} radius={10} fill={ledColor} opacity={0.8} stroke={isSelected ? '#3498db' : '#2c3e50'} strokeWidth={isSelected ? 2 : 1} />
            {/* Flat spot for cathode */}
            <Line points={[-9, 4, 9, 4]} stroke={isSelected ? '#3498db' : '#2c3e50'} strokeWidth={1} />
          </Group>
        );
      }
      case 'zener': {
        return (
          <Group>
            <Line points={[0, -20, 0, 20]} stroke="#bdc3c7" strokeWidth={2} />
            <Rect x={-5} y={-8} width={10} height={16} fill="#e67e22" cornerRadius={1} stroke={isSelected ? '#3498db' : undefined} strokeWidth={isSelected ? 2 : 0} />
            <Rect x={-5} y={4} width={10} height={3} fill="#000000" />
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
            <UnmirroredText text={type.toUpperCase()} x={-5} y={-5} width={20} align="center" fontSize={7} fill="white" mirrored={component.mirrored} />
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
            <UnmirroredText text={type.toUpperCase()} x={-8} y={-5} width={20} align="center" fontSize={7} fill="white" mirrored={component.mirrored} />
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
            {/* Main Body (Engulfs pins to avoid protruding look) */}
            <Rect x={-100} y={-100} width={320} height={230} fill={'#2c3e50'} cornerRadius={8} stroke={isSelected ? '#3498db' : '#1a252f'} strokeWidth={isSelected ? 3 : 2} />
            
            {/* Screen on the right */}
            <Rect x={20} y={-80} width={180} height={140} fill="#111" cornerRadius={6} />
            
            {/* Screen Grid (Subtle) */}
            <Line points={[20, -45, 200, -45]} stroke="#1a252f" strokeWidth={1} />
            <Line points={[20, -10, 200, -10]} stroke="#1a252f" strokeWidth={1} />
            <Line points={[20, 25, 200, 25]} stroke="#1a252f" strokeWidth={1} />
            <Line points={[65, -80, 65, 60]} stroke="#1a252f" strokeWidth={1} />
            <Line points={[110, -80, 110, 60]} stroke="#1a252f" strokeWidth={1} />
            <Line points={[155, -80, 155, 60]} stroke="#1a252f" strokeWidth={1} />
            
            {/* Sine wave on screen (CH1 Green) */}
            <Path data="M 20 -10 Q 65 -60 110 -10 T 200 -10" stroke="#2ecc71" strokeWidth={2.5} fill="transparent" />
            {/* Sine wave on screen (CH2 Yellow) */}
            <Path data="M 20 -10 Q 65 40 110 -10 T 200 -10" stroke="#f1c40f" strokeWidth={1.5} fill="transparent" opacity={0.7} />
            
            <UnmirroredText text="OSCILLOSCOPE" x={20} y={75} width={180} align="center" fontSize={14} fill="#bdc3c7" fontStyle="bold" mirrored={component.mirrored} />

            {/* CH1 */}
            <Circle x={-80} y={-70} radius={6} fill="#2ecc71" />
            <Circle x={-80} y={-70} radius={3} fill="#111" />
            <UnmirroredText text="CH1+" x={-65} y={-75} width={30} fontSize={10} fill="#2ecc71" fontStyle="bold" mirrored={component.mirrored} />
            <Circle x={-80} y={-50} radius={6} fill="#7f8c8d" />
            <Circle x={-80} y={-50} radius={3} fill="#111" />
            <UnmirroredText text="CH1-" x={-65} y={-55} width={30} fontSize={10} fill="#95a5a6" fontStyle="bold" mirrored={component.mirrored} />

            {/* CH2 */}
            <Circle x={-80} y={-20} radius={6} fill="#f1c40f" />
            <Circle x={-80} y={-20} radius={3} fill="#111" />
            <UnmirroredText text="CH2+" x={-65} y={-25} width={30} fontSize={10} fill="#f1c40f" fontStyle="bold" mirrored={component.mirrored} />
            <Circle x={-80} y={0} radius={6} fill="#7f8c8d" />
            <Circle x={-80} y={0} radius={3} fill="#111" />
            <UnmirroredText text="CH2-" x={-65} y={-5} width={30} fontSize={10} fill="#95a5a6" fontStyle="bold" mirrored={component.mirrored} />

            {/* CH3 */}
            <Circle x={-80} y={30} radius={6} fill="#00ffff" />
            <Circle x={-80} y={30} radius={3} fill="#111" />
            <UnmirroredText text="CH3+" x={-65} y={25} width={30} fontSize={10} fill="#00ffff" fontStyle="bold" mirrored={component.mirrored} />
            <Circle x={-80} y={50} radius={6} fill="#7f8c8d" />
            <Circle x={-80} y={50} radius={3} fill="#111" />
            <UnmirroredText text="CH3-" x={-65} y={45} width={30} fontSize={10} fill="#95a5a6" fontStyle="bold" mirrored={component.mirrored} />

            {/* CH4 */}
            <Circle x={-80} y={80} radius={6} fill="#ff00ff" />
            <Circle x={-80} y={80} radius={3} fill="#111" />
            <UnmirroredText text="CH4+" x={-65} y={75} width={30} fontSize={10} fill="#ff00ff" fontStyle="bold" mirrored={component.mirrored} />
            <Circle x={-80} y={100} radius={6} fill="#7f8c8d" />
            <Circle x={-80} y={100} radius={3} fill="#111" />
            <UnmirroredText text="CH4-" x={-65} y={95} width={30} fontSize={10} fill="#95a5a6" fontStyle="bold" mirrored={component.mirrored} />
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
            <UnmirroredText
              text={multimeterReading || "0.00"}
              x={-28}
              y={-57}
              fontSize={12}
              fill="#2c3e50"
              fontStyle="bold"
              align="right"
              width={56}
              mirrored={component.mirrored}
            />

            {/* Rotary dial area */}
            <Circle x={0} y={-10} radius={22} fill="#34495e" />
            <Circle x={0} y={-10} radius={18} fill="#2c3e50" />

            {/* Mode indicators around dial */}
            <UnmirroredText text="V" x={-18} y={-30} fontSize={9} fill="white" fontStyle="bold" mirrored={component.mirrored} />
            <UnmirroredText text="A" x={-3} y={-38} fontSize={9} fill="white" fontStyle="bold" mirrored={component.mirrored} />
            <UnmirroredText text="Ω" x={12} y={-30} fontSize={9} fill="white" fontStyle="bold" mirrored={component.mirrored} />

            {/* Dial knob */}
            <Group x={0} y={-10} rotation={modeRot}>
              <Rect x={-3} y={-16} width={6} height={32} fill="#7f8c8d" cornerRadius={3} />
              <Circle x={0} y={-12} radius={2} fill="#e74c3c" />
            </Group>

            {/* Labels placed cleanly ABOVE the sockets inside the body */}
            <UnmirroredText text="V/Ω/A" x={-38} y={30} fontSize={8} fill="#2c3e50" fontStyle="bold" align="center" width={32} mirrored={component.mirrored} />
            <UnmirroredText text="COM" x={6} y={30} fontSize={8} fill="#2c3e50" fontStyle="bold" align="center" width={32} mirrored={component.mirrored} />

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
      case 'pushbutton': {
        const isClosed = component.params?.state === 'closed';
        return (
          <Group>
            <Rect x={-12} y={-12} width={24} height={24} fill="#2c3e50" cornerRadius={2} stroke={isSelected ? '#3498db' : '#1a252f'} strokeWidth={isSelected ? 2 : 1} />
            <Circle x={0} y={0} radius={isClosed ? 6 : 7} fill={isClosed ? "#c0392b" : "#e74c3c"} />
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

    if (type === 'transformer') {
       dx = 25;
       dy = -25;
    }

    const bgFill = theme === 'dark' ? '#20252A' : '#EEEAE4';

    let valStr: string | null = null;
    if (type === 'function_generator' || (type === 'vsource' && component.params?.type === 'sin')) {
       valStr = `${component.params?.amplitude || 5}V ${component.params?.frequency || '1k'}Hz`;
    } else if (type === 'transformer') {
       valStr = `${component.params?.L1 || '1m'}H, ${component.params?.L2 || '1m'}H`;
    } else {
       valStr = component.params?.value ? String(component.params.value) :
                   component.params?.resistance ? `${component.params.resistance}Ω` :
                   component.params?.capacitance ? `${component.params.capacitance}F` :
                   component.params?.inductance ? `${component.params.inductance}H` :
                   component.params?.dc ? `${component.params.dc}V` : 
                   component.params?.model ? String(component.params.model) : null;
    }

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
        {isHeating && (
           <Circle x={0} y={0} radius={25 + heatRatio * 10} fill="red" opacity={heatRatio * 0.4} shadowBlur={20} shadowColor="red" listening={false} />
        )}
        <Group opacity={isBurnt ? 0.4 : 1}>
          <Rect x={-10} y={-20} width={20} height={40} fill="transparent" />
          {activeView === 'breadboard' ? renderPhysicalSymbol() : renderSchematicSymbol()}
        </Group>
        {isBurnt && (
           <Text text="🔥" x={-12} y={-12} fontSize={24} listening={false} />
        )}
      </Group>
      
      {renderLabels()}
      
      {power > 0 && maxPower < Infinity && (
         <Text
            text={`${(power * 1000).toFixed(1)} mW`}
            x={15}
            y={20}
            fontSize={10}
            fill="#e74c3c"
            fontStyle="bold"
            listening={false}
         />
      )}
    </Group>
  );
};
