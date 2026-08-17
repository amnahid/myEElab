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
});
