import { describe, it, expect } from "vitest";
import { Circuit } from "../src/models/circuit";
import { NodeResolver } from "../src/engine/nodeResolver";
import { NetlistGenerator } from "../src/engine/netlist";
import { Simulation } from "eecircuit-engine";

describe("Node Resolver and Netlist Generator", () => {
  it("should correctly resolve nodes and simulate a Voltage Divider", async () => {
    const circuit: Circuit = {
      id: "test1",
      name: "Voltage Divider",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 10 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "r2", type: "resistor", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 80 }, rotation: 0, mirrored: false, params: {} }
      ],
      // We wire v1(+) to r1(p1). 
      // v1(-) to gnd(gnd)
      // r1(p2) to r2(p1)
      // r2(p2) to gnd(gnd)
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }, { x: 0, y: 0 }] },     // v1+ to r1_1
        { id: "w2", points: [{ x: 0, y: 40 }, { x: 0, y: 40 }] },   // v1- to r2_1? wait, v1- is at y=40, r1_p2 is at y=40. So they connect.
        { id: "w3", points: [{ x: 0, y: 80 }, { x: 0, y: 80 }] },   // r2_p2 to gnd
      ],
      analyses: [
        { kind: "op", params: {} }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);

    // console.log("Voltage Divider Netlist:\n", netlist);
    
    // Test the output lines roughly
    expect(netlist).toContain("V1");
    expect(netlist).toContain("R1");
    expect(netlist).toContain("R2");
    expect(netlist).toContain(".op");
    
    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    
    expect(results).toBeDefined();
    expect(results.numVariables).toBeGreaterThan(0);
  });

  it("should simulate an RC Filter transient", async () => {
    const circuit: Circuit = {
      id: "test2",
      name: "RC Filter",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 5 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "c1", type: "capacitor", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: { capacitance: "1u" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 80 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] }, // v1+ (y=0) and r1_1 (y=0)
        { id: "w2", points: [{ x: 0, y: 40 }] }, // v1- (y=40), r1_2 (y=40), c1_1 (y=40)
        { id: "w3", points: [{ x: 0, y: 80 }] }, // c1_2 (y=80), gnd (y=80)
      ],
      analyses: [
        { kind: "tran", params: { step: "0.1m", stop: "5m" } }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "tran");
    console.log("RC FILTER NETLIST:", netlist);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    
    expect(results).toBeDefined();
    expect(results.data.length).toBeGreaterThan(0);
  });

  it("should simulate an RLC circuit", async () => {
    const circuit: Circuit = {
      id: "test3",
      name: "RLC",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 5 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "10" } },
        { id: "l1", type: "inductor", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: { inductance: "1m" } },
        { id: "c1", type: "capacitor", position: { x: 0, y: 80 }, rotation: 0, mirrored: false, params: { capacitance: "1u" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 120 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] }, 
        { id: "w2", points: [{ x: 0, y: 40 }] },
        { id: "w3", points: [{ x: 0, y: 80 }] },
        { id: "w4", points: [{ x: 0, y: 120 }] },
      ],
      analyses: [
        { kind: "tran", params: { step: "10u", stop: "1m" } }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "tran");

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    expect(results).toBeDefined();
  });

  it("should test current source", async () => {
    const circuit: Circuit = {
      id: "test4",
      name: "ISOURCE",
      components: [
        { id: "i1", type: "isource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 1 } },
        { id: "r1", type: "resistor", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "5" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 0 }] }, 
        { id: "w2", points: [{ x: 0, y: 40 }] },
      ],
      analyses: [
        { kind: "op", params: {} }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    expect(results).toBeDefined();
  });

  it("should fail gracefully or parse correctly on disconnected nets", async () => {
    const circuit: Circuit = {
      id: "test5",
      name: "Disconnected",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 1 } },
        { id: "gnd", type: "ground", position: { x: 0, y: 40 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w1", points: [{ x: 0, y: 40 }] }, // Only connects negative terminal to ground
      ],
      analyses: [
        { kind: "op", params: {} }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);
    expect(netlist).toContain("V1");
    // Doesn't strictly need to run through ngspice successfully if ngspice throws "singular matrix", we just test if the bridge can take it.
    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    try {
      await sim.runSim();
    } catch (e) {
      // ngspice might throw error on disconnected nets
      expect(e).toBeDefined();
    }
  });

  it("should simulate a subcircuit component (LM7805 regulator)", async () => {
    const circuit: Circuit = {
      id: "test-7805",
      name: "7805 Regulator Test",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 12 } },
        { id: "u1", type: "lm7805", position: { x: 100, y: 0 }, rotation: 0, mirrored: false, params: {} },
        { id: "r1", type: "resistor", position: { x: 200, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "100" } },
        { id: "gnd", type: "ground", position: { x: 100, y: 100 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w_in", points: [{ x: 0, y: -20 }, { x: 70, y: -10 }] },
        { id: "w_out", points: [{ x: 130, y: -10 }, { x: 200, y: -20 }] },
        { id: "w_gnd1", points: [{ x: 0, y: 20 }, { x: 100, y: 20 }] },
        { id: "w_gnd2", points: [{ x: 100, y: 20 }, { x: 200, y: 20 }] },
        { id: "w_gnd3", points: [{ x: 100, y: 20 }, { x: 100, y: 80 }] },
      ],
      analyses: [{ kind: "op", params: {} }]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit);

    expect(netlist).toContain(".subckt LM7805");
    expect(netlist).toMatch(/X\w* \d+ 0 \d+ LM7805/);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();

    expect(results).toBeDefined();
    const outVar = results.data.find(v => v.values.some(val => Math.abs(val - 5.0) < 0.1));
    expect(outVar).toBeDefined();
  });

  it("should generate correct SPICE PULSE for clock component and simulate transient response", async () => {
    const circuit: Circuit = {
      id: "test-clock",
      name: "Clock Source Test",
      components: [
        { id: "clk1", type: "clock", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { frequency: "1k", vhigh: "5", vlow: "0", duty: "50" } },
        { id: "r1", type: "resistor", position: { x: 100, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 100 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        { id: "w_sig", points: [{ x: 0, y: -20 }, { x: 100, y: -20 }] },
        { id: "w_gnd1", points: [{ x: 0, y: 20 }, { x: 100, y: 20 }] },
        { id: "w_gnd2", points: [{ x: 0, y: 20 }, { x: 0, y: 80 }] }
      ],
      analyses: [
        { kind: "tran", params: { step: "10u", stop: "2m" } }
      ]
    };

    const generator = new NetlistGenerator();
    const netlist = generator.generate(circuit, "tran");

    expect(netlist).toContain(".tran 10u 2m");
    expect(netlist).toMatch(/V1 \d+ 0 PULSE\(0 5 0 1n 1n \S+ 1\.0000e-3\)/);

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();

    expect(results).toBeDefined();
    expect(results.data.length).toBeGreaterThan(0);
    const vSig = results.data.find(d => d.name !== "time" && d.values.some(v => v > 4.5) && d.values.some(v => v < 0.5));
    expect(vSig).toBeDefined();
  });

  it("should generate correct netlist and simulate switch in open vs closed states", async () => {
    // Circuit with 5V DC source, switch, and 1k load resistor to ground
    const buildSwitchCircuit = (state: "open" | "closed"): Circuit => ({
      id: `test-switch-${state}`,
      name: `Switch Test (${state})`,
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 5 } },
        { id: "sw1", type: "switch", position: { x: 50, y: 0 }, rotation: 0, mirrored: false, params: { state } },
        { id: "r1", type: "resistor", position: { x: 100, y: 0 }, rotation: 0, mirrored: false, params: { resistance: "1k" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 100 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [
        // v1 (+) to sw1 pin 1 (-20, 0)
        { id: "w1", points: [{ x: 0, y: -20 }, { x: 30, y: 0 }] },
        // sw1 pin 2 (70, 0) to r1 pin 1 (100, -20)
        { id: "w2", points: [{ x: 70, y: 0 }, { x: 100, y: -20 }] },
        // v1 (-), r1 pin 2, gnd
        { id: "w_gnd1", points: [{ x: 0, y: 20 }, { x: 100, y: 20 }] },
        { id: "w_gnd2", points: [{ x: 0, y: 20 }, { x: 0, y: 100 }] },
      ],
      analyses: [{ kind: "op", params: {} }]
    });

    const generator = new NetlistGenerator();

    // 1. OPEN STATE
    const openCircuit = buildSwitchCircuit("open");
    const openNetlist = generator.generate(openCircuit);
    expect(openNetlist).toContain("R_SW1");
    expect(openNetlist).toContain("1G");

    const simOpen = new Simulation();
    await simOpen.start();
    simOpen.setNetList(openNetlist);
    const openResults = await simOpen.runSim();
    expect(openResults).toBeDefined();

    // In open state, voltage across r1 (pin 1) should be virtually 0V (< 1e-4 V)
    const openLoadVoltages = openResults.data.filter(d => d.name !== "time" && !d.name.includes("#"));
    expect(openLoadVoltages.some(v => v.values.some(val => Math.abs(val) < 1e-4))).toBe(true);

    // 2. CLOSED STATE
    const closedCircuit = buildSwitchCircuit("closed");
    const closedNetlist = generator.generate(closedCircuit);
    expect(closedNetlist).toContain("R_SW1");
    expect(closedNetlist).toContain("1m");

    const simClosed = new Simulation();
    await simClosed.start();
    simClosed.setNetList(closedNetlist);
    const closedResults = await simClosed.runSim();
    expect(closedResults).toBeDefined();

    // In closed state, voltage across r1 is ~5V
    const closedLoadVoltages = closedResults.data.filter(d => d.name !== "time" && !d.name.includes("#"));
    expect(closedLoadVoltages.some(v => v.values.some(val => Math.abs(val - 5.0) < 0.05))).toBe(true);
  });

  it("should simulate 74HC164 8-bit shift register sequentially in transient analysis", async () => {
    // Direct netlist test with the 74HC164 subcircuit from library
    const { ComponentLibrary } = await import("../src/engine/library");
    const subcircuit = ComponentLibrary["74hc164"].spice?.subcircuitBody;
    expect(subcircuit).toBeDefined();

    const netlist = `
* 74HC164 Shift Register Verification
Vcc 14 0 5
Vgnd 7 0 0
Vclk 8 0 PULSE(0 5 10u 10n 10n 45u 100u)
Vdsa 1 0 5
Vdsb 2 0 PULSE(0 5 20u 10n 10n 150u 1000u)
Vmr 9 0 5

${subcircuit}

X1 1 2 3 4 5 6 7 8 9 10 11 12 13 14 74HC164

.tran 2u 400u
.end
`;

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    expect(results).toBeDefined();
    expect(results.numPoints).toBeGreaterThan(50);

    const timeVec = results.data.find(d => d.name === "time")?.values || [];
    const q0Vec = results.data.find(d => d.name === "v(3)")?.values || [];
    const q1Vec = results.data.find(d => d.name === "v(4)")?.values || [];
    const q2Vec = results.data.find(d => d.name === "v(5)")?.values || [];

    // Around t = 120us (after 1st clock edge while dsb is HIGH): Q0 must be HIGH, Q1 must be LOW
    const idx1 = timeVec.findIndex(t => t >= 120e-6);
    expect(idx1).toBeGreaterThan(-1);
    expect(q0Vec[idx1]).toBeGreaterThan(3.0);
    expect(q1Vec[idx1]).toBeLessThan(1.0);

    // Around t = 220us (after 2nd clock edge): Q0 shifts to Q1 (Q1 HIGH), and since DSB fell to 0 at 170us, Q0 becomes LOW
    const idx2 = timeVec.findIndex(t => t >= 220e-6);
    expect(idx2).toBeGreaterThan(-1);
    expect(q0Vec[idx2]).toBeLessThan(1.0);
    expect(q1Vec[idx2]).toBeGreaterThan(3.0);
    expect(q2Vec[idx2]).toBeLessThan(1.0);

    // Around t = 320us (after 3rd clock edge): Q1 shifts to Q2 (Q2 HIGH, Q1 LOW, Q0 LOW)
    const idx3 = timeVec.findIndex(t => t >= 320e-6);
    expect(idx3).toBeGreaterThan(-1);
    expect(q0Vec[idx3]).toBeLessThan(1.0);
    expect(q1Vec[idx3]).toBeLessThan(1.0);
    expect(q2Vec[idx3]).toBeGreaterThan(3.0);
  }, 15000);

  it("should emit .ic and uic to preserve state across interactive switch toggles", async () => {
    const { ComponentLibrary } = await import("../src/engine/library");
    const subcircuit = ComponentLibrary["74hc164"].spice?.subcircuitBody;

    const circuit: Circuit = {
      id: "interactive-shift-test",
      name: "Interactive Shift Test",
      components: [
        { id: "v1", type: "vsource", position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: { type: "dc", value: 5 } },
        { id: "u1", type: "74hc164", position: { x: 50, y: 0 }, rotation: 0, mirrored: false, params: { model: "74HC164" } },
        { id: "sw2", type: "switch", position: { x: 100, y: 0 }, rotation: 0, mirrored: false, params: { state: "open" } },
        { id: "gnd", type: "ground", position: { x: 0, y: 100 }, rotation: 0, mirrored: false, params: {} }
      ],
      wires: [],
      analyses: [{ kind: "interactive", params: { step: "1m", stop: "0.4s" } }]
    };

    const generator = new NetlistGenerator();
    const initialConditions = {
      "v(x_u1.s0)": 4.94,
      "v(x_u1.s1)": 4.94,
      "v(x_u1.m0)": 4.95,
      "v(x_u1.m1)": 4.95,
      "v(4)": 5.0, // VSource node
      "v(0)": 0,   // Ground
      "i(v1)": 0.05
    };

    const netlist = generator.generate(circuit, "interactive", initialConditions);
    expect(netlist).toContain(".ic");
    expect(netlist).toContain("V(x_u1.s0)=4.9400");
    expect(netlist).toContain("V(x_u1.m0)=4.9500");
    expect(netlist).not.toContain("V(4)=5.0000"); // Forced source node must be excluded
    expect(netlist).not.toContain("V(0)=0.0000"); // Ground must be excluded
    expect(netlist).not.toContain("i("); // Current branches must be excluded
    expect(netlist).toContain(".tran");
    expect(netlist).toContain("uic");
  });
});
