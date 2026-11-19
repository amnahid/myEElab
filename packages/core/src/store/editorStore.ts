import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Circuit, ComponentInstance, Wire, Point, Probe, ComponentDefinition, CircuitClipboardPayload, AnalysisConfig } from '../models/circuit';
import { ComponentLibrary } from '../engine/library';
import { generateNextRefDes, reindexRefDes, ensureCircuitRefDes, isUnindexedRefDes, getComponentPrefix } from '../engine/refDes';
import { v4 as uuidv4 } from 'uuid';

export { generateNextRefDes, reindexRefDes, ensureCircuitRefDes, isUnindexedRefDes, getComponentPrefix };

export function getComponentPinCoords(comp: ComponentInstance, customDefs?: Record<string, ComponentDefinition>): Set<string> {
  const pinCoords = new Set<string>();
  const libComp = comp.customDefinition || customDefs?.[comp.type] || ComponentLibrary[comp.type];
  if (!libComp) return pinCoords;
  const rotRad = (comp.rotation || 0) * Math.PI / 180;
  const cos = Math.round(Math.cos(rotRad));
  const sin = Math.round(Math.sin(rotRad));
  for (const pin of libComp.pins) {
    const mirroredOffsetX = comp.mirrored ? -pin.offset.x : pin.offset.x;
    const mirroredOffsetY = pin.offset.y;
    const rx = mirroredOffsetX * cos - mirroredOffsetY * sin;
    const ry = mirroredOffsetX * sin + mirroredOffsetY * cos;
    const px = Math.round(comp.position.x + rx);
    const py = Math.round(comp.position.y + ry);
    pinCoords.add(`${px},${py}`);
  }
  return pinCoords;
}

function performPaste(
  state: EditorState,
  payload: CircuitClipboardPayload,
  cursorPos?: Point
): Partial<EditorState> {
  const componentsToPaste = payload?.components || [];
  const wiresToPaste = payload?.wires || [];

  if (componentsToPaste.length === 0 && wiresToPaste.length === 0) {
    return {};
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of componentsToPaste) {
    if (c.position.x < minX) minX = c.position.x;
    if (c.position.x > maxX) maxX = c.position.x;
    if (c.position.y < minY) minY = c.position.y;
    if (c.position.y > maxY) maxY = c.position.y;
  }
  if (componentsToPaste.length === 0) {
    for (const w of wiresToPaste) {
      for (const p of w.points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
  }

  const snap20 = (v: number) => Math.round(v / 20) * 20;
  const centerX = minX !== Infinity ? (minX + maxX) / 2 : 0;
  const centerY = minY !== Infinity ? (minY + maxY) / 2 : 0;

  let dx = 20;
  let dy = 20;

  if (cursorPos) {
    const targetX = snap20(cursorPos.x);
    const targetY = snap20(cursorPos.y);
    dx = snap20(targetX - centerX);
    dy = snap20(targetY - centerY);
    if (dx === 0 && dy === 0) {
      dx = 20;
      dy = 20;
    }
  }

  const usedRefDesInBatch = new Set<string>();
  const newComponents: ComponentInstance[] = componentsToPaste.map(c => {
    const newId = uuidv4();
    const newRefDes = reindexRefDes(c.refDes, c.type, state.circuit.components, usedRefDesInBatch, c.customDefinition || state.circuit.customComponents?.[c.type]);
    return {
      ...c,
      id: newId,
      position: {
        x: c.position.x + dx,
        y: c.position.y + dy
      },
      refDes: newRefDes,
      params: { ...c.params }
    };
  });

  const newWires: Wire[] = wiresToPaste.map(w => ({
    id: uuidv4(),
    points: w.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
    ...(w.color ? { color: w.color } : {})
  }));

  const mergedCustomComponents = {
    ...(state.circuit.customComponents || {}),
    ...(payload.customComponents || {})
  };

  const newCircuit: Circuit = {
    ...state.circuit,
    components: [...state.circuit.components, ...newComponents],
    wires: [...state.circuit.wires, ...newWires],
    customComponents: mergedCustomComponents
  };

  const newSelectedIds = [
    ...newComponents.map(c => c.id),
    ...newWires.map(w => w.id)
  ];

  return {
    circuit: newCircuit,
    selectedIds: newSelectedIds,
    editingComponentId: null
  };
}

function applyTranslation(
  circuit: Circuit,
  movingCompIds: Set<string>,
  explicitlyMovingWireIds: Set<string>,
  dx: number,
  dy: number
): { components: ComponentInstance[]; wires: Wire[] } {
  if (dx === 0 && dy === 0) {
    return { components: circuit.components, wires: circuit.wires };
  }

  const movingPinCoords = new Set<string>();
  const allPins: { x: number; y: number }[] = [];

  for (const c of circuit.components) {
    const isMoving = movingCompIds.has(c.id);
    const pinCoords = getComponentPinCoords(c, circuit.customComponents);
    for (const pt of pinCoords) {
      const [px, py] = pt.split(',').map(Number);
      allPins.push({ x: px, y: py });
      if (isMoving) {
        movingPinCoords.add(pt);
      }
    }
  }

  const newComponents = circuit.components.map(c =>
    movingCompIds.has(c.id)
      ? { ...c, position: { x: c.position.x + dx, y: c.position.y + dy } }
      : c
  );

  const newWires = circuit.wires.map(w => ({ ...w, points: w.points.map(p => ({ ...p })) }));

  // Identify internal vs external wires
  const isWireInternal = (w: Wire): boolean => {
    if (explicitlyMovingWireIds.has(w.id)) return true;
    if (w.points.length >= 2 && movingCompIds.size > 0) {
      const pStart = `${Math.round(w.points[0].x)},${Math.round(w.points[0].y)}`;
      const pEnd = `${Math.round(w.points[w.points.length - 1].x)},${Math.round(w.points[w.points.length - 1].y)}`;
      return movingPinCoords.has(pStart) && movingPinCoords.has(pEnd);
    }
    return false;
  };

  // Find T-junctions before moving
  const tJunctions: { cw: number; cp: number; pw: number; ps: number; t: number }[] = [];
  for (let cw = 0; cw < newWires.length; cw++) {
    for (let cp = 0; cp < newWires[cw].points.length; cp++) {
      const J = newWires[cw].points[cp];
      let isPin = false;
      for (const pin of allPins) {
        if (Math.abs(J.x - pin.x) < 1 && Math.abs(J.y - pin.y) < 1) {
          isPin = true;
          break;
        }
      }
      if (isPin) continue;

      for (let pw = 0; pw < newWires.length; pw++) {
        for (let ps = 0; ps < newWires[pw].points.length - 1; ps++) {
          if (cw === pw && (cp === ps || cp === ps + 1)) continue;
          const A = newWires[pw].points[ps];
          const B = newWires[pw].points[ps + 1];
          const l2 = Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2);
          if (l2 === 0) continue;
          const t = ((J.x - A.x) * (B.x - A.x) + (J.y - A.y) * (B.y - A.y)) / l2;
          if (t > 0.001 && t < 0.999) {
            const projX = A.x + t * (B.x - A.x);
            const projY = A.y + t * (B.y - A.y);
            if (Math.hypot(J.x - projX, J.y - projY) < 1) {
              tJunctions.push({ cw, cp, pw, ps, t });
              break;
            }
          }
        }
      }
    }
  }

  // Translate wires
  for (let cw = 0; cw < newWires.length; cw++) {
    const w = newWires[cw];
    if (isWireInternal(w)) {
      // Entire wire moves rigidly with the group
      for (let cp = 0; cp < w.points.length; cp++) {
        w.points[cp].x += dx;
        w.points[cp].y += dy;
      }
    } else {
      // External wire: only points touching moving pins move
      for (let cp = 0; cp < w.points.length; cp++) {
        const p = w.points[cp];
        const key = `${Math.round(p.x)},${Math.round(p.y)}`;
        if (movingPinCoords.has(key)) {
          p.x += dx;
          p.y += dy;
        }
      }
    }
  }

  // Re-project dependent T-junctions
  for (let iter = 0; iter < 5; iter++) {
    for (const junc of tJunctions) {
      const A = newWires[junc.pw].points[junc.ps];
      const B = newWires[junc.pw].points[junc.ps + 1];
      const J = newWires[junc.cw].points[junc.cp];
      J.x = Math.round((A.x + junc.t * (B.x - A.x)) * 100) / 100;
      J.y = Math.round((A.y + junc.t * (B.y - A.y)) * 100) / 100;
    }
  }

  return { components: newComponents, wires: newWires };
}

interface EditorState {
  circuit: Circuit;
  selectedIds: string[];
  editingComponentId: string | null;
  mode: 'select' | 'wire' | 'place' | 'probe';
  componentToPlace: string | null;
  stagePos: Point;
  scale: number;
  probes: Probe[];
  activeAnalysis: 'interactive' | 'op' | 'tran' | 'ac' | 'dc';
  theme: 'light' | 'dark';
  activeView: 'schematic' | 'breadboard';
  autoSimulate: boolean;
  showInstruments: boolean;
  
  // Clipboard
  clipboard: CircuitClipboardPayload | null;

  // Breadboard Option A Placement State
  placingBreadboardComponentId: string | null;
  placedLegs: Record<string, string>; // pinId -> holeId
  
  // Actions
  copySelected: () => void;
  cutSelected: () => void;
  paste: (cursorPos?: Point) => Promise<void> | void;
  duplicateSelected: () => void;
  selectAll: () => void;
  moveSelected: (delta: Point) => void;
  addCustomComponent: (def: ComponentDefinition) => void;
  setAutoSimulate: (auto: boolean) => void;
  setShowInstruments: (show: boolean) => void;
  setActiveView: (view: 'schematic' | 'breadboard') => void;
  startBreadboardPlacement: (componentId: string) => void;
  addPlacedLeg: (pinId: string, holeId: string) => void;
  cancelBreadboardPlacement: () => void;
  placeOnBreadboard: (componentId: string, legHoles: Record<string, string>) => void;
  removeBreadboardPlacement: (componentId: string) => void;
  addJumperWire: (startHole: string, endHole: string, color: string, points: Point[]) => void;
  addComponent: (type: string, position: Point) => void;
  updateComponentPosition: (id: string, position: Point) => void;
  updateComponentParams: (id: string, params: any) => void;
  rotateSelected: () => void;
  mirrorSelected: () => void;
  deleteSelected: () => void;
  setSelection: (ids: string[]) => void;
  setEditingComponent: (id: string | null) => void;
  setMode: (mode: 'select' | 'wire' | 'place' | 'probe', type?: string) => void;
  setStageView: (pos: Point, scale: number) => void;
  addWire: (points: Point[]) => void;
  updateWirePoint: (wireId: string, pointIndex: number, pos: Point) => void;
  updateWirePoints: (wireId: string, points: Point[]) => void;
  updateWireColor: (wireId: string, color: string) => void;
  toggleProbe: (nodeId: string, x: number, y: number) => void;
  removeProbe: (nodeId: string) => void;
  clearProbes: () => void;
  setActiveAnalysis: (kind: 'interactive' | 'op' | 'tran' | 'ac' | 'dc') => void;
  updateAnalysis: (kind: 'interactive' | 'op' | 'tran' | 'ac' | 'dc', params: Record<string, string>) => void;
  setCustomModels: (models: string) => void;
  addProbe: (probe: Probe) => void;
  clearAll: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    persist(
      (set, get) => ({
        circuit: {
          id: uuidv4(),
          name: 'Untitled',
          components: [],
          wires: [],
          analyses: [
            { kind: 'tran', params: { step: '100u', stop: '10m' } },
            { kind: 'ac', params: { variation: 'dec', points: '10', fstart: '1', fstop: '1Meg' } },
            { kind: 'op', params: {} }
          ] as AnalysisConfig[],
          breadboard: { layout: 'half', placements: [], jumperWires: [] }
        },
        selectedIds: [],
        editingComponentId: null,
        mode: 'select',
        componentToPlace: null,
        stagePos: { x: 0, y: 0 },
        scale: 1,
        probes: [],
        activeAnalysis: 'interactive',
        theme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        activeView: 'schematic',
        autoSimulate: true,
        showInstruments: true,
        clipboard: null,
        placingBreadboardComponentId: null,
        placedLegs: {},

        copySelected: () => {
          const state = get();
          const selectedComps = state.circuit.components.filter(c => state.selectedIds.includes(c.id));
          const explicitlySelectedWires = state.circuit.wires.filter(w => state.selectedIds.includes(w.id));

          if (selectedComps.length === 0 && explicitlySelectedWires.length === 0) return;

          const allSelectedPinCoords = new Set<string>();
          for (const c of selectedComps) {
            const coords = getComponentPinCoords(c, state.circuit.customComponents);
            coords.forEach(pt => allSelectedPinCoords.add(pt));
          }

          const internalWires = state.circuit.wires.filter(w => {
            if (state.selectedIds.includes(w.id)) return false;
            if (w.points.length >= 2) {
              const pStart = `${Math.round(w.points[0].x)},${Math.round(w.points[0].y)}`;
              const pEnd = `${Math.round(w.points[w.points.length - 1].x)},${Math.round(w.points[w.points.length - 1].y)}`;
              return allSelectedPinCoords.has(pStart) && allSelectedPinCoords.has(pEnd);
            }
            return false;
          });

          const allWiresToCopy = [...explicitlySelectedWires, ...internalWires];

          const payload: CircuitClipboardPayload = {
            source: 'myEElab',
            version: 1,
            components: JSON.parse(JSON.stringify(selectedComps)),
            wires: JSON.parse(JSON.stringify(allWiresToCopy)),
            customComponents: state.circuit.customComponents ? JSON.parse(JSON.stringify(state.circuit.customComponents)) : undefined
          };

          set({ clipboard: payload });

          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
          }
        },

        cutSelected: () => {
          get().copySelected();
          get().deleteSelected();
        },

        paste: async (cursorPos?: Point) => {
          const state = get();
          let payload = state.clipboard;

          if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
            try {
              const text = await navigator.clipboard.readText();
              if (text && text.trim().startsWith('{')) {
                const parsed = JSON.parse(text);
                if (parsed?.source === 'myEElab' && Array.isArray(parsed?.components)) {
                  payload = parsed;
                }
              }
            } catch {
              // Permission denied or unavailable - fallback to in-memory payload
            }
          }

          if (!payload) return;

          const updates = performPaste(get(), payload, cursorPos);
          if (updates.circuit) {
            set(updates);
          }
        },

        duplicateSelected: () => {
          const state = get();
          const selectedComps = state.circuit.components.filter(c => state.selectedIds.includes(c.id));
          const explicitlySelectedWires = state.circuit.wires.filter(w => state.selectedIds.includes(w.id));

          if (selectedComps.length === 0 && explicitlySelectedWires.length === 0) return;

          const allSelectedPinCoords = new Set<string>();
          for (const c of selectedComps) {
            const coords = getComponentPinCoords(c, state.circuit.customComponents);
            coords.forEach(pt => allSelectedPinCoords.add(pt));
          }

          const internalWires = state.circuit.wires.filter(w => {
            if (state.selectedIds.includes(w.id)) return false;
            if (w.points.length >= 2) {
              const pStart = `${Math.round(w.points[0].x)},${Math.round(w.points[0].y)}`;
              const pEnd = `${Math.round(w.points[w.points.length - 1].x)},${Math.round(w.points[w.points.length - 1].y)}`;
              return allSelectedPinCoords.has(pStart) && allSelectedPinCoords.has(pEnd);
            }
            return false;
          });

          const allWiresToCopy = [...explicitlySelectedWires, ...internalWires];

          const payload: CircuitClipboardPayload = {
            source: 'myEElab',
            version: 1,
            components: JSON.parse(JSON.stringify(selectedComps)),
            wires: JSON.parse(JSON.stringify(allWiresToCopy)),
            customComponents: state.circuit.customComponents
          };

          const updates = performPaste(get(), payload, undefined);
          if (updates.circuit) {
            set(updates);
          }
        },

        setAutoSimulate: (auto) => set({ autoSimulate: auto }),
        setShowInstruments: (show) => set({ showInstruments: show }),
        setActiveView: (view) => set({ activeView: view }),

        startBreadboardPlacement: (componentId) => set({
          placingBreadboardComponentId: componentId,
          placedLegs: {}
        }),

        addPlacedLeg: (pinId, holeId) => set((state) => ({
          placedLegs: { ...state.placedLegs, [pinId]: holeId }
        })),

        cancelBreadboardPlacement: () => set({
          placingBreadboardComponentId: null,
          placedLegs: {}
        }),

        placeOnBreadboard: (componentId, legHoles) => set((state) => {
          const breadboard = state.circuit.breadboard || { layout: 'half', placements: [], jumperWires: [] };
          const placements = breadboard.placements.filter(p => p.componentId !== componentId);
          placements.push({ componentId, legHoles });
          return { 
            circuit: { ...state.circuit, breadboard: { ...breadboard, placements } },
            placingBreadboardComponentId: null,
            placedLegs: {}
          };
        }),

        removeBreadboardPlacement: (componentId) => set((state) => {
          if (!state.circuit.breadboard) return state;
          const placements = state.circuit.breadboard.placements.filter(p => p.componentId !== componentId);
          return { circuit: { ...state.circuit, breadboard: { ...state.circuit.breadboard, placements } } };
        }),

        addJumperWire: (startHole, endHole, color, points) => set((state) => {
          const breadboard = state.circuit.breadboard || { layout: 'half', placements: [], jumperWires: [] };
          const newJumper = { id: uuidv4(), startHole, endHole, color, points };
          return { circuit: { ...state.circuit, breadboard: { ...breadboard, jumperWires: [...breadboard.jumperWires, newJumper] } } };
        }),

        addComponent: (type, position) => set((state) => {
          const params: Record<string, any> = { ...(ComponentLibrary[type]?.defaultParams || {}) };
          const refDes = generateNextRefDes(type, state.circuit.components, undefined, state.circuit.customComponents?.[type]);
          const newComp: ComponentInstance = {
            id: uuidv4(),
            type,
            position,
            rotation: 0,
            mirrored: false,
            params,
            ...(refDes ? { refDes } : {})
          };
          const base = {
            circuit: { ...state.circuit, components: [...state.circuit.components, newComp] },
            mode: 'select' as const,
            componentToPlace: null,
            selectedIds: [newComp.id]
          };
          // In breadboard mode, auto-start placement
          if (state.activeView === 'breadboard' && type !== 'ground') {
            return {
              ...base,
              placingBreadboardComponentId: newComp.id,
              placedLegs: {}
            };
          }
          return base;
        }),

        updateComponentPosition: (id, position) => set((state) => {
          const comp = state.circuit.components.find(c => c.id === id);
          if (!comp) return state;

          const dx = position.x - comp.position.x;
          const dy = position.y - comp.position.y;
          if (dx === 0 && dy === 0) return state;

          const movingCompIds = new Set(state.selectedIds);
          movingCompIds.add(id);

          const explicitlyMovingWireIds = new Set(
            state.selectedIds.filter(sid => state.circuit.wires.some(w => w.id === sid))
          );

          const { components, wires } = applyTranslation(state.circuit, movingCompIds, explicitlyMovingWireIds, dx, dy);
          return { circuit: { ...state.circuit, components, wires } };
        }),

        moveSelected: (delta) => set((state) => {
          if (state.selectedIds.length === 0 || (delta.x === 0 && delta.y === 0)) return state;

          const movingCompIds = new Set(
            state.circuit.components.filter(c => state.selectedIds.includes(c.id)).map(c => c.id)
          );
          const explicitlyMovingWireIds = new Set(
            state.circuit.wires.filter(w => state.selectedIds.includes(w.id)).map(w => w.id)
          );

          const { components, wires } = applyTranslation(state.circuit, movingCompIds, explicitlyMovingWireIds, delta.x, delta.y);
          return { circuit: { ...state.circuit, components, wires } };
        }),

        selectAll: () => set((state) => ({
          selectedIds: [
            ...state.circuit.components.map(c => c.id),
            ...state.circuit.wires.map(w => w.id)
          ]
        })),

        updateComponentParams: (id, params) => set((state) => {
          const components = state.circuit.components.map(c => {
            if (c.id === id) {
              const { refDes, color, ...restParams } = params;
              return {
                ...c,
                ...(refDes !== undefined && { refDes }),
                ...(color !== undefined && { color }),
                params: { ...c.params, ...restParams }
              };
            }
            return c;
          });
          return { circuit: { ...state.circuit, components } };
        }),

        updateWireColor: (wireId, color) => set((state) => {
          const wires = state.circuit.wires.map(w => 
            w.id === wireId ? { ...w, color } : w
          );
          return { circuit: { ...state.circuit, wires } };
        }),

        rotateSelected: () => set((state) => {
          let wires = [...state.circuit.wires];
          const components = state.circuit.components.map(c => {
            if (state.selectedIds.includes(c.id)) {
              const nextRot = (c.rotation + 90) % 360 as 0 | 90 | 180 | 270;
              const libComp = ComponentLibrary[c.type];
              if (libComp) {
                const rotRadOld = (c.rotation || 0) * Math.PI / 180;
                const cosOld = Math.round(Math.cos(rotRadOld));
                const sinOld = Math.round(Math.sin(rotRadOld));
                
                const rotRadNew = nextRot * Math.PI / 180;
                const cosNew = Math.round(Math.cos(rotRadNew));
                const sinNew = Math.round(Math.sin(rotRadNew));

                for (const pin of libComp.pins) {
                  const mirroredOffsetX = c.mirrored ? -pin.offset.x : pin.offset.x;
                  const oldX = c.position.x + (mirroredOffsetX * cosOld - pin.offset.y * sinOld);
                  const oldY = c.position.y + (mirroredOffsetX * sinOld + pin.offset.y * cosOld);
                  const newX = c.position.x + (mirroredOffsetX * cosNew - pin.offset.y * sinNew);
                  const newY = c.position.y + (mirroredOffsetX * sinNew + pin.offset.y * cosNew);

                  wires = wires.map(w => {
                    let changed = false;
                    const newPoints = w.points.map(p => {
                      if (p.x === oldX && p.y === oldY) {
                        changed = true;
                        return { x: newX, y: newY };
                      }
                      return p;
                    });
                    return changed ? { ...w, points: newPoints } : w;
                  });
                }
              }
              return { ...c, rotation: nextRot };
            }
            return c;
          });
          return { circuit: { ...state.circuit, components, wires } };
        }),

        mirrorSelected: () => set((state) => {
          let wires = [...state.circuit.wires];
          const components = state.circuit.components.map(c => {
            if (state.selectedIds.includes(c.id)) {
              const nextMirrored = !c.mirrored;
              return { ...c, mirrored: nextMirrored };
            }
            return c;
          });
          return { circuit: { ...state.circuit, components, wires } };
        }),

        deleteSelected: () => set((state) => {
          const components = state.circuit.components.filter(c => !state.selectedIds.includes(c.id));
          const wires = state.circuit.wires.filter(w => !state.selectedIds.includes(w.id));
          const probes = state.probes.filter(p => !state.selectedIds.includes(`probe-${p.nodeId}`) && !state.selectedIds.includes(p.nodeId));

          const breadboard = state.circuit.breadboard;
          let newBreadboard = breadboard;
          if (breadboard) {
             const placements = breadboard.placements.filter(p => !state.selectedIds.includes(p.componentId));
             const jumperWires = breadboard.jumperWires.filter(w => !state.selectedIds.includes(w.id));
             newBreadboard = { ...breadboard, placements, jumperWires };
          }
          const newEditingId = state.editingComponentId && state.selectedIds.includes(state.editingComponentId) ? null : state.editingComponentId;
          return {
            circuit: { ...state.circuit, components, wires, breadboard: newBreadboard },
            probes,
            selectedIds: [],
            editingComponentId: newEditingId
          };
        }),

        setSelection: (ids) => set((state) => {
          const newEditingId = (state.editingComponentId && ids.includes(state.editingComponentId)) 
            ? state.editingComponentId 
            : null;
          return { selectedIds: ids, editingComponentId: newEditingId };
        }),

        setEditingComponent: (id) => set({ editingComponentId: id }),
        
        setMode: (mode, type) => set({ mode, componentToPlace: type || null }),

        setStageView: (pos, scale) => set({ stagePos: pos, scale }),
        
        addWire: (points) => set((state) => {
          const newWire: Wire = {
            id: uuidv4(),
            points
          };
          return {
            circuit: { ...state.circuit, wires: [...state.circuit.wires, newWire] }
          };
        }),

        updateWirePoint: (wireId, pointIndex, pos) => set((state) => {
          const wires = state.circuit.wires.map(w => {
            if (w.id === wireId) {
              const newPoints = [...w.points];
              newPoints[pointIndex] = pos;
              return { ...w, points: newPoints };
            }
            return w;
          });
          return { circuit: { ...state.circuit, wires } };
        }),

        updateWirePoints: (wireId, points) => set((state) => {
          const wires = state.circuit.wires.map(w => {
            if (w.id === wireId) {
              return { ...w, points };
            }
            return w;
          });
          return { circuit: { ...state.circuit, wires } };
        }),

        toggleProbe: (nodeId, x, y) => set((state) => {
          const exists = state.probes.find(p => p.nodeId === nodeId);
          if (exists) {
            return { probes: state.probes.filter(p => p.nodeId !== nodeId) };
          } else {
            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#34495e'];
            const usedColors = new Set(state.probes.map(p => p.color));
            let color = colors.find(c => !usedColors.has(c));
            if (!color) {
              color = colors[state.probes.length % colors.length];
            }
            return { probes: [...state.probes, { nodeId, color, x, y }] };
          }
        }),

        removeProbe: (nodeId) => set((state) => ({
          probes: state.probes.filter(p => p.nodeId !== nodeId)
        })),

        clearProbes: () => set({
          probes: []
        }),

        updateAnalysis: (kind, params) => set((state) => {
          const analyses = [...state.circuit.analyses];
          const index = analyses.findIndex(a => a.kind === kind);
          if (index >= 0) {
            analyses[index] = { ...analyses[index], params: { ...analyses[index].params, ...params } };
          } else {
            analyses.push({ kind, params });
          }
          return { circuit: { ...state.circuit, analyses } };
        }),

        setActiveAnalysis: (kind) => set({ activeAnalysis: kind }),

        setCustomModels: (models: string) => set((state) => ({
          circuit: { ...state.circuit, customModels: models }
        })),

        addProbe: (probe) => set((state) => ({
          probes: [...state.probes, probe]
        })),

        clearAll: () => set({
          circuit: {
            id: uuidv4(),
            name: 'Untitled',
            components: [],
            wires: [],
            analyses: [
              { kind: 'tran', params: { step: '100u', stop: '10m' } },
              { kind: 'ac', params: { variation: 'dec', points: '10', fstart: '1', fstop: '1Meg' } },
              { kind: 'op', params: {} }
            ],
            breadboard: { layout: 'half', placements: [], jumperWires: [] }
          },
          selectedIds: [],
          editingComponentId: null,
          probes: []
        }),

        addCustomComponent: (def: ComponentDefinition) => {
          ComponentLibrary[def.type] = def;
          set((state) => ({
            circuit: {
              ...state.circuit,
              customComponents: {
                ...(state.circuit.customComponents || {}),
                [def.type]: def
              }
            }
          }));
        },

        setTheme: (theme) => set({ theme })
      }),
      {
        name: 'livespice-circuit-storage',
        partialize: (state) => ({ 
          circuit: state.circuit,
          stagePos: state.stagePos,
          scale: state.scale,
          activeView: state.activeView,
          autoSimulate: state.autoSimulate,
          activeAnalysis: state.activeAnalysis,
          probes: state.probes,
          showInstruments: state.showInstruments
        }),
        onRehydrateStorage: () => (state) => {
          if (state?.circuit) {
            if (ensureCircuitRefDes(state.circuit)) {
              state.circuit = { ...state.circuit, components: [...state.circuit.components] };
            }
          }
        }
      }
    ),
    {
      partialize: (state) => ({
        circuit: state.circuit
      }),
    }
  )
);
