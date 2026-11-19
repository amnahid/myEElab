import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Group, Rect, Label, Tag, Text } from 'react-konva';
import { BOARD_WIDTH, BOARD_HEIGHT, HOLES, getHolePosition } from './breadboardLayout';
import { useEditorStore, getComponentPinCoords } from '../store/editorStore';
import { ComponentNode } from './ComponentNode';
import { WireNode } from './WireNode';
import { ProbeKonvaNode, getProbeCursorSvgUrl } from './ProbeIcon';
import { ComponentLibrary } from '../engine/library';
import { deriveBreadboardWires } from '../engine/breadboardSync';
import { NodeResolver } from '../engine/nodeResolver';
import { ensureCircuitRefDes, isUnindexedRefDes } from '../engine/refDes';
import { Point } from '../models/circuit';
import { getMagneticSnapPosition } from './snapUtils';
import { moveWireSegment, getTextScale } from './wireUtils';
import { useSimulationStore } from '../store/simulationStore';

interface CanvasProps {
  nodeVoltages?: Record<string, number>;
  tranData?: { time: number[], vectors: Record<string, number[]> };
  theme: 'light' | 'dark';
  simError?: string | null;
}

export let lastCanvasPointerPos: Point | null = null;
export const getLastCanvasPointerPos = (): Point | null => lastCanvasPointerPos;

export const Canvas: React.FC<CanvasProps> = ({ nodeVoltages: propNodeVoltages, tranData, theme, simError }) => {
  const storeVoltages = useSimulationStore(state => state.nodeVoltages);
  const storeLedStates = useSimulationStore(state => state.ledStates);
  const nodeVoltages = propNodeVoltages !== undefined ? propNodeVoltages : storeVoltages;
  const { circuit, mode, componentToPlace, addComponent, updateComponentPosition, selectedIds, setSelection, addWire, stagePos, scale, setStageView, setEditingComponent, updateWirePoint, updateWirePoints, setMode, probes, toggleProbe, removeProbe, activeView, showInstruments, activeAnalysis } = useEditorStore();
  const textScale = getTextScale(scale);
  
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [previewSnapPos, setPreviewSnapPos] = useState<{x: number, y: number} | null>(null);
  const [drawingWirePoints, setDrawingWirePoints] = useState<{x: number, y: number}[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; current: Point } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; stageX: number; stageY: number } | null>(null);
  const draggingSegmentRef = useRef<{ wireId: string; segIndex: number; startPos: Point; initialPoints: Point[] } | null>(null);
  const suppressNextClickRef = useRef(false);

  // Compute ratlines (breadboard to schematic sync)
  const ratlines = useMemo(() => deriveBreadboardWires(circuit), [circuit]);

  // Automatically annotate missing or unindexed Reference Designators (e.g. R1, R2, C1, U1, LED1)
  useEffect(() => {
    if (circuit?.components && circuit.components.length > 0) {
      const needsAnnotation = circuit.components.some(c =>
        (c.type === 'ground' || c.type === 'breadboard')
          ? c.refDes !== undefined
          : (!c.refDes || isUnindexedRefDes(c.refDes, c.type))
      );
      if (needsAnnotation) {
        const clonedCircuit = {
          ...circuit,
          components: circuit.components.map(c => ({ ...c }))
        };
        if (ensureCircuitRefDes(clonedCircuit)) {
          useEditorStore.setState({ circuit: clonedCircuit });
        }
      }
    }
  }, [circuit.components]);

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

  // Resolve circuit topology (memoized to avoid re-resolving on animation frames)
  const resolvedCircuit = useMemo(() => {
    const resolver = new NodeResolver();
    return resolver.resolve(circuit);
  }, [circuit]);

  // Compute junction dots (only changes when wires/components/theme change)
  const junctionDots = useMemo(() => {
    const dots: React.ReactNode[] = [];
    const getPointKey = (x: number, y: number) => `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;

    const segments: { p1: Point; p2: Point }[] = [];
    for (const wire of visibleWires) {
      for (let i = 0; i < wire.points.length - 1; i++) {
        segments.push({ p1: wire.points[i], p2: wire.points[i + 1] });
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
        dots.push(
          <Circle key={`junc-${ptStr}`} x={px} y={py} radius={3.5} fill={theme === 'dark' ? '#EEEAE4' : '#30383E'} listening={false} />
        );
      }
    }
    return dots;
  }, [visibleWires, visibleComponents, theme]);

  // Compute node coordinate mapping for voltage badges (only changes when circuit geometry changes)
  const nodeCoords = useMemo(() => {
    const coords = new Map<string, { x: number; y: number; dir: string }>();
    const { components, wires } = resolvedCircuit;

    const nodeSegments = new Map<string, { p1: Point; p2: Point }[]>();
    for (const wire of visibleWires) {
      const nodeName = wires.get(wire.id);
      if (nodeName && wire.points.length > 1) {
        if (!nodeSegments.has(nodeName)) nodeSegments.set(nodeName, []);
        const segs = nodeSegments.get(nodeName)!;
        for (let i = 0; i < wire.points.length - 1; i++) {
          segs.push({ p1: wire.points[i], p2: wire.points[i + 1] });
        }
      } else if (nodeName && wire.points.length === 1) {
        if (!coords.has(nodeName)) {
          coords.set(nodeName, { ...wire.points[0], dir: 'down' });
        }
      }
    }

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
        const dir = Math.abs(dx) < Math.abs(dy) ? 'left' : 'down';
        coords.set(nodeName, {
          x: (longest.p1.x + longest.p2.x) / 2,
          y: (longest.p1.y + longest.p2.y) / 2,
          dir
        });
      }
    }

    for (const comp of visibleComponents) {
      const compPinMap = components.get(comp.id);
      if (compPinMap) {
        const libComp = ComponentLibrary[comp.type];
        if (libComp) {
          for (const pin of libComp.pins) {
            const nodeName = compPinMap.get(pin.id);
            if (nodeName && !coords.has(nodeName)) {
              const rotRad = (comp.rotation || 0) * Math.PI / 180;
              const cos = Math.round(Math.cos(rotRad));
              const sin = Math.round(Math.sin(rotRad));
              const mirroredOffsetX = comp.mirrored ? -pin.offset.x : pin.offset.x;
              const mirroredOffsetY = pin.offset.y;
              const rx = mirroredOffsetX * cos - mirroredOffsetY * sin;
              const ry = mirroredOffsetX * sin + mirroredOffsetY * cos;
              const dir = Math.abs(rx) > Math.abs(ry) ? (rx > 0 ? 'left' : 'right') : (ry > 0 ? 'up' : 'down');
              coords.set(nodeName, { x: comp.position.x + rx, y: comp.position.y + ry, dir });
            }
          }
        }
      }
    }
    return coords;
  }, [visibleWires, visibleComponents, resolvedCircuit]);

  // Compute AC multimeter readings from tranData
  const acMultimeterReadings = useMemo(() => {
    const map: Record<string, number> = {};
    if (!tranData || !tranData.time || tranData.time.length === 0) return map;
    const vectors = tranData.vectors;
    for (const comp of visibleComponents) {
      if (comp.type === 'multimeter' && (comp.params.mode === 'ac_voltage' || comp.params.mode === 'ac_current')) {
        const pinMap = resolvedCircuit.components.get(comp.id);
        if (!pinMap) continue;
        const n1 = pinMap.get('1') || '0';
        const n2 = pinMap.get('2') || '0';
        const expectedBranchName = `i(vmm_${comp.id.replace(/-/g, '')})`;
        const branchKey = Object.keys(vectors).find(k => k.toLowerCase() === expectedBranchName.toLowerCase());
        let sqSum = 0;
        let count = 0;
        for (let i = 0; i < tranData.time.length; i++) {
          let v1 = 0, v2 = 0;
          if (comp.params.mode === 'ac_current') {
            const iVec = branchKey ? vectors[branchKey] : null;
            v1 = iVec ? iVec[i] : 0;
          } else {
            const vec1 = n1 === '0' ? null : (vectors[`v(${n1})`] || vectors[`V(${n1})`]);
            const vec2 = n2 === '0' ? null : (vectors[`v(${n2})`] || vectors[`V(${n2})`]);
            v1 = vec1 ? vec1[i] : 0;
            v2 = vec2 ? vec2[i] : 0;
          }
          const diff = v1 - v2;
          sqSum += diff * diff;
          count++;
        }
        map[comp.id] = count > 0 ? Math.sqrt(sqSum / count) : 0;
      }
    }
    return map;
  }, [tranData, visibleComponents, resolvedCircuit]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = (w: number, h: number) => {
      setDimensions(prev => {
        if (prev.width === w && prev.height === h) return prev;
        return { width: w, height: h };
      });
    };

    if (typeof ResizeObserver !== 'undefined') {
      let animationFrameId: number;
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            const w = Math.floor(width);
            const h = Math.floor(height);
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
              updateSize(w, h);
            });
          }
        }
      });

      observer.observe(containerRef.current);

      if (containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) {
        updateSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
      }

      return () => {
        cancelAnimationFrame(animationFrameId);
        observer.disconnect();
      };
    } else {
      const fallbackUpdate = () => {
        if (containerRef.current) {
          updateSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
        }
      };
      fallbackUpdate();
      window.addEventListener('resize', fallbackUpdate);
      return () => window.removeEventListener('resize', fallbackUpdate);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
        if (!e.repeat) {
          setIsSpacePressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };
    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
      panStartRef.current = null;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Global window tracking while panning (ensures smooth movement even if mouse leaves stage)
  useEffect(() => {
    if (!isPanning) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      setStageView({
        x: panStartRef.current.stageX + dx,
        y: panStartRef.current.stageY + dy
      }, scale);
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
      suppressNextClickRef.current = true;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, scale, setStageView]);

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

      const currentScale = Math.max(0.1, scale || 1);
      const bbSnapThreshold = Math.min(10, Math.max(3.5, 12 / currentScale));

      for (const hole of HOLES) {
        const pos = getHolePosition(hole.id);
        if (!pos) continue;
        const hdx = boardX - pos.x;
        const hdy = boardY - pos.y;
        const dist = Math.sqrt(hdx * hdx + hdy * hdy);
        if (dist < bbSnapThreshold && dist < bestDist) {
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

      const currentScale = Math.max(0.1, scale || 1);
      const compBbSnapThreshold = Math.min(15, Math.max(4, 15 / currentScale));

      for (const hole of HOLES) {
        const hPos = getHolePosition(hole.id);
        if (!hPos) continue;
        const hdx = boardX - hPos.x;
        const hdy = boardY - hPos.y;
        const dist = Math.sqrt(hdx * hdx + hdy * hdy);
        
        if (dist < compBbSnapThreshold && dist < bestDist) {
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

  const getMagneticSnap = (rawPos: {x: number, y: number}, screenDist?: number, ignorePoint?: { wireId: string, index: number }) => {
    return getMagneticSnapPosition({
      circuit,
      rawPos,
      scale,
      mode,
      screenDist,
      ignorePoint
    });
  };

  const handleStageClick = (e: any) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

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
      const isWireStart = mode === 'select' && (getMagneticSnap(pos, 9) || (activeView === 'breadboard' && getBreadboardSnap(pos)));
      if (mode === 'wire' || isWireStart) {
        let pinSnap = getMagneticSnap(pos, mode === 'select' ? 9 : 12);
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
        const pinSnap = getMagneticSnap(pos, 9);
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

  const handleStageMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Middle click or Spacebar held + left click -> start panning
    if (e.evt.button === 1 || (isSpacePressed && e.evt.button === 0)) {
      setIsPanning(true);
      panStartRef.current = {
        mouseX: e.evt.clientX,
        mouseY: e.evt.clientY,
        stageX: stagePos.x,
        stageY: stagePos.y
      };
      return;
    }

    if (isSpacePressed) {
      return;
    }

    // Left click on empty stage in 'select' mode
    if (e.evt.button === 0 && mode === 'select' && e.target === stage) {
      const pos = getRelativePointerPosition(stage);
      const pinSnap = getMagneticSnap(pos, 9);
      if (!pinSnap) {
        setSelectionBox({ start: pos, current: pos });
      }
    }
  };

  const handleStageMouseUp = (e: any) => {
    if (draggingSegmentRef.current) {
      const stage = e.target?.getStage();
      const currentPos = stage ? getRelativePointerPosition(stage) : draggingSegmentRef.current.startPos;
      const { wireId, segIndex, startPos, initialPoints } = draggingSegmentRef.current;
      const p1 = initialPoints[segIndex];
      const p2 = initialPoints[segIndex + 1];
      const isH = Math.abs(p2.y - p1.y) <= Math.abs(p2.x - p1.x);

      let dx = 0;
      let dy = 0;
      if (isH) {
        const rawY = p1.y + (currentPos.y - startPos.y);
        const snappedY = Math.round(rawY / 10) * 10;
        dy = snappedY - p1.y;
      } else {
        const rawX = p1.x + (currentPos.x - startPos.x);
        const snappedX = Math.round(rawX / 10) * 10;
        dx = snappedX - p1.x;
      }

      const finalPoints = moveWireSegment(initialPoints, segIndex, { dx, dy }, true);
      useEditorStore.temporal.getState().resume();
      updateWirePoints(wireId, finalPoints);
      draggingSegmentRef.current = null;
      suppressNextClickRef.current = true;
      if (stage) stage.container().style.cursor = '';
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      suppressNextClickRef.current = true;
      return;
    }

    if (selectionBox) {
      const boxX1 = Math.min(selectionBox.start.x, selectionBox.current.x);
      const boxX2 = Math.max(selectionBox.start.x, selectionBox.current.x);
      const boxY1 = Math.min(selectionBox.start.y, selectionBox.current.y);
      const boxY2 = Math.max(selectionBox.start.y, selectionBox.current.y);

      const width = boxX2 - boxX1;
      const height = boxY2 - boxY1;

      if (width >= 4 || height >= 4) {
        suppressNextClickRef.current = true;
        const selected: string[] = [];

        // Check components
        for (const comp of circuit.components) {
          let intersects = false;
          if (comp.position.x >= boxX1 && comp.position.x <= boxX2 &&
              comp.position.y >= boxY1 && comp.position.y <= boxY2) {
            intersects = true;
          }
          if (!intersects) {
            const pinCoords = getComponentPinCoords(comp, circuit.customComponents);
            for (const pt of pinCoords) {
              const [px, py] = pt.split(',').map(Number);
              if (px >= boxX1 && px <= boxX2 && py >= boxY1 && py <= boxY2) {
                intersects = true;
                break;
              }
            }
          }
          if (!intersects) {
            const cMinX = comp.position.x - 25;
            const cMaxX = comp.position.x + 25;
            const cMinY = comp.position.y - 25;
            const cMaxY = comp.position.y + 25;
            if (boxX1 <= cMaxX && boxX2 >= cMinX && boxY1 <= cMaxY && boxY2 >= cMinY) {
              intersects = true;
            }
          }

          if (intersects) {
            selected.push(comp.id);
          }
        }

        // Check wires
        for (const wire of circuit.wires) {
          let intersects = false;
          for (const p of wire.points) {
            if (p.x >= boxX1 && p.x <= boxX2 && p.y >= boxY1 && p.y <= boxY2) {
              intersects = true;
              break;
            }
          }
          if (!intersects) {
            for (let i = 0; i < wire.points.length - 1; i++) {
              const p1 = wire.points[i];
              const p2 = wire.points[i + 1];
              const segMinX = Math.min(p1.x, p2.x);
              const segMaxX = Math.max(p1.x, p2.x);
              const segMinY = Math.min(p1.y, p2.y);
              const segMaxY = Math.max(p1.y, p2.y);
              if (segMinX <= boxX2 && segMaxX >= boxX1 && segMinY <= boxY2 && segMaxY >= boxY1) {
                intersects = true;
                break;
              }
            }
          }

          if (intersects) {
            selected.push(wire.id);
          }
        }

        if (e.evt.shiftKey) {
          const merged = Array.from(new Set([...selectedIds, ...selected]));
          setSelection(merged);
        } else {
          setSelection(selected);
        }
      }
      setSelectionBox(null);
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    if (stage) {
      lastCanvasPointerPos = getRelativePointerPosition(stage);
    }

    if (draggingSegmentRef.current && stage) {
      const currentPos = getRelativePointerPosition(stage);
      const { wireId, segIndex, startPos, initialPoints } = draggingSegmentRef.current;
      const p1 = initialPoints[segIndex];
      const p2 = initialPoints[segIndex + 1];
      const isH = Math.abs(p2.y - p1.y) <= Math.abs(p2.x - p1.x);

      let dx = 0;
      let dy = 0;
      if (isH) {
        const rawY = p1.y + (currentPos.y - startPos.y);
        const snappedY = Math.round(rawY / 10) * 10;
        dy = snappedY - p1.y;
      } else {
        const rawX = p1.x + (currentPos.x - startPos.x);
        const snappedX = Math.round(rawX / 10) * 10;
        dx = snappedX - p1.x;
      }

      const newPoints = moveWireSegment(initialPoints, segIndex, { dx, dy }, false);
      updateWirePoints(wireId, newPoints);
      return;
    }

    if (isPanning && panStartRef.current) {
      const dx = e.evt.clientX - panStartRef.current.mouseX;
      const dy = e.evt.clientY - panStartRef.current.mouseY;
      setStageView({
        x: panStartRef.current.stageX + dx,
        y: panStartRef.current.stageY + dy
      }, scale);
      return;
    }

    if (selectionBox && stage) {
      const pos = getRelativePointerPosition(stage);
      setSelectionBox(prev => prev ? { ...prev, current: pos } : null);
      return;
    }

    if (mode === 'place' || (mode === 'wire' && drawingWirePoints.length > 0)) {
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
    if (isPanning) return 'grabbing';
    if (isSpacePressed) return 'grab';
    if (mode === 'probe') {
      // Realistic multimeter probe cursor
      return getProbeCursorSvgUrl();
    }
    if (mode === 'wire' || mode === 'place') return 'crosshair';
    return '';
  };

  useEffect(() => {
    if (containerRef.current) {
      const stageContent = containerRef.current.querySelector('.konvajs-content') as HTMLElement | null;
      if (stageContent) {
        stageContent.style.cursor = getCursor() || '';
      }
    }
  }, [isPanning, isSpacePressed, mode]);

  return (
    <div 
      ref={containerRef} 
      style={{ flex: 1, backgroundColor: theme === 'dark' ? '#20252A' : '#EEEAE4', width: '100%', height: '100%', overflow: 'hidden', cursor: getCursor() || undefined }}
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
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={handleStageClick}
        onMouseLeave={() => {
          lastCanvasPointerPos = null;
          if (selectionBox) setSelectionBox(null);
          if (isPanning) {
            setIsPanning(false);
            panStartRef.current = null;
          }
          if (draggingSegmentRef.current) {
            useEditorStore.temporal.getState().resume();
            draggingSegmentRef.current = null;
          }
        }}
      >
        <Layer>
          {/* Breadboard Background is now a component, so no static background here */}

          {/* 1. Unselected Wires */}
          {/* Breadboard Ratlines */}
          {activeView === 'breadboard' && ratlines.map(w => (
            <Line
              key={w.id}
              points={w.points.flatMap(p => [p.x, p.y])}
              stroke={theme === 'dark' ? '#B9924D' : '#B9924D'}
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
                  listening={!isSpacePressed && !isPanning}
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
                    const snapped = getMagneticSnap({x, y}, 12, { wireId: wire.id, index }) || {
                      x: Math.round(x / 10) * 10,
                      y: Math.round(y / 10) * 10
                    };
                    useEditorStore.temporal.getState().resume();
                    updateWirePoint(wire.id, index, snapped);
                    setPreviewSnapPos(null);
                  }}
                  onPointDragMove={(index, x, y) => {
                    updateWirePoint(wire.id, index, { x, y });
                    const snap = getMagneticSnap({x, y}, 12, { wireId: wire.id, index });
                    if (snap) {
                      setPreviewSnapPos(snap);
                    } else {
                      setPreviewSnapPos(null);
                    }
                  }}
                  onSegmentMouseDown={(segIndex, e) => {
                    if (mode !== 'select') return;
                    const stage = e.target.getStage();
                    if (!stage) return;
                    if (!selectedIds.includes(wire.id)) {
                      setSelection([wire.id]);
                    }
                    const startPos = getRelativePointerPosition(stage);
                    draggingSegmentRef.current = {
                      wireId: wire.id,
                      segIndex,
                      startPos,
                      initialPoints: wire.points.map((p: Point) => ({ ...p }))
                    };
                    useEditorStore.temporal.getState().pause();
                  }}
                  onDblClick={() => setEditingComponent(wire.id)}
                />
              );
            };

            const readings: Record<string, string> = {};
            const powers: Record<string, number> = {};
            const activeLedStates: Record<string, { isOn: boolean; intensity: number }> = { ...storeLedStates };
            const components = resolvedCircuit.components;
            
            for (const comp of visibleComponents) {
              const pinMap = components.get(comp.id);
              if (comp.type === 'multimeter') {
                if (pinMap) {
                  const n1 = pinMap.get('1') || '0';
                  const n2 = pinMap.get('2') || '0';
                  let reading = 0;
                  
                  if (comp.params.mode === 'ac_voltage' || comp.params.mode === 'ac_current') {
                     reading = acMultimeterReadings[comp.id] || 0;
                  } else {
                    if (nodeVoltages && Object.keys(nodeVoltages).length > 0) {
                      if (comp.params.mode === 'current') {
                        const expectedBranchName = `i(vmm_${comp.id.replace(/-/g, '')})`;
                        const branchKey = Object.keys(nodeVoltages).find(k => k.toLowerCase() === expectedBranchName.toLowerCase());
                        reading = branchKey ? nodeVoltages[branchKey] : 0;
                      } else {
                        const v1 = n1 === '0' ? 0 : (nodeVoltages[`v(${n1})`] || 0);
                        const v2 = n2 === '0' ? 0 : (nodeVoltages[`v(${n2})`] || 0);
                        reading = v1 - v2;
                      }
                    }
                  }

                  const abs = Math.abs(reading);
                  let formatted = '0.00 V';
                  const isCurrent = comp.params.mode === 'current' || comp.params.mode === 'ac_current';
                  
                  if (isCurrent) {
                     if (abs === 0) formatted = '0.00 A';
                     else if (abs >= 1) formatted = `${parseFloat(reading.toFixed(3))} A`;
                     else if (abs >= 1e-3) formatted = `${parseFloat((reading * 1e3).toFixed(3))} mA`;
                     else if (abs >= 1e-6) formatted = `${parseFloat((reading * 1e6).toFixed(3))} µA`;
                     else formatted = `${reading.toExponential(2)} A`;
                  } else if (comp.params.mode === 'resistance') {
                     const resistance = abs / 0.001; 
                     if (resistance >= 1e9) formatted = 'O.L (Open)';
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
              
              if (pinMap && nodeVoltages && Object.keys(nodeVoltages).length > 0) {
                 if (comp.type === 'resistor') {
                    const n1 = pinMap.get('1') || '0';
                    const n2 = pinMap.get('2') || '0';
                    const v1 = n1 === '0' ? 0 : (nodeVoltages[`v(${n1})`] || 0);
                    const v2 = n2 === '0' ? 0 : (nodeVoltages[`v(${n2})`] || 0);
                    let rStr = String(comp.params?.resistance || '1000');
                    let r = parseFloat(rStr);
                    const rLower = rStr.toLowerCase();
                    if (rLower.includes('k')) r *= 1e3;
                    else if (rLower.includes('meg')) r *= 1e6;
                    else if (rLower.includes('m')) r *= 1e-3;
                    if (r > 0) {
                      powers[comp.id] = Math.pow(v1 - v2, 2) / r;
                    }
                 } else if (comp.type === 'led') {
                    const n1 = pinMap.get('1') || '0';
                    const n2 = pinMap.get('2') || '0';
                    const v1 = n1 === '0' ? 0 : (nodeVoltages[`v(${n1})`] || 0);
                    const v2 = n2 === '0' ? 0 : (nodeVoltages[`v(${n2})`] || 0);
                    const vDrop = v1 - v2;
                    if (vDrop > 3.2) {
                       powers[comp.id] = 100;
                    } else if (vDrop > 1.4) {
                       const intensity = Math.min(1, Math.max(0, (vDrop - 1.4) / 0.8));
                       activeLedStates[comp.id] = { isOn: true, intensity };
                    }
                 } else if (comp.type === 'diode' || comp.type === 'zener') {
                    const n1 = pinMap.get('1') || '0';
                    const n2 = pinMap.get('2') || '0';
                    const v1 = n1 === '0' ? 0 : (nodeVoltages[`v(${n1})`] || 0);
                    const v2 = n2 === '0' ? 0 : (nodeVoltages[`v(${n2})`] || 0);
                    const vDrop = v1 - v2;
                    let maxDrop = 1.2;
                    if (vDrop > maxDrop) {
                       powers[comp.id] = 100;
                    } else if (vDrop > 0.6) {
                       powers[comp.id] = 0.02 * vDrop;
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
                  listening={!isSpacePressed && !isPanning}
                  multimeterReading={readings[comp.id]}
                  powerDissipation={powers[comp.id]}
                  isLedLit={activeLedStates[comp.id]?.isOn}
                  ledIntensity={activeLedStates[comp.id]?.intensity}
                  onSelect={(e) => {
                    if (mode === 'probe') {
                      const pins = resolvedCircuit.components.get(comp.id);
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
                      const pinSnap = getMagneticSnap(pos, 9);
                      if (!pinSnap) {
                        if (!e.evt.shiftKey && !selectedIds.includes(comp.id)) {
                          setSelection([comp.id]);
                        } else if (e.evt.shiftKey) {
                          setSelection([...selectedIds, comp.id]);
                        }
                      }
                    }
                  }}
                  onDblClick={() => {
                    if (comp.type === 'switch' || comp.type === 'pushbutton') {
                      return;
                    }
                    setEditingComponent(comp.id);
                  }}
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
              stroke={theme === 'dark' ? '#EEEAE4' : '#30383E'}
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
              listening={false}
            />
          )}
          
          {/* Pin Indicators (Only visible in Wire Mode for snapping) */}
          {mode === 'wire' && visibleComponents.flatMap(comp => {
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
                    <Group key={`${comp.id}-${pin.id}`} x={renderPos.x + rotatedOffsetX} y={renderPos.y + rotatedOffsetY}>
                      <Circle
                        radius={3.5}
                        fill="white"
                        stroke="#e74c3c"
                        strokeWidth={1.5}
                        listening={false}
                      />
                    </Group>
                  );
                })}
              </React.Fragment>
            );
          })}

        {/* Render node voltages if available */}
        {activeView === 'schematic' && (activeAnalysis === 'op' || activeAnalysis === 'interactive') && nodeVoltages && Object.keys(nodeVoltages).length > 0 && selectedIds.length === 0 && (
          Array.from(nodeCoords.entries()).map(([nodeName, coord]) => {
            if (!coord || isNaN(coord.x) || isNaN(coord.y)) return null;
            const vStr = `v(${nodeName})`;
            const vVal = nodeVoltages[vStr];
            if (vVal === undefined) return null;

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
                scaleX={textScale}
                scaleY={textScale}
              >
                <Tag 
                  fill={theme === 'dark' ? '#323A3F' : '#E2DCD3'} 
                  stroke={theme === 'dark' ? '#367985' : '#367985'} 
                  strokeWidth={1} 
                  cornerRadius={3}
                  pointerDirection={coord.dir}
                  pointerWidth={8}
                  pointerHeight={8}
                />
                <Text
                  text={formatted}
                  fontSize={9}
                  padding={4}
                  fill={theme === 'dark' ? '#367985' : '#367985'}
                  fontStyle="bold"
                />
              </Label>
            );
          })
        )}
        
        {/* Render SPICE Error Box if applicable */}
        {simError && (
          (() => {
            const match = simError.match(/node\s+([A-Za-z0-9_]+)/i);
            if (!match) return null;
            const errorNodeName = match[1];
            
            const { components, wires } = resolvedCircuit;
            
            let coord: { x: number, y: number, dir: string } | null = null;
            
            // Search wires first
            for (const wire of visibleWires) {
              const nodeName = wires.get(wire.id);
              if (nodeName && nodeName.toLowerCase() === errorNodeName.toLowerCase() && wire.points.length > 0) {
                const pt = wire.points[Math.floor(wire.points.length / 2)];
                coord = { x: pt.x, y: pt.y, dir: 'up' };
                break;
              }
            }
            
            // Search components if not found on wires
            if (!coord) {
              for (const comp of visibleComponents) {
                const compPinMap = components.get(comp.id);
                if (compPinMap) {
                  const libComp = ComponentLibrary[comp.type];
                  if (libComp) {
                    for (const pin of libComp.pins) {
                      const nodeName = compPinMap.get(pin.id);
                      if (nodeName && nodeName.toLowerCase() === errorNodeName.toLowerCase()) {
                        const rotRad = (comp.rotation || 0) * Math.PI / 180;
                        const cos = Math.round(Math.cos(rotRad));
                        const sin = Math.round(Math.sin(rotRad));
                        const rx = (comp.mirrored ? -pin.offset.x : pin.offset.x) * cos - pin.offset.y * sin;
                        const ry = (comp.mirrored ? -pin.offset.x : pin.offset.x) * sin + pin.offset.y * cos;
                        coord = { x: comp.position.x + rx, y: comp.position.y + ry, dir: 'up' };
                        break;
                      }
                    }
                  }
                }
                if (coord) break;
              }
            }
            
            if (!coord) return null;
            
            let reason = 'Floating / Singular Matrix';
            if (simError.toLowerCase().includes('unknown parameter')) reason = 'Unknown Parameter';
            
            return (
              <Label
                x={coord.x}
                y={coord.y}
                listening={false}
                scaleX={textScale}
                scaleY={textScale}
              >
                <Tag 
                  fill="#e74c3c"
                  cornerRadius={4}
                  pointerDirection={coord.dir}
                  pointerWidth={10}
                  pointerHeight={10}
                  shadowColor="rgba(0,0,0,0.3)"
                  shadowBlur={5}
                />
                <Text
                  text={`Error at Node ${errorNodeName}\n${reason}`}
                  fontSize={10}
                  padding={6}
                  fill="white"
                  fontStyle="bold"
                  align="center"
                />
              </Label>
            );
          })()
        )}

          {/* Render visual probes */}
          {visibleProbes.map(probe => {
            const probeId = `probe-${probe.nodeId}`;
            const isSelected = selectedIds.includes(probeId) || selectedIds.includes(probe.nodeId);
            return (
              <ProbeKonvaNode 
                key={probeId} 
                probe={probe} 
                theme={theme}
                isSelected={isSelected}
                mode={mode}
                listening={!isSpacePressed && !isPanning}
                onSelect={(e) => {
                  if (mode === 'probe') {
                    removeProbe(probe.nodeId);
                  } else if (mode === 'select') {
                    if (!e.evt.shiftKey && !selectedIds.includes(probeId)) {
                      setSelection([probeId]);
                    } else if (e.evt.shiftKey) {
                      if (selectedIds.includes(probeId)) {
                        setSelection(selectedIds.filter(id => id !== probeId && id !== probe.nodeId));
                      } else {
                        setSelection([...selectedIds, probeId]);
                      }
                    }
                  }
                }}
                onRemove={() => {
                  removeProbe(probe.nodeId);
                  if (selectedIds.includes(probeId) || selectedIds.includes(probe.nodeId)) {
                    setSelection(selectedIds.filter(id => id !== probeId && id !== probe.nodeId));
                  }
                }}
              />
            );
          })}
        
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
               return (
                 <Circle
                   x={mousePos.x}
                   y={mousePos.y}
                   radius={Math.max(4, 6 / (scale || 1))}
                   stroke="#B9924D"
                   strokeWidth={Math.max(1, 2 / (scale || 1))}
                   fill="transparent"
                   listening={false}
                 />
               );
             }
             return null;
          })()}

          {/* Preview dot for DRAGGING existing wire points */}
          {previewSnapPos && (
             <Circle
               x={previewSnapPos.x}
               y={previewSnapPos.y}
               radius={Math.max(4, 6 / (scale || 1))}
               stroke="#B9924D"
               strokeWidth={Math.max(1, 2 / (scale || 1))}
               fill="transparent"
               listening={false}
             />
          )}

          {/* Marquee Selection Rectangle */}
          {selectionBox && (
            <Rect
              x={Math.min(selectionBox.start.x, selectionBox.current.x)}
              y={Math.min(selectionBox.start.y, selectionBox.current.y)}
              width={Math.abs(selectionBox.current.x - selectionBox.start.x)}
              height={Math.abs(selectionBox.current.y - selectionBox.start.y)}
              fill="rgba(52, 152, 219, 0.15)"
              stroke="#3498db"
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
              listening={false}
            />
          )}
</Layer>
      </Stage>
    </div>
  );
};
