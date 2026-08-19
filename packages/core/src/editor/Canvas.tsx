import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';
import { BOARD_WIDTH, BOARD_HEIGHT, HOLES, getHolePosition } from './breadboardLayout';
import { useEditorStore } from '../store/editorStore';
import { ComponentNode } from './ComponentNode';
import { WireNode } from './WireNode';
import { ProbeKonvaNode, getProbeCursorSvgUrl } from './ProbeIcon';
import { ComponentLibrary } from '../engine/library';
import { deriveBreadboardWires } from '../engine/breadboardSync';
import { NodeResolver } from '../engine/nodeResolver';
import { Label, Tag, Text } from 'react-konva';

interface CanvasProps {
  nodeVoltages?: Record<string, number>;
  theme: 'light' | 'dark';
}

export const Canvas: React.FC<CanvasProps> = ({ nodeVoltages, theme }) => {
  const { circuit, mode, componentToPlace, addComponent, updateComponentPosition, selectedIds, setSelection, addWire, stagePos, scale, setStageView, setEditingComponent, updateWirePoint, setMode, probes, toggleProbe, activeView, showInstruments } = useEditorStore();
  
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [previewSnapPos, setPreviewSnapPos] = useState<{x: number, y: number} | null>(null);
  const [drawingWirePoints, setDrawingWirePoints] = useState<{x: number, y: number}[]>([]);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  // Compute ratlines (breadboard to schematic sync)
  const ratlines = useMemo(() => deriveBreadboardWires(circuit), [circuit]);

  // Determine visibility of instruments and their attached wires
  const isHiddenInstrument = (comp: any) => {
    if (showInstruments) return false;
    // Only hide passive observation instruments (Oscilloscope, Multimeter)
    return ['oscilloscope', 'multimeter'].includes(comp.type);
  };

  const hiddenInstrumentPinCoords = new Set<string>();
  if (!showInstruments) {
    circuit.components.forEach(comp => {
      if (isHiddenInstrument(comp)) {
        const libComp = ComponentLibrary[comp.type];
        if (!libComp) return;
        const rotRad = (comp.rotation || 0) * Math.PI / 180;
        const cos = Math.round(Math.cos(rotRad));
        const sin = Math.round(Math.sin(rotRad));
        libComp.pins.forEach(pin => {
          const baseOffset = pin.offset;
          const mirroredOffsetX = comp.mirrored ? -baseOffset.x : baseOffset.x;
          const mirroredOffsetY = baseOffset.y;
          const rx = mirroredOffsetX * cos - mirroredOffsetY * sin;
          const ry = mirroredOffsetX * sin + mirroredOffsetY * cos;
          const px = Math.round(comp.position.x + rx);
          const py = Math.round(comp.position.y + ry);
          hiddenInstrumentPinCoords.add(`${px},${py}`);
        });
      }
    });
  }

  const visibleWires = circuit.wires.filter(w => {
    if (hiddenInstrumentPinCoords.size > 0 && w.points.length > 0) {
      const p1 = w.points[0];
      const p2 = w.points[w.points.length - 1];
      if (hiddenInstrumentPinCoords.has(`${Math.round(p1.x)},${Math.round(p1.y)}`)) return false;
      if (hiddenInstrumentPinCoords.has(`${Math.round(p2.x)},${Math.round(p2.y)}`)) return false;
    }
    return true;
  });

  const visibleComponents = circuit.components.filter(c => !isHiddenInstrument(c));

  // Determine visible probes
  const visibleProbes = probes.filter(probe => {
    if (showInstruments) return true;
    // Check if probe is at a hidden pin
    if (hiddenInstrumentPinCoords.has(`${Math.round(probe.x)},${Math.round(probe.y)}`)) return false;
    // Check if probe is on a hidden wire
    // A simple check: if the probe is on a wire that was hidden, hide the probe too.
    for (const wire of circuit.wires) {
      if (visibleWires.includes(wire)) continue; // Not a hidden wire
      // Check if probe is on this hidden wire (approximate by checking segments)
      for (let i = 0; i < wire.points.length - 1; i++) {
        const p1 = wire.points[i];
        const p2 = wire.points[i + 1];
        const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
        if (l2 === 0) continue;
        let t = ((probe.x - p1.x) * (p2.x - p1.x) + (probe.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = p1.x + t * (p2.x - p1.x);
        const projY = p1.y + t * (p2.y - p1.y);
        const dist = Math.hypot(probe.x - projX, probe.y - projY);
        if (dist <= 5) return false;
      }
    }
    return true;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    // initial check
    updateSize();
    // add resize listener
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawingWirePoints.length > 0) {
          setDrawingWirePoints([]);
        }
        if (mode === 'wire' || mode === 'place') {
          setMode('select');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingWirePoints, mode, setMode]);

  useEffect(() => {
    if (mode !== 'wire' && drawingWirePoints.length > 0) {
      setDrawingWirePoints([]);
    }
  }, [mode]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setStageView({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }, newScale);
  };

  const getRelativePointerPosition = (stage: any) => {
    const pointerPosition = stage.getPointerPosition();
    return {
      x: (pointerPosition.x - stage.x()) / stage.scaleX(),
      y: (pointerPosition.y - stage.y()) / stage.scaleX(),
    };
  };

  const getBreadboardSnap = (rawPos: {x: number, y: number}) => {
    let bestDist = Infinity;
    let bestPos = null;
    
    // Find all breadboards in the circuit
    const breadboards = circuit.components.filter(c => c.type === 'breadboard');
    if (breadboards.length === 0) return null;

    for (const bb of breadboards) {
      const rotRad = (bb.rotation || 0) * Math.PI / 180;
      const cos = Math.round(Math.cos(rotRad));
      const sin = Math.round(Math.sin(rotRad));
      
      const bbX = bb.position.x;
      const bbY = bb.position.y;

      // Un-rotate the point relative to breadboard center to check holes in unrotated space
      // Breadboard holes are defined relative to top-left, but we center the breadboard in ComponentNode.
      // So holes are offset by -BOARD_WIDTH/2, -BOARD_HEIGHT/2
      
      const dx = rawPos.x - bbX;
      const dy = rawPos.y - bbY;
      
      const unrotX = dx * cos + dy * sin;
      const unrotY = -dx * sin + dy * cos;
      
      // Now relative to top-left of breadboard:
      const boardX = unrotX + BOARD_WIDTH / 2;
      const boardY = unrotY + BOARD_HEIGHT / 2;

      for (const hole of HOLES) {
        const pos = getHolePosition(hole.id);
        if (!pos) continue;
        const hdx = boardX - pos.x;
        const hdy = boardY - pos.y;
        const dist = Math.sqrt(hdx * hdx + hdy * hdy);
        if (dist < 15 && dist < bestDist) {
          bestDist = dist;
          // Rotate the hole position back to absolute space
          const rx = (pos.x - BOARD_WIDTH / 2) * cos - (pos.y - BOARD_HEIGHT / 2) * sin;
          const ry = (pos.x - BOARD_WIDTH / 2) * sin + (pos.y - BOARD_HEIGHT / 2) * cos;
          bestPos = { x: bbX + rx, y: bbY + ry };
        }
      }
    }
    return bestPos;
  };

  const getComponentBreadboardSnap = (compType: string, rawPos: {x: number, y: number}, rotation: number = 0, mirrored: boolean = false) => {
    if (compType === 'breadboard') return null;
    const libComp = ComponentLibrary[compType];
    if (!libComp || libComp.pins.length === 0) return null;

    const breadboards = circuit.components.filter(c => c.type === 'breadboard');
    if (breadboards.length === 0) return null;

    let bestDist = Infinity;
    let bestSnapPos: {x: number, y: number} | null = null;

    const rotRad = rotation * Math.PI / 180;
    const cos = Math.round(Math.cos(rotRad));
    const sin = Math.round(Math.sin(rotRad));

    const pin = libComp.pins[0];
    const mirroredOffsetX = mirrored ? -pin.offset.x : pin.offset.x;
    const mirroredOffsetY = pin.offset.y;
    const rotatedOffsetX = mirroredOffsetX * cos - mirroredOffsetY * sin;
    const rotatedOffsetY = mirroredOffsetX * sin + mirroredOffsetY * cos;

    const pinRawAbsX = rawPos.x + rotatedOffsetX;
    const pinRawAbsY = rawPos.y + rotatedOffsetY;

    for (const bb of breadboards) {
      const bbRotRad = (bb.rotation || 0) * Math.PI / 180;
      const bbCos = Math.round(Math.cos(bbRotRad));
      const bbSin = Math.round(Math.sin(bbRotRad));
      const bbX = bb.position.x;
      const bbY = bb.position.y;

      const dx = pinRawAbsX - bbX;
      const dy = pinRawAbsY - bbY;
      const unrotX = dx * bbCos + dy * bbSin;
      const unrotY = -dx * bbSin + dy * bbCos;
      const boardX = unrotX + BOARD_WIDTH / 2;
      const boardY = unrotY + BOARD_HEIGHT / 2;

      for (const hole of HOLES) {
        const hPos = getHolePosition(hole.id);
        if (!hPos) continue;
        const hdx = boardX - hPos.x;
        const hdy = boardY - hPos.y;
        const dist = Math.sqrt(hdx * hdx + hdy * hdy);
        
        if (dist < 20 && dist < bestDist) {
          bestDist = dist;
          const rx = (hPos.x - BOARD_WIDTH / 2) * bbCos - (hPos.y - BOARD_HEIGHT / 2) * bbSin;
          const ry = (hPos.x - BOARD_WIDTH / 2) * bbSin + (hPos.y - BOARD_HEIGHT / 2) * bbCos;
          const targetPinAbsX = bbX + rx;
          const targetPinAbsY = bbY + ry;

          bestSnapPos = {
            x: targetPinAbsX - rotatedOffsetX,
            y: targetPinAbsY - rotatedOffsetY
          };
        }
      }
    }
    return bestSnapPos;
  };

  const getMagneticSnap = (rawPos: {x: number, y: number}, maxDist = 30, ignorePoint?: { wireId: string, index: number }) => {
    let closestDist = maxDist; // Use provided maxDist for snap radius
    let snapPos = null;

    for (const comp of circuit.components) {
      const libComp = ComponentLibrary[comp.type];
      if (!libComp) continue;

      const renderRot = comp.rotation;
      const rotRad = (renderRot || 0) * Math.PI / 180;
      const cos = Math.round(Math.cos(rotRad));
      const sin = Math.round(Math.sin(rotRad));

      for (const pin of libComp.pins) {
        const baseOffset = pin.offset;
        const mirroredOffsetX = comp.mirrored ? -baseOffset.x : baseOffset.x;
        const mirroredOffsetY = baseOffset.y;
        
        const rotatedOffsetX = mirroredOffsetX * cos - mirroredOffsetY * sin;
        const rotatedOffsetY = mirroredOffsetX * sin + mirroredOffsetY * cos;
        
        const renderPos = comp.position;
        const pinAbsX = renderPos.x + rotatedOffsetX;
        const pinAbsY = renderPos.y + rotatedOffsetY;

        const dist = Math.sqrt(Math.pow(rawPos.x - pinAbsX, 2) + Math.pow(rawPos.y - pinAbsY, 2));
        if (dist < closestDist) {
          closestDist = dist;
          snapPos = { x: pinAbsX, y: pinAbsY };
        }
      }
    }

    // Also check wire vertices and segments for T-junctions
    for (const wire of circuit.wires) {
      for (let i = 0; i < wire.points.length; i++) {
        if (ignorePoint && ignorePoint.wireId === wire.id && ignorePoint.index === i) continue;
        
        const wp = wire.points[i];
        const dist = Math.hypot(rawPos.x - wp.x, rawPos.y - wp.y);
        if (dist < closestDist) {
          closestDist = dist;
          snapPos = { x: wp.x, y: wp.y };
        }
        if (i > 0) {
          if (ignorePoint && ignorePoint.wireId === wire.id && (ignorePoint.index === i || ignorePoint.index === i - 1)) continue;
          
          const a = wire.points[i - 1];
          const b = wire.points[i];
          const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
          if (l2 > 0) {
            let t = ((rawPos.x - a.x) * (b.x - a.x) + (rawPos.y - a.y) * (b.y - a.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const projX = a.x + t * (b.x - a.x);
            const projY = a.y + t * (b.y - a.y);
            const distSeg = Math.hypot(rawPos.x - projX, rawPos.y - projY);
            if (distSeg < closestDist) {
              closestDist = distSeg;
              snapPos = { x: projX, y: projY };
            }
          }
        }
      }
    }

    return snapPos;
  };

  const handleStageClick = (e: any) => {
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    
    let snappedPos = getMagneticSnap(pos);
    if (!snappedPos) {
      if (activeView === 'breadboard') {
        snappedPos = getBreadboardSnap(pos) || {
          x: Math.round(pos.x / 15) * 15,
          y: Math.round(pos.y / 15) * 15
        };
      } else {
        snappedPos = {
          x: Math.round(pos.x / 10) * 10,
          y: Math.round(pos.y / 10) * 10
        };
      }
    }

    if (mode === 'place' && componentToPlace) {
      addComponent(componentToPlace, snappedPos);
    } else {
      const isWireStart = mode === 'select' && (getMagneticSnap(pos, 12) || (activeView === 'breadboard' && getBreadboardSnap(pos)));
      if (mode === 'wire' || isWireStart) {
        let pinSnap = getMagneticSnap(pos, mode === 'select' ? 12 : 30);
        if (!pinSnap && activeView === 'breadboard') {
           pinSnap = getBreadboardSnap(pos);
        }
        
        if (mode === 'select' && pinSnap) {
          setMode('wire');
          setDrawingWirePoints([pinSnap]);
          return;
        }

        if (drawingWirePoints.length === 0) {
          const startPos = pinSnap || snappedPos;
          setDrawingWirePoints([startPos]);
        } else {
          const last = drawingWirePoints[drawingWirePoints.length - 1];
          const nextPos = pinSnap || snappedPos;
          if (last.x !== nextPos.x || last.y !== nextPos.y) {
            if (pinSnap) {
              addWire([...drawingWirePoints, pinSnap]);
              setDrawingWirePoints([]);
              setMode('select');
            } else {
              setDrawingWirePoints([...drawingWirePoints, nextPos]);
            }
          }
        }
      } else if (mode === 'probe') {
        // In probe mode, try to resolve the node clicked. 
        // Wires and components have their own onClick handlers, but if we click a pin directly...
        const pinSnap = getMagneticSnap(pos, 12);
        if (pinSnap) {
          // We don't easily know WHICH component this pin belongs to from getMagneticSnap.
          // Let's just let the WireNode or ComponentNode click handlers do the probing.
        }
      } else {
        // If clicking on empty stage in select mode, deselect
        if (e.target === stage) {
          setSelection([]);
        }
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (mode === 'place' || (mode === 'wire' && drawingWirePoints.length > 0)) {
      const stage = e.target.getStage();
      const pos = getRelativePointerPosition(stage);
      
      let snap = getMagneticSnap(pos);
      if (!snap) {
        if (activeView === 'breadboard') {
          snap = getBreadboardSnap(pos) || {
            x: Math.round(pos.x / 15) * 15,
            y: Math.round(pos.y / 15) * 15
          };
        } else {
          snap = {
            x: Math.round(pos.x / 10) * 10,
            y: Math.round(pos.y / 10) * 10
          };
        }
      }
      setMousePos(snap);
    } else if (mousePos !== null) {
      setMousePos(null);
    }
  };

  const getCursor = () => {
    if (mode === 'probe') {
      // Realistic multimeter probe cursor
      return getProbeCursorSvgUrl();
    }
    if (mode === 'wire' || mode === 'place') return 'crosshair';
    return '';
  };

  return (
    <div 
      ref={containerRef} 
      style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1e1e2e' : '#f0f0f0', width: '100%', height: '100%', overflow: 'hidden', cursor: getCursor() || undefined }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('componentType');
        if (type && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left - stagePos.x) / scale;
          const y = (e.clientY - rect.top - stagePos.y) / scale;

          let snapX = Math.round(x / 10) * 10;
          let snapY = Math.round(y / 10) * 10;
          
          if (activeView === 'breadboard') {
             const snap = getComponentBreadboardSnap(type, {x, y});
             if (snap) {
               snapX = snap.x;
               snapY = snap.y;
             }
          }
          useEditorStore.getState().addComponent(type, { x: snapX, y: snapY });
        }
      }}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onDragEnd={(e) => {
          if (mode === 'select' && e.target === e.target.getStage()) {
            setStageView({ x: e.target.x(), y: e.target.y() }, scale);
          }
        }}
        draggable={mode === 'select'}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
      >
        <Layer>
          {/* Breadboard Background is now a component, so no static background here */}

          {/* 1. Unselected Wires */}
          {/* Breadboard Ratlines */}
          {activeView === 'breadboard' && ratlines.map(w => (
            <Line
              key={w.id}
              points={w.points.flatMap(p => [p.x, p.y])}
              stroke={theme === 'dark' ? '#f39c12' : '#e67e22'}
              strokeWidth={2}
              dash={[10, 5]}
              opacity={0.7}
            />
          ))}

          {/* Render in z-index order: Unselected Wires -> Unselected Components -> Junction Dots -> Selected Wires -> Selected Components */}
          {(() => {
            
            // Collect multimeter pin coordinates to color connected wires as red/black probes
            const mmProbeColors = new Map<string, string>(); // 'x,y' -> color
            if (activeView === 'breadboard') {
               for (const comp of visibleComponents) {
                 const rotRad = (comp.rotation || 0) * Math.PI / 180;
                 const cos = Math.cos(rotRad);
                 const sin = Math.sin(rotRad);

                 const setProbeColor = (dx: number, dy: number, color: string) => {
                   const px = comp.position.x + (dx * cos - dy * sin);
                   const py = comp.position.y + (dx * sin + dy * cos);
                   mmProbeColors.set(`${Math.round(px)},${Math.round(py)}`, color);
                 };

                 if (comp.type === 'multimeter') {
                     // Pin 1: {x: -22, y: 48} (Red / Positive V-Ω-A)
                     setProbeColor(-22, 48, '#e74c3c');
                     // Pin 2: {x: 22, y: 48} (Black / COM)
                     setProbeColor(22, 48, '#2c3e50');
                 } else if (comp.type === 'vsource' || comp.type === 'isource') {
                     // Pin 1: {x: 0, y: -20} (Red / +)
                     setProbeColor(0, -20, '#e74c3c');
                     // Pin 2: {x: 0, y: 20} (Black / -)
                     setProbeColor(0, 20, '#2c3e50');
                 } else if (comp.type === 'oscilloscope') {
                     // CH1
                     setProbeColor(-80, -70, '#2ecc71');
                     setProbeColor(-80, -50, '#7f8c8d');
                     // CH2
                     setProbeColor(-80, -20, '#f1c40f');
                     setProbeColor(-80, 0, '#7f8c8d');
                     // CH3
                     setProbeColor(-80, 30, '#00ffff');
                     setProbeColor(-80, 50, '#7f8c8d');
                     // CH4
                     setProbeColor(-80, 80, '#ff00ff');
                     setProbeColor(-80, 100, '#7f8c8d');
                 }
               }
            }

            const renderWire = (wire: any) => {
              const isSelected = selectedIds.includes(wire.id);
              let overrideColor = undefined;
              if (wire.points.length > 0) {
                 const startStr = `${Math.round(wire.points[0].x)},${Math.round(wire.points[0].y)}`;
                 const endStr = `${Math.round(wire.points[wire.points.length-1].x)},${Math.round(wire.points[wire.points.length-1].y)}`;
                 if (mmProbeColors.has(startStr)) overrideColor = mmProbeColors.get(startStr);
                 else if (mmProbeColors.has(endStr)) overrideColor = mmProbeColors.get(endStr);
              }

              const displayWire = overrideColor ? { ...wire, color: overrideColor } : wire;

              return (
                <WireNode 
                  key={wire.id} 
                  wire={displayWire} 
                  isSelected={isSelected}
                  theme={theme}
                  onSelect={(e) => {
                    if (mode === 'probe') {
                      const resolver = new NodeResolver();
                      const resolved = resolver.resolve(circuit);
                      const node = resolved.wires.get(wire.id);
                      if (node && typeof node === 'string' && node !== '0') {
                        const stage = e.target.getStage();
                        const pointer = stage.getPointerPosition();
                        const rawX = (pointer.x - stage.x()) / stage.scaleX();
                        const rawY = (pointer.y - stage.y()) / stage.scaleX();
                        
                        let minSqDist = Infinity;
                        let closest = { x: rawX, y: rawY };
                        for (let i = 0; i < wire.points.length - 1; i++) {
                          const p1 = wire.points[i];
                          const p2 = wire.points[i + 1];
                          const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                          if (l2 === 0) continue;
                          let t = ((rawX - p1.x) * (p2.x - p1.x) + (rawY - p1.y) * (p2.y - p1.y)) / l2;
                          t = Math.max(0, Math.min(1, t));
                          const projX = p1.x + t * (p2.x - p1.x);
                          const projY = p1.y + t * (p2.y - p1.y);
                          const distSq = Math.pow(rawX - projX, 2) + Math.pow(rawY - projY, 2);
                          if (distSq < minSqDist) {
                            minSqDist = distSq;
                            closest = { x: projX, y: projY };
                          }
                        }
                        toggleProbe(node, closest.x, closest.y);
                      }
                    } else if (mode === 'select') {
                      e.cancelBubble = true;
                      if (!e.evt.shiftKey && !selectedIds.includes(wire.id)) {
                        setSelection([wire.id]);
                      } else if (e.evt.shiftKey) {
                        setSelection([...selectedIds, wire.id]);
                      }
                    }
                  }}
                  onPointDragStart={() => {
                    if (!selectedIds.includes(wire.id)) {
                      setSelection([wire.id]);
                    }
                    useEditorStore.temporal.getState().pause();
                  }}
                  onPointDragEnd={(index, x, y) => {
                    const snapped = getMagneticSnap({x, y}, 30, { wireId: wire.id, index }) || {
                      x: Math.round(x / 10) * 10,
                      y: Math.round(y / 10) * 10
                    };
                    useEditorStore.temporal.getState().resume();
                    updateWirePoint(wire.id, index, snapped);
                    setPreviewSnapPos(null);
                  }}
                  onPointDragMove={(index, x, y) => {
                    updateWirePoint(wire.id, index, { x, y });
                    const snap = getMagneticSnap({x, y}, 30, { wireId: wire.id, index });
                    if (snap) {
                      setPreviewSnapPos(snap);
                    } else {
                      setPreviewSnapPos(null);
                    }
                  }}
                  onDblClick={() => setEditingComponent(wire.id)}
                />
              );
            };

            const junctionDots = [];
            const getPointKey = (x: number, y: number) => `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;
            
            const segments = [];
            for (const wire of visibleWires) {
               for (let i = 0; i < wire.points.length - 1; i++) {
                 segments.push({ p1: wire.points[i], p2: wire.points[i+1] });
               }
            }

            const allPoints = new Set<string>();
            for (const wire of visibleWires) {
               for (const p of wire.points) {
                 allPoints.add(getPointKey(p.x, p.y));
               }
            }
            for (const comp of visibleComponents) {
               const libComp = ComponentLibrary[comp.type];
               if (libComp) {
                 const rotRad = (comp.rotation || 0) * Math.PI / 180;
                 const cos = Math.round(Math.cos(rotRad));
                 const sin = Math.round(Math.sin(rotRad));
                 for (const pin of libComp.pins) {
                   const rx = comp.mirrored ? -pin.offset.x : pin.offset.x;
                   const ry = pin.offset.y;
                   const x = comp.position.x + (rx * cos - ry * sin);
                   const y = comp.position.y + (rx * sin + ry * cos);
                   allPoints.add(getPointKey(x, y));
                 }
               }
            }

            for (const ptStr of Array.from(allPoints)) {
              const [px, py] = ptStr.split(',').map(Number);
              let degree = 0;
              for (const seg of segments) {
                const l2 = Math.pow(seg.p2.x - seg.p1.x, 2) + Math.pow(seg.p2.y - seg.p1.y, 2);
                let dist = 0;
                if (l2 === 0) {
                  dist = Math.hypot(px - seg.p1.x, py - seg.p1.y);
                } else {
                  let t = ((px - seg.p1.x) * (seg.p2.x - seg.p1.x) + (py - seg.p1.y) * (seg.p2.y - seg.p1.y)) / l2;
                  t = Math.max(0, Math.min(1, t));
                  const projX = seg.p1.x + t * (seg.p2.x - seg.p1.x);
                  const projY = seg.p1.y + t * (seg.p2.y - seg.p1.y);
                  dist = Math.hypot(px - projX, py - projY);
                }
                
                if (dist <= 1) {
                  const atEndpoint = Math.hypot(px - seg.p1.x, py - seg.p1.y) <= 1 || Math.hypot(px - seg.p2.x, py - seg.p2.y) <= 1;
                  if (atEndpoint) {
                     degree += 1;
                  } else {
                     degree += 2;
                  }
                }
              }
              if (degree >= 3) {
                 junctionDots.push(
                    <Circle key={`junc-${ptStr}`} x={px} y={py} radius={3.5} fill={theme === 'dark' ? '#cdd6f4' : '#34495e'} listening={false} />
                 );
              }
            }

            const readings: Record<string, string> = {};
            if (nodeVoltages && Object.keys(nodeVoltages).length > 0) {
              const resolver = new NodeResolver();
              const { components } = resolver.resolve(circuit);
              for (const comp of visibleComponents) {
                if (comp.type === 'multimeter') {
                  const pinMap = components.get(comp.id);
                  if (pinMap) {
                    const n1 = pinMap.get('1') || '0';
                    const n2 = pinMap.get('2') || '0';
                    let reading = 0;
                    if (comp.params.mode === 'current') {
                      const branchName = `v.vmm_${comp.id.replace(/-/g, '').toLowerCase()}#branch`;
                      reading = nodeVoltages[branchName] || 0;
                    } else {
                      const v1 = n1 === '0' ? 0 : (nodeVoltages[`v(${n1})`] || 0);
                      const v2 = n2 === '0' ? 0 : (nodeVoltages[`v(${n2})`] || 0);
                      reading = v1 - v2;
                    }
                    const abs = Math.abs(reading);
                    let formatted = '0.00 V';
                    if (comp.params.mode === 'current') {
                       if (abs === 0) formatted = '0.00 A';
                       else if (abs >= 1) formatted = `${parseFloat(reading.toFixed(3))} A`;
                       else if (abs >= 1e-3) formatted = `${parseFloat((reading * 1e3).toFixed(3))} mA`;
                       else if (abs >= 1e-6) formatted = `${parseFloat((reading * 1e6).toFixed(3))} µA`;
                       else formatted = `${reading.toExponential(2)} A`;
                    } else if (comp.params.mode === 'resistance') {
                       // R = V / I, where I = 1mA (0.001A)
                       const resistance = abs / 0.001; 
                       if (resistance >= 1e9) formatted = 'O.L (Open)'; // Effectively open circuit
                       else if (resistance >= 1e6) formatted = `${parseFloat((resistance / 1e6).toFixed(3))} MΩ`;
                       else if (resistance >= 1e3) formatted = `${parseFloat((resistance / 1e3).toFixed(3))} kΩ`;
                       else formatted = `${parseFloat(resistance.toFixed(2))} Ω`;
                    } else {
                       if (abs === 0) formatted = '0.00 V';
                       else if (abs >= 1e3) formatted = `${parseFloat((reading / 1e3).toFixed(3))} kV`;
                       else if (abs >= 1) formatted = `${parseFloat(reading.toFixed(3))} V`;
                       else if (abs >= 1e-3) formatted = `${parseFloat((reading * 1e3).toFixed(3))} mV`;
                       else if (abs >= 1e-6) formatted = `${parseFloat((reading * 1e6).toFixed(3))} µV`;
                       else formatted = `${reading.toExponential(2)} V`;
                    }
                    readings[comp.id] = formatted;
                  }
                }
              }
            }

            const renderComponent = (comp: any) => {
              const isSelected = selectedIds.includes(comp.id);
              const renderPos = comp.position;
              return (
                <ComponentNode
                  key={comp.id} 
                  component={{ ...comp, position: renderPos }} 
                  mode={mode}
                  isSelected={isSelected}
                  theme={theme}
                  activeView={activeView}
                  multimeterReading={readings[comp.id]}
                  onSelect={(e) => {
                    if (mode === 'probe') {
                      const resolver = new NodeResolver();
                      const resolved = resolver.resolve(circuit);
                      const pins = resolved.components.get(comp.id);
                      if (pins && typeof pins !== 'string') {
                         const node = pins.get("1");
                         if (node && node !== '0') {
                           const libComp = ComponentLibrary[comp.type];
                           const pin = libComp?.pins.find(p => p.id === "1");
                           let x = comp.position.x;
                           let y = comp.position.y;
                           if (pin) {
                             const rotRad = (comp.rotation || 0) * Math.PI / 180;
                             const cos = Math.round(Math.cos(rotRad));
                             const sin = Math.round(Math.sin(rotRad));
                             const rx = pin.offset.x * cos - pin.offset.y * sin;
                             const ry = pin.offset.x * sin + pin.offset.y * cos;
                             x += rx;
                             y += ry;
                           }
                           toggleProbe(node, x, y);
                         }
                      }
                    } else if (mode === 'select') {
                      const stage = e.target.getStage();
                      const pos = getRelativePointerPosition(stage);
                      const pinSnap = getMagneticSnap(pos, 12);
                      if (!pinSnap) {
                        if (!e.evt.shiftKey && !selectedIds.includes(comp.id)) {
                          setSelection([comp.id]);
                        } else if (e.evt.shiftKey) {
                          setSelection([...selectedIds, comp.id]);
                        }
                      }
                    }
                  }}
                  onDblClick={() => setEditingComponent(comp.id)}
                  onDragStart={(e) => {
                    if (!selectedIds.includes(comp.id)) {
                      setSelection([comp.id]);
                    }
                    e.target.moveToTop();
                    useEditorStore.temporal.getState().pause();
                  }}
                  onDragMove={(e) => {
                    let newPos = { x: e.target.x(), y: e.target.y() };
                    if (activeView === 'breadboard') {
                       const snap = getComponentBreadboardSnap(comp.type, newPos, comp.rotation, comp.mirrored);
                       if (snap) newPos = snap;
                    }
                    updateComponentPosition(comp.id, newPos);
                  }}
                  onDragEnd={(e) => {
                    let newPos = {
                      x: Math.round(e.target.x() / 10) * 10,
                      y: Math.round(e.target.y() / 10) * 10
                    };
                    if (activeView === 'breadboard') {
                       const snap = getComponentBreadboardSnap(comp.type, { x: e.target.x(), y: e.target.y() }, comp.rotation, comp.mirrored);
                       if (snap) newPos = snap;
                    }
                    useEditorStore.temporal.getState().resume();
                    updateComponentPosition(comp.id, newPos);
                  }}
                  onMouseEnter={() => setHoveredComponentId(comp.id)}
                  onMouseLeave={() => setHoveredComponentId(null)}
                />
              );
            };

            const sortedWires = [...visibleWires].sort((a, b) => {
              const aSel = selectedIds.includes(a.id) ? 1 : 0;
              const bSel = selectedIds.includes(b.id) ? 1 : 0;
              return aSel - bSel;
            });

            const sortedComps = [...visibleComponents].sort((a, b) => {
              const aSel = selectedIds.includes(a.id) ? 1 : 0;
              const bSel = selectedIds.includes(b.id) ? 1 : 0;
              return aSel - bSel;
            });

            return (
              <>
                {sortedWires.map(renderWire)}
                {junctionDots}
                {sortedComps.map(renderComponent)}
              </>
            );
          })()}

          
          {mode === 'wire' && drawingWirePoints.length > 0 && mousePos && (
            <Line
              points={[
                ...drawingWirePoints.flatMap(p => [p.x, p.y]),
                mousePos.x, mousePos.y
              ]}
              stroke={theme === 'dark' ? '#cdd6f4' : '#95a5a6'}
              dash={[5, 5]}
              strokeWidth={2}
            />
          )}
          
          
          
          {mode === 'place' && componentToPlace && mousePos && (
            <ComponentNode
              component={{
                id: 'ghost',
                type: componentToPlace,
                position: mousePos,
                rotation: 0,
                mirrored: false,
                params: {}
              }}
              isSelected={false}
              mode={mode}
              theme={theme}
              activeView={activeView}
              onSelect={() => {}}
              onDblClick={() => {}}
              onDragEnd={() => {}}
              onDragMove={() => {}}
              opacity={0.5}
            />
          )}
          
          {/* Pin Indicators */}
          {(mode === 'wire' || hoveredComponentId !== null) && visibleComponents.flatMap(comp => {
            if (mode !== 'wire' && comp.id !== hoveredComponentId) return [];
            
            const libComp = ComponentLibrary[comp.type];
            if (!libComp) return [];
            const rot = comp.rotation;
            const rotRad = (rot || 0) * Math.PI / 180;
            const cos = Math.round(Math.cos(rotRad));
            const sin = Math.round(Math.sin(rotRad));
            
            const renderPos = comp.position;
            return (
              <React.Fragment key={`pins-${comp.id}`}>
                {libComp.pins.map(pin => {
                  const baseOffset = pin.offset;
                  const mirroredOffsetX = comp.mirrored ? -baseOffset.x : baseOffset.x;
                  const mirroredOffsetY = baseOffset.y;
                  const rotatedOffsetX = mirroredOffsetX * cos - mirroredOffsetY * sin;
                  const rotatedOffsetY = mirroredOffsetX * sin + mirroredOffsetY * cos;
                  return (
                    <Circle
                      key={`${comp.id}-${pin.id}`}
                x={renderPos.x + rotatedOffsetX}
                y={renderPos.y + rotatedOffsetY}
                radius={4}
                fill="white"
                stroke="#e74c3c"
                strokeWidth={2}
                listening={false}
              />
                  );
                })}
              </React.Fragment>
            );
          })}

        {/* Render node voltages if available */}
        {activeView === 'schematic' && nodeVoltages && Object.keys(nodeVoltages).length > 0 && selectedIds.length === 0 && (
          (() => {
            const resolver = new NodeResolver();
            const { components, wires } = resolver.resolve(circuit);
            
            // To render the node voltage, we can find the first coordinate associated with each node
            const nodeCoords = new Map<string, {x: number, y: number, dir: string}>();
            
            // For each node, collect all wire segments
            const nodeSegments = new Map<string, {p1: {x:number, y:number}, p2: {x:number, y:number}}[]>();
            
            // Map from wire points
            for (const wire of visibleWires) {
              const nodeName = wires.get(wire.id);
              if (nodeName && wire.points.length > 1) {
                if (!nodeSegments.has(nodeName)) nodeSegments.set(nodeName, []);
                const segs = nodeSegments.get(nodeName)!;
                for (let i = 0; i < wire.points.length - 1; i++) {
                  segs.push({ p1: wire.points[i], p2: wire.points[i+1] });
                }
              } else if (nodeName && wire.points.length === 1) {
                if (!nodeCoords.has(nodeName)) {
                  nodeCoords.set(nodeName, { ...wire.points[0], dir: 'down' });
                }
              }
            }
            
            // For each node, find the longest segment and place the label in its center
            for (const [nodeName, segs] of Array.from(nodeSegments.entries())) {
              let longest = segs[0];
              let maxDist = 0;
              for (const seg of segs) {
                const dist = Math.hypot(seg.p2.x - seg.p1.x, seg.p2.y - seg.p1.y);
                if (dist > maxDist) {
                  maxDist = dist;
                  longest = seg;
                }
              }
              if (longest) {
                const dx = longest.p2.x - longest.p1.x;
                const dy = longest.p2.y - longest.p1.y;
                let dir = 'down';
                if (Math.abs(dx) < Math.abs(dy)) {
                  dir = 'left';
                } else {
                  dir = 'down';
                }
                nodeCoords.set(nodeName, { 
                  x: (longest.p1.x + longest.p2.x) / 2, 
                  y: (longest.p1.y + longest.p2.y) / 2,
                  dir
                });
              }
            }
            
            // Map from component pins (as a fallback if no wire segments exist)
            for (const comp of visibleComponents) {
              const compPinMap = components.get(comp.id);
              if (compPinMap) {
                const libComp = ComponentLibrary[comp.type];
                if (libComp) {
                  for (const pin of libComp.pins) {
                    const nodeName = compPinMap.get(pin.id);
                    if (nodeName && !nodeCoords.has(nodeName)) {
                      const rotRad = (comp.rotation || 0) * Math.PI / 180;
                      const cos = Math.round(Math.cos(rotRad));
                      const sin = Math.round(Math.sin(rotRad));
                      const mirroredOffsetX = comp.mirrored ? -pin.offset.x : pin.offset.x;
                      const mirroredOffsetY = pin.offset.y;
                      const rx = mirroredOffsetX * cos - mirroredOffsetY * sin;
                      const ry = mirroredOffsetX * sin + mirroredOffsetY * cos;
                      
                      let dir = 'down';
                      if (Math.abs(rx) > Math.abs(ry)) {
                        dir = rx > 0 ? 'left' : 'right';
                      } else {
                        dir = ry > 0 ? 'up' : 'down';
                      }
                      
                      nodeCoords.set(nodeName, { x: comp.position.x + rx, y: comp.position.y + ry, dir });
                    }
                  }
                }
              }
            }

            return Array.from(nodeCoords.entries()).map(([nodeName, coord]) => {
              if (!coord || isNaN(coord.x) || isNaN(coord.y)) return null;
              const vStr = `v(${nodeName})`;
              const vVal = nodeVoltages[vStr];
              if (vVal !== undefined) {
                const abs = Math.abs(vVal);
                let formatted = '0V';
                if (abs === 0) formatted = '0V';
                else if (abs >= 1e3) formatted = `${parseFloat((vVal / 1e3).toFixed(3))}kV`;
                else if (abs >= 1) formatted = `${parseFloat(vVal.toFixed(3))}V`;
                else if (abs >= 1e-3) formatted = `${parseFloat((vVal * 1e3).toFixed(3))}mV`;
                else if (abs >= 1e-6) formatted = `${parseFloat((vVal * 1e6).toFixed(3))}µV`;
                else formatted = `${vVal.toExponential(2)}V`;

                return (
                  <Label
                    key={`v-${nodeName}`}
                    x={coord.x}
                    y={coord.y}
                    listening={false}
                  >
                    <Tag 
                      fill={theme === 'dark' ? '#181825' : '#ffffff'} 
                      stroke={theme === 'dark' ? '#89b4fa' : '#3498db'} 
                      strokeWidth={1} 
                      cornerRadius={3}
                      pointerDirection={coord.dir}
                      pointerWidth={8}
                      pointerHeight={8}
                      shadowColor="rgba(0,0,0,0.15)"
                      shadowBlur={3}
                    />
                    <Text
                      text={formatted}
                      fontSize={9}
                      padding={4}
                      fill={theme === 'dark' ? '#89b4fa' : '#2980b9'}
                      fontStyle="bold"
                    />
                  </Label>
                );
              }
              return null;
            });
          })()
        )}

          {/* Render visual probes */}
          {visibleProbes.map(probe => (
            <ProbeKonvaNode key={`probe-${probe.nodeId}`} probe={probe} />
          ))}
        
          {/* Approach A: Hollow preview dot (Moved here to ensure it renders ON TOP of everything, including pin indicators) */}
          {mode === 'wire' && drawingWirePoints.length > 0 && mousePos && (() => {
             let onWire = false;
             for (const wire of circuit.wires) {
               for (let i = 0; i < wire.points.length - 1; i++) {
                 const p1 = wire.points[i];
                 const p2 = wire.points[i+1];
                 const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                 let dist = 0;
                 if (l2 === 0) dist = Math.hypot(mousePos.x - p1.x, mousePos.y - p1.y);
                 else {
                   let t = ((mousePos.x - p1.x) * (p2.x - p1.x) + (mousePos.y - p1.y) * (p2.y - p1.y)) / l2;
                   t = Math.max(0, Math.min(1, t));
                   const projX = p1.x + t * (p2.x - p1.x);
                   const projY = p1.y + t * (p2.y - p1.y);
                   dist = Math.hypot(mousePos.x - projX, mousePos.y - projY);
                 }
                 if (dist <= 1) {
                   onWire = true;
                   break;
                 }
               }
               if (onWire) break;
             }
             if (!onWire) {
               for (const comp of circuit.components) {
                 const libComp = ComponentLibrary[comp.type];
                 if (!libComp) continue;
                 const rotRad = (comp.rotation || 0) * Math.PI / 180;
                 const cos = Math.round(Math.cos(rotRad));
                 const sin = Math.round(Math.sin(rotRad));
                 for (const pin of libComp.pins) {
                   const rx = comp.mirrored ? -pin.offset.x : pin.offset.x;
                   const ry = pin.offset.y;
                   const px = comp.position.x + (rx * cos - ry * sin);
                   const py = comp.position.y + (rx * sin + ry * cos);
                   if (Math.hypot(mousePos.x - px, mousePos.y - py) <= 1) {
                     onWire = true;
                     break;
                   }
                 }
                 if (onWire) break;
               }
             }
             if (onWire) {
               return <Circle x={mousePos.x} y={mousePos.y} radius={8} stroke={theme === 'dark' ? '#f1c40f' : '#e67e22'} strokeWidth={3} fill="transparent" listening={false} />;
             }
             return null;
          })()}

          {/* Preview dot for DRAGGING existing wire points */}
          {previewSnapPos && (
             <Circle x={previewSnapPos.x} y={previewSnapPos.y} radius={8} stroke={theme === 'dark' ? '#f1c40f' : '#e67e22'} strokeWidth={3} fill="transparent" listening={false} />
          )}
</Layer>
      </Stage>
    </div>
  );
};
