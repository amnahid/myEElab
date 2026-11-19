import { describe, it, expect } from "vitest";
import { Circuit } from "../src/models/circuit";
import { NetlistGenerator } from "../src/engine/netlist";
import { Simulation } from "eecircuit-engine";

describe("Interactive Mode Simulation", () => {
  it("should generate unified netlist with .tran and multi-mode AC/DC sources", () => {
    const circuit: Circuit = {
      id: "interactive-test-1",
      name: "Interactive RC Lowpass",
      components: [
        {
          id: "v1",
          type: "vsource",
          position: { x: 0, y: 0 },
          rotation: 0,
          mirrored: false,
          params: { type: "sin", offset: "2.5", amplitude: "1", frequency: "1k" }
        },
        {
          id: "r1",
          type: "resistor",
          position: { x: 0, y: 0 },
          rotation: 0,
          mirrored: false,
          params: { resistance: "1k" }
        },
        {
          id: "c1",
          type: "capacitor",
          position: { x: 0, y: 40 },
          rotation: 0,
          mirrored: false,
          params: { capacitance: "1u" }
        },
        {
          id: "gnd",
          type: "ground",
          position: { x: 0, y: 80 },
          rotation: 0,
          mirrored: false,
          params: {}
        }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] },  // v1+ to r1_1
        { id: "w2", points: [{ x: 0, y: 40 }] }, // r1_2 to c1_1
        { id: "w3", points: [{ x: 0, y: 80 }] }, // c1_2 to gnd
      ],
      analyses: [
        { kind: "tran", params: { step: "10u", stop: "2m" } },
        { kind: "ac", params: { variation: "dec", points: "10", fstart: "10", fstop: "100k" } }
      ]
    };

    const generator = new NetlistGenerator();
    const tranNetlist = generator.generate(circuit, "interactive");
    const acNetlist = generator.generate(circuit, "ac");

    // Check that source has DC, AC, and SINE combined for unified simulation
    expect(tranNetlist).toContain("DC 2.5 AC 1 0 SINE(2.5 1 1k 0 0 0)");
    expect(tranNetlist).toContain(".tran 10u 2m");

    expect(acNetlist).toContain(".ac dec 10 10 100k");
  });

  it("should simulate transient and provide both waveforms and DC operating voltages", async () => {
    const circuit: Circuit = {
      id: "interactive-test-2",
      name: "Voltage Divider with Settling",
      components: [
        {
          id: "v1",
          type: "vsource",
          position: { x: 0, y: 0 },
          rotation: 0,
          mirrored: false,
          params: { type: "dc", value: 10 }
        },
        {
          id: "r1",
          type: "resistor",
          position: { x: 0, y: 0 },
          rotation: 0,
          mirrored: false,
          params: { resistance: "1k" }
        },
        {
          id: "r2",
          type: "resistor",
          position: { x: 0, y: 40 },
          rotation: 0,
          mirrored: false,
          params: { resistance: "1k" }
        },
        {
          id: "gnd",
          type: "ground",
          position: { x: 0, y: 80 },
          rotation: 0,
          mirrored: false,
          params: {}
        }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] },
        { id: "w2", points: [{ x: 0, y: 40 }] },
        { id: "w3", points: [{ x: 0, y: 80 }] }
      ],
      analyses: [
        { kind: "tran", params: { step: "100u", stop: "10m" } }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "interactive");

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();

    expect(results).toBeDefined();
    expect(results.numPoints).toBeGreaterThan(1);

    // Extract settled operating point from transient vectors (unified approach)
    const voltages: Record<string, number> = {};
    results.data.forEach((d: any) => {
      const isVoltage = (d.name.startsWith("v(") && !d.name.includes("#branch")) || d.type === "voltage";
      if (isVoltage && d.values.length > 0) {
        voltages[d.name] = d.values[d.values.length - 1];
      }
    });

    const node4Voltage = voltages["v(4)"];
    expect(node4Voltage).toBeCloseTo(10.0, 1);
  });
});
