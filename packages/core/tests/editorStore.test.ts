import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "../src/store/editorStore";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.getState().clearAll();
  });

  it("should add a wire via addWire", () => {
    const store = useEditorStore.getState();
    expect(store.circuit.wires.length).toBe(0);

    store.addWire([{ x: 0, y: 0 }, { x: 10, y: 10 }]);

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.circuit.wires.length).toBe(1);
    expect(stateAfter.circuit.wires[0].points).toEqual([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
  });

  it("should rotate a component and shift attached wires", () => {
    const store = useEditorStore.getState();
    
    // Add a component
    store.addComponent("resistor", { x: 0, y: 0 });
    const cId = useEditorStore.getState().circuit.components[0].id;

    // Resistor pin 1 is at (0, -20) when rotation is 0.
    // Let's add a wire starting exactly at that pin.
    store.addWire([{ x: 0, y: -20 }, { x: 50, y: 50 }]);
    const wId = useEditorStore.getState().circuit.wires[0].id;

    // Select the component and rotate it
    useEditorStore.getState().setSelection([cId]);
    useEditorStore.getState().rotateSelected();

    const stateAfter = useEditorStore.getState();
    const rotatedComp = stateAfter.circuit.components.find(c => c.id === cId);
    const shiftedWire = stateAfter.circuit.wires.find(w => w.id === wId);

    expect(rotatedComp?.rotation).toBe(90);

    // After 90 degree rotation, (0, -20) becomes (20, 0)
    // The wire's first point should now be at (20, 0)!
    expect(shiftedWire?.points[0]).toEqual({ x: 20, y: 0 });
    // The second point should remain unchanged
    expect(shiftedWire?.points[1]).toEqual({ x: 50, y: 50 });
  });

  it("should mirror a component and shift attached wires", () => {
    const store = useEditorStore.getState();
    
    store.addComponent("resistor", { x: 0, y: 0 });
    const cId = useEditorStore.getState().circuit.components[0].id;

    // A resistor has pins at (0, -20) and (0, 20).
    // Mirroring a resistor doesn't change its pin offsets since X is 0.
    // So let's rotate it first to 90 degrees so its pins are on the X axis.
    useEditorStore.getState().setSelection([cId]);
    useEditorStore.getState().rotateSelected();
    
    // Now pins are at (20, 0) and (-20, 0)
    store.addWire([{ x: 20, y: 0 }, { x: 50, y: 50 }]);
    const wId = useEditorStore.getState().circuit.wires[0].id;

    // Now mirror it!
    useEditorStore.getState().mirrorSelected();

    const stateAfter = useEditorStore.getState();
    const mirroredComp = stateAfter.circuit.components.find(c => c.id === cId);
    const shiftedWire = stateAfter.circuit.wires.find(w => w.id === wId);

    expect(mirroredComp?.mirrored).toBe(true);

    // The wire that was at (20, 0) stays at (20, 0) because mirroring across Y axis 
    // does not move points that are on the Y axis (pin X offset is 0).
    expect(shiftedWire?.points[0]).toEqual({ x: 20, y: 0 });
  });

  it("should support zundo undo actions", () => {
    const store = useEditorStore.getState();
    
    // Add component
    store.addComponent("resistor", { x: 0, y: 0 });
    const cId = useEditorStore.getState().circuit.components[0].id;
    
    // Force a small delay or snapshot if needed (Zundo usually captures state changes automatically depending on config)
    // Let's change the position
    useEditorStore.getState().updateComponentPosition(cId, { x: 100, y: 100 });
    
    expect(useEditorStore.getState().circuit.components[0].position).toEqual({ x: 100, y: 100 });

    // Perform undo
    useEditorStore.temporal.getState().undo();

    // Verify position reverted
    expect(useEditorStore.getState().circuit.components[0].position).toEqual({ x: 0, y: 0 });
  });

  it("should copy and paste a single component with offset and unique ID", async () => {
    const store = useEditorStore.getState();
    store.addComponent("resistor", { x: 40, y: 40 });
    const originalComp = useEditorStore.getState().circuit.components[0];
    
    // Select the component
    useEditorStore.getState().setSelection([originalComp.id]);
    useEditorStore.getState().copySelected();

    expect(useEditorStore.getState().clipboard).not.toBeNull();
    expect(useEditorStore.getState().clipboard?.components.length).toBe(1);

    // Paste without cursorPos -> should offset by (+20, +20)
    await useEditorStore.getState().paste();

    const comps = useEditorStore.getState().circuit.components;
    expect(comps.length).toBe(2);
    const pastedComp = comps[1];
    expect(pastedComp.id).not.toBe(originalComp.id);
    expect(pastedComp.type).toBe("resistor");
    expect(pastedComp.position).toEqual({ x: 60, y: 60 });
    expect(useEditorStore.getState().selectedIds).toEqual([pastedComp.id]);
  });

  it("should re-index refDes upon paste to avoid collisions", async () => {
    const store = useEditorStore.getState();
    store.addComponent("resistor", { x: 0, y: 0 });
    const comp1 = useEditorStore.getState().circuit.components[0];
    useEditorStore.getState().updateComponentParams(comp1.id, { refDes: "R1" });

    useEditorStore.getState().setSelection([comp1.id]);
    useEditorStore.getState().copySelected();

    await useEditorStore.getState().paste();

    const comps = useEditorStore.getState().circuit.components;
    expect(comps.length).toBe(2);
    expect(comps[0].refDes).toBe("R1");
    expect(comps[1].refDes).toBe("R2");
  });

  it("should copy a subcircuit with interconnecting wires and preserve their relative geometry", async () => {
    const store = useEditorStore.getState();
    
    // R1 at (0, 0), pins at (0, -20) and (0, 20)
    store.addComponent("resistor", { x: 0, y: 0 });
    // R2 at (0, 80), pins at (0, 60) and (0, 100)
    store.addComponent("resistor", { x: 0, y: 80 });
    
    const r1 = useEditorStore.getState().circuit.components[0];
    const r2 = useEditorStore.getState().circuit.components[1];
    
    // Wire connecting R1 pin 2 (0, 20) to R2 pin 1 (0, 60)
    store.addWire([{ x: 0, y: 20 }, { x: 0, y: 60 }]);
    const originalWire = useEditorStore.getState().circuit.wires[0];

    // Select both resistors (internal wire will be automatically included in the copy)
    useEditorStore.getState().setSelection([r1.id, r2.id]);
    useEditorStore.getState().copySelected();

    expect(useEditorStore.getState().clipboard?.components.length).toBe(2);
    expect(useEditorStore.getState().clipboard?.wires.length).toBe(1);

    // Paste with target cursorPos at (100, 100)
    await useEditorStore.getState().paste({ x: 100, y: 100 });

    const comps = useEditorStore.getState().circuit.components;
    const wires = useEditorStore.getState().circuit.wires;

    expect(comps.length).toBe(4);
    expect(wires.length).toBe(2);

    const pastedWire = wires[1];
    expect(pastedWire.id).not.toBe(originalWire.id);
    // Original center of R1 (0, 0) and R2 (0, 80) is (0, 40).
    // Target is (100, 100). dx = 100, dy = 60.
    // Wire points were (0, 20) and (0, 60).
    // Pasted wire points should be (100, 80) and (100, 120).
    expect(pastedWire.points).toEqual([{ x: 100, y: 80 }, { x: 100, y: 120 }]);
  });

  it("should cut components (copies to clipboard and deletes from circuit)", () => {
    const store = useEditorStore.getState();
    store.addComponent("capacitor", { x: 20, y: 20 });
    const cId = useEditorStore.getState().circuit.components[0].id;

    useEditorStore.getState().setSelection([cId]);
    useEditorStore.getState().cutSelected();

    expect(useEditorStore.getState().circuit.components.length).toBe(0);
    expect(useEditorStore.getState().clipboard?.components.length).toBe(1);
    expect(useEditorStore.getState().clipboard?.components[0].type).toBe("capacitor");
  });

  it("should duplicate selected components via duplicateSelected", () => {
    const store = useEditorStore.getState();
    store.addComponent("inductor", { x: 50, y: 50 });
    const comp = useEditorStore.getState().circuit.components[0];

    useEditorStore.getState().setSelection([comp.id]);
    useEditorStore.getState().duplicateSelected();

    const comps = useEditorStore.getState().circuit.components;
    expect(comps.length).toBe(2);
    expect(comps[1].type).toBe("inductor");
    expect(comps[1].position).toEqual({ x: 70, y: 70 });
  });

  it("should atomically undo and redo a paste operation", async () => {
    const store = useEditorStore.getState();
    store.addComponent("resistor", { x: 0, y: 0 });
    const comp = useEditorStore.getState().circuit.components[0];

    useEditorStore.getState().setSelection([comp.id]);
    useEditorStore.getState().copySelected();

    await useEditorStore.getState().paste();
    expect(useEditorStore.getState().circuit.components.length).toBe(2);

    // Undo paste
    useEditorStore.temporal.getState().undo();
    expect(useEditorStore.getState().circuit.components.length).toBe(1);

    // Redo paste
    useEditorStore.temporal.getState().redo();
    expect(useEditorStore.getState().circuit.components.length).toBe(2);
  });

  it("should select all components and wires via selectAll", () => {
    const store = useEditorStore.getState();
    store.addComponent("resistor", { x: 0, y: 0 });
    store.addComponent("capacitor", { x: 50, y: 50 });
    store.addWire([{ x: 0, y: 0 }, { x: 50, y: 50 }]);

    // Deselect initially
    useEditorStore.getState().setSelection([]);
    expect(useEditorStore.getState().selectedIds.length).toBe(0);

    useEditorStore.getState().selectAll();

    const state = useEditorStore.getState();
    expect(state.selectedIds.length).toBe(3);
    expect(state.selectedIds).toContain(state.circuit.components[0].id);
    expect(state.selectedIds).toContain(state.circuit.components[1].id);
    expect(state.selectedIds).toContain(state.circuit.wires[0].id);
  });

  it("should move multiple selected components together via moveSelected", () => {
    const store = useEditorStore.getState();
    store.addComponent("resistor", { x: 20, y: 20 });
    store.addComponent("capacitor", { x: 60, y: 80 });

    const c1 = useEditorStore.getState().circuit.components[0];
    const c2 = useEditorStore.getState().circuit.components[1];

    useEditorStore.getState().setSelection([c1.id, c2.id]);
    useEditorStore.getState().moveSelected({ x: 30, y: -10 });

    const comps = useEditorStore.getState().circuit.components;
    expect(comps[0].position).toEqual({ x: 50, y: 10 });
    expect(comps[1].position).toEqual({ x: 90, y: 70 });
  });

  it("should translate all points of an internal wire rigidly without distortion when moving a group", () => {
    const store = useEditorStore.getState();
    // Resistor 1 at (0, 0), pin 2 at (0, 20)
    store.addComponent("resistor", { x: 0, y: 0 });
    // Resistor 2 at (80, 80), pin 1 at (80, 60)
    store.addComponent("resistor", { x: 80, y: 80 });

    const c1 = useEditorStore.getState().circuit.components[0];
    const c2 = useEditorStore.getState().circuit.components[1];

    // Orthogonal wire with a 90-degree corner at (80, 20)
    store.addWire([{ x: 0, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 60 }]);
    const wireId = useEditorStore.getState().circuit.wires[0].id;

    // Select both components
    useEditorStore.getState().setSelection([c1.id, c2.id]);
    // Move the group by (+40, +30)
    useEditorStore.getState().moveSelected({ x: 40, y: 30 });

    const state = useEditorStore.getState();
    expect(state.circuit.components[0].position).toEqual({ x: 40, y: 30 });
    expect(state.circuit.components[1].position).toEqual({ x: 120, y: 110 });

    // The wire is internal because both endpoints connect to c1 and c2.
    // ALL 3 points including the corner must translate rigidly!
    const movedWire = state.circuit.wires.find(w => w.id === wireId);
    expect(movedWire?.points).toEqual([
      { x: 40, y: 50 },
      { x: 120, y: 50 },
      { x: 120, y: 90 }
    ]);
  });

  it("should stretch external wires connected to moving components while unselected endpoints remain fixed", () => {
    const store = useEditorStore.getState();
    // Resistor 1 at (0, 0), pin 2 at (0, 20)
    store.addComponent("resistor", { x: 0, y: 0 });
    // Ground at (0, 100), pin 1 at (0, 90) (or origin)
    store.addComponent("ground", { x: 0, y: 100 });

    const c1 = useEditorStore.getState().circuit.components[0];
    const c2 = useEditorStore.getState().circuit.components[1];

    // Wire from Resistor pin (0, 20) to Ground pin (0, 90)
    store.addWire([{ x: 0, y: 20 }, { x: 0, y: 90 }]);
    const wireId = useEditorStore.getState().circuit.wires[0].id;

    // Select ONLY Resistor 1 (Ground is unselected)
    useEditorStore.getState().setSelection([c1.id]);
    useEditorStore.getState().moveSelected({ x: 50, y: 0 });

    const state = useEditorStore.getState();
    expect(state.circuit.components[0].position).toEqual({ x: 50, y: 0 });
    expect(state.circuit.components[1].position).toEqual({ x: 0, y: 100 });

    const stretchedWire = state.circuit.wires.find(w => w.id === wireId);
    // Connected endpoint moves from (0, 20) to (50, 20)
    expect(stretchedWire?.points[0]).toEqual({ x: 50, y: 20 });
    // Unconnected endpoint stays at (0, 90)
    expect(stretchedWire?.points[1]).toEqual({ x: 0, y: 90 });
  });

  it("should atomically undo and redo group movement", () => {
    const store = useEditorStore.getState();
    store.addComponent("resistor", { x: 10, y: 10 });
    store.addComponent("resistor", { x: 50, y: 50 });

    const c1 = useEditorStore.getState().circuit.components[0];
    const c2 = useEditorStore.getState().circuit.components[1];

    useEditorStore.getState().setSelection([c1.id, c2.id]);
    useEditorStore.getState().moveSelected({ x: 20, y: 20 });

    expect(useEditorStore.getState().circuit.components[0].position).toEqual({ x: 30, y: 30 });
    expect(useEditorStore.getState().circuit.components[1].position).toEqual({ x: 70, y: 70 });

    // Undo move
    useEditorStore.temporal.getState().undo();
    expect(useEditorStore.getState().circuit.components[0].position).toEqual({ x: 10, y: 10 });
    expect(useEditorStore.getState().circuit.components[1].position).toEqual({ x: 50, y: 50 });

    // Redo move
    useEditorStore.temporal.getState().redo();
    expect(useEditorStore.getState().circuit.components[0].position).toEqual({ x: 30, y: 30 });
    expect(useEditorStore.getState().circuit.components[1].position).toEqual({ x: 70, y: 70 });
  });

  it("should enter place mode and place an SPST switch or pushbutton properly", () => {
    const store = useEditorStore.getState();

    // 1. SPST Switch placement flow
    store.setMode("place", "switch");
    expect(useEditorStore.getState().mode).toBe("place");
    expect(useEditorStore.getState().componentToPlace).toBe("switch");

    useEditorStore.getState().addComponent("switch", { x: 40, y: 60 });
    expect(useEditorStore.getState().mode).toBe("select");
    expect(useEditorStore.getState().componentToPlace).toBeNull();
    expect(useEditorStore.getState().circuit.components.length).toBe(1);

    const sw = useEditorStore.getState().circuit.components[0];
    expect(sw.type).toBe("switch");
    expect(sw.position).toEqual({ x: 40, y: 60 });
    expect(sw.params.state).toBe("open");

    // 2. Pushbutton placement flow
    store.setMode("place", "pushbutton");
    expect(useEditorStore.getState().mode).toBe("place");
    expect(useEditorStore.getState().componentToPlace).toBe("pushbutton");

    useEditorStore.getState().addComponent("pushbutton", { x: 120, y: 80 });
    expect(useEditorStore.getState().mode).toBe("select");
    expect(useEditorStore.getState().componentToPlace).toBeNull();
    expect(useEditorStore.getState().circuit.components.length).toBe(2);

    const pb = useEditorStore.getState().circuit.components[1];
    expect(pb.type).toBe("pushbutton");
    expect(pb.position).toEqual({ x: 120, y: 80 });
    expect(pb.params.state).toBe("open");
  });

  it("should update stage view position and scale via setStageView for panning", () => {
    const store = useEditorStore.getState();
    expect(store.stagePos).toEqual({ x: 0, y: 0 });
    expect(store.scale).toBe(1);

    store.setStageView({ x: 150, y: -75 }, 1.25);
    const updated = useEditorStore.getState();
    expect(updated.stagePos).toEqual({ x: 150, y: -75 });
    expect(updated.scale).toBe(1.25);
  });

  it("should preserve connected wires when a component is deleted", () => {
    const store = useEditorStore.getState();

    // 1. Add a resistor at (100, 100)
    store.addComponent("resistor", { x: 100, y: 100 });
    const resistor = useEditorStore.getState().circuit.components[0];
    expect(resistor).toBeDefined();

    // Pin 1 is at (100, 80), Pin 2 is at (100, 120)
    // Add wire 1 attached to pin 1
    store.addWire([
      { x: 100, y: 80 },
      { x: 200, y: 80 }
    ]);
    // Add wire 2 attached to pin 2
    store.addWire([
      { x: 100, y: 120 },
      { x: 100, y: 200 }
    ]);

    expect(useEditorStore.getState().circuit.wires.length).toBe(2);

    // 2. Select ONLY the resistor and delete it
    store.setSelection([resistor.id]);
    store.deleteSelected();

    const stateAfter = useEditorStore.getState();
    // Component is deleted
    expect(stateAfter.circuit.components.length).toBe(0);

    // Wires MUST NOT disappear: both wires remain intact!
    expect(stateAfter.circuit.wires.length).toBe(2);
    expect(stateAfter.circuit.wires[0].points).toEqual([
      { x: 100, y: 80 },
      { x: 200, y: 80 }
    ]);
    expect(stateAfter.circuit.wires[1].points).toEqual([
      { x: 100, y: 120 },
      { x: 100, y: 200 }
    ]);
  });

  it("should delete explicitly selected wires via deleteSelected", () => {
    const store = useEditorStore.getState();
    store.addWire([
      { x: 0, y: 0 },
      { x: 50, y: 50 }
    ]);
    const wireId = useEditorStore.getState().circuit.wires[0].id;

    store.setSelection([wireId]);
    store.deleteSelected();

    expect(useEditorStore.getState().circuit.wires.length).toBe(0);
  });

  it("should delete both component and wire when both are selected together", () => {
    const store = useEditorStore.getState();
    store.addComponent("capacitor", { x: 50, y: 50 });
    store.addWire([
      { x: 50, y: 70 },
      { x: 50, y: 120 }
    ]);
    const compId = useEditorStore.getState().circuit.components[0].id;
    const wireId = useEditorStore.getState().circuit.wires[0].id;

    store.setSelection([compId, wireId]);
    store.deleteSelected();

    expect(useEditorStore.getState().circuit.components.length).toBe(0);
    expect(useEditorStore.getState().circuit.wires.length).toBe(0);
  });

  it("should assign sequential indexed refDes when adding components", () => {
    const store = useEditorStore.getState();
    store.addComponent("resistor", { x: 0, y: 0 });
    store.addComponent("resistor", { x: 50, y: 0 });
    store.addComponent("capacitor", { x: 100, y: 0 });
    store.addComponent("led", { x: 150, y: 0 });
    store.addComponent("74hc164", { x: 200, y: 0 });
    store.addComponent("ground", { x: 250, y: 0 });

    const comps = useEditorStore.getState().circuit.components;
    expect(comps[0].refDes).toBe("R1");
    expect(comps[1].refDes).toBe("R2");
    expect(comps[2].refDes).toBe("C1");
    expect(comps[3].refDes).toBe("LED1");
    expect(comps[4].refDes).toBe("U1");
    expect(comps[5].refDes).toBeUndefined(); // ground has no refDes
  });

  describe("probe management", () => {
    it("should toggle, remove, and clear probes", () => {
      const store = useEditorStore.getState();
      store.clearProbes();
      expect(useEditorStore.getState().probes.length).toBe(0);

      // Add two probes via toggleProbe
      store.toggleProbe("10", 100, 200);
      store.toggleProbe("21", 150, 250);
      expect(useEditorStore.getState().probes.length).toBe(2);
      expect(useEditorStore.getState().probes[0].nodeId).toBe("10");
      expect(useEditorStore.getState().probes[1].nodeId).toBe("21");

      // Toggle existing probe -> removes it
      store.toggleProbe("10", 100, 200);
      expect(useEditorStore.getState().probes.length).toBe(1);
      expect(useEditorStore.getState().probes[0].nodeId).toBe("21");

      // Add another probe
      store.toggleProbe("20", 120, 220);
      expect(useEditorStore.getState().probes.length).toBe(2);

      // Explicitly remove probe via removeProbe
      store.removeProbe("21");
      expect(useEditorStore.getState().probes.length).toBe(1);
      expect(useEditorStore.getState().probes[0].nodeId).toBe("20");

      // Clear all probes
      store.clearProbes();
      expect(useEditorStore.getState().probes.length).toBe(0);
    });

    it("should remove selected probes via deleteSelected", () => {
      const store = useEditorStore.getState();
      store.clearProbes();
      store.toggleProbe("10", 100, 200);
      store.toggleProbe("21", 150, 250);
      expect(useEditorStore.getState().probes.length).toBe(2);

      // Select probe-10
      store.setSelection(["probe-10"]);
      store.deleteSelected();

      expect(useEditorStore.getState().probes.length).toBe(1);
      expect(useEditorStore.getState().probes[0].nodeId).toBe("21");

      // Select probe with direct nodeId "21"
      store.setSelection(["21"]);
      store.deleteSelected();
      expect(useEditorStore.getState().probes.length).toBe(0);
    });
  });
});
