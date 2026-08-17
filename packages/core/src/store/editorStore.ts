import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
import { Circuit, ComponentInstance, Wire, Point, Probe } from '../models/circuit';
import { ComponentLibrary } from '../engine/library';
import { v4 as uuidv4 } from 'uuid';

interface EditorState {
  circuit: Circuit;
  selectedIds: string[];
  editingComponentId: string | null;
  mode: 'select' | 'wire' | 'place' | 'probe';
  componentToPlace: string | null;
  stagePos: Point;
  scale: number;
  probes: Probe[];
  activeAnalysis: 'op' | 'tran' | 'ac' | 'dc';
  theme: 'light' | 'dark';
  activeView: 'schematic' | 'breadboard';
  
  // Breadboard Option A Placement State
  placingBreadboardComponentId: string | null;
  placedLegs: Record<string, string>; // pinId -> holeId
  
  // Actions
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
  toggleProbe: (nodeId: string, x: number, y: number) => void;
  setActiveAnalysis: (kind: 'op' | 'tran' | 'ac' | 'dc') => void;
  updateAnalysis: (kind: 'op' | 'tran' | 'ac' | 'dc', params: Record<string, string>) => void;
  setCustomModels: (models: string) => void;
  addProbe: (probe: Probe) => void;
  clearAll: () => void;
  toggleTheme: () => void;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    persist(
      (set) => ({
        circuit: {
          id: uuidv4(),
          name: 'Untitled',
          components: [],
          wires: [],
          analyses: [{ kind: 'op', params: {} }],
          breadboard: { layout: 'half', placements: [], jumperWires: [] }
        },
        selectedIds: [],
        editingComponentId: null,
        mode: 'select',
        componentToPlace: null,
        stagePos: { x: 0, y: 0 },
        scale: 1,
        probes: [],
        activeAnalysis: 'op',
        theme: 'light',
        activeView: 'schematic',
        placingBreadboardComponentId: null,
        placedLegs: {},

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
          const newComp: ComponentInstance = {
            id: uuidv4(),
            type,
            position,
            rotation: 0,
            mirrored: false,
            params
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

          const oldPinAbsPos: {x: number, y: number}[] = [];
            const libComp = ComponentLibrary[comp.type];
            if (libComp) {
              const rotRad = (comp.rotation || 0) * Math.PI / 180;
              const cos = Math.round(Math.cos(rotRad));
              const sin = Math.round(Math.sin(rotRad));
              for (const pin of libComp.pins) {
                const rx = pin.offset.x * cos - pin.offset.y * sin;
                const ry = pin.offset.x * sin + pin.offset.y * cos;
                oldPinAbsPos.push({ x: comp.position.x + rx, y: comp.position.y + ry });
              }
            }

            const components = state.circuit.components.map(c => 
              (c.id === id || state.selectedIds.includes(c.id)) ? { ...c, position: { x: c.position.x + dx, y: c.position.y + dy } } : c
            );

            const wires = state.circuit.wires.map(w => {
              let changed = false;
              const newPoints = w.points.map(p => {
                let matched = false;
                for (const oldAbs of oldPinAbsPos) {
                  if (Math.abs(p.x - oldAbs.x) < 1 && Math.abs(p.y - oldAbs.y) < 1) {
                    matched = true;
                    break;
                  }
                }
                if (matched) {
                  changed = true;
                  return { x: p.x + dx, y: p.y + dy };
                }
                return p;
              });
              return changed ? { ...w, points: newPoints } : w;
            });

            return { circuit: { ...state.circuit, components, wires } };
        }),

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
                  const oldX = c.position.x + (pin.offset.x * cosOld - pin.offset.y * sinOld);
                  const oldY = c.position.y + (pin.offset.x * sinOld + pin.offset.y * cosOld);
                  const newX = c.position.x + (pin.offset.x * cosNew - pin.offset.y * sinNew);
                  const newY = c.position.y + (pin.offset.x * sinNew + pin.offset.y * cosNew);

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
              
              const libComp = ComponentLibrary[c.type];
              if (libComp) {
                const rotRad = (c.rotation || 0) * Math.PI / 180;
                const cos = Math.round(Math.cos(rotRad));
                const sin = Math.round(Math.sin(rotRad));
                
                for (const pin of libComp.pins) {
                  const oldMirroredOffsetX = c.mirrored ? -pin.offset.x : pin.offset.x;
                  const newMirroredOffsetX = nextMirrored ? -pin.offset.x : pin.offset.x;
                  
                  const oldX = c.position.x + (oldMirroredOffsetX * cos - pin.offset.y * sin);
                  const oldY = c.position.y + (oldMirroredOffsetX * sin + pin.offset.y * cos);
                  const newX = c.position.x + (newMirroredOffsetX * cos - pin.offset.y * sin);
                  const newY = c.position.y + (newMirroredOffsetX * sin + pin.offset.y * cos);

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

              return { ...c, mirrored: nextMirrored };
            }
            return c;
          });
          return { circuit: { ...state.circuit, components, wires } };
        }),

        deleteSelected: () => set((state) => {
          const components = state.circuit.components.filter(c => !state.selectedIds.includes(c.id));
          const wires = state.circuit.wires.filter(w => !state.selectedIds.includes(w.id));
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
            analyses: [{ kind: 'op', params: {} }],
            breadboard: { layout: 'half', placements: [], jumperWires: [] }
          },
          selectedIds: [],
          editingComponentId: null,
          probes: []
        }),

        toggleTheme: () => set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }))
      }),
      {
        name: 'livespice-circuit-storage',
        partialize: (state) => ({ 
          circuit: state.circuit,
          stagePos: state.stagePos,
          scale: state.scale,
          theme: state.theme
        }),
      }
    ),
    {
      partialize: (state) => ({
        circuit: state.circuit
      }),
    }
  )
);
