const { v4: uuidv4 } = require('uuid');

const c1 = uuidv4();
const c2 = uuidv4();
const r1 = uuidv4();
const osc = uuidv4();
const gnd = uuidv4();

const circuit = {
  components: [
    { id: c1, type: 'function_generator', position: { x: 100, y: 150 }, rotation: 0, params: { type: 'sin', amplitude: '5', frequency: '1k', phase: '0' } },
    { id: c2, type: 'function_generator', position: { x: 100, y: 250 }, rotation: 0, params: { type: 'sin', amplitude: '5', frequency: '1k', phase: '90' } },
    { id: r1, type: 'resistor', position: { x: 250, y: 200 }, rotation: 0, params: { resistance: '1k' } },
    { id: gnd, type: 'ground', position: { x: 100, y: 320 }, rotation: 0, params: {} },
    { id: osc, type: 'oscilloscope', position: { x: 400, y: 200 }, rotation: 0, params: {} }
  ],
  wires: [
    { id: uuidv4(), points: [{ x: 100, y: 130 }, { x: 100, y: 100 }, { x: 250, y: 100 }, { x: 250, y: 180 }] }, // c1+ to r1+
    { id: uuidv4(), points: [{ x: 100, y: 170 }, { x: 100, y: 230 }] }, // c1- to c2+
    { id: uuidv4(), points: [{ x: 100, y: 270 }, { x: 100, y: 300 }] }, // c2- to gnd
    { id: uuidv4(), points: [{ x: 250, y: 220 }, { x: 250, y: 300 }, { x: 100, y: 300 }] }, // r1- to gnd
    { id: uuidv4(), points: [{ x: 250, y: 180 }, { x: 320, y: 180 }, { x: 320, y: 130 }] }, // r1+ to osc CH1+
    { id: uuidv4(), points: [{ x: 100, y: 170 }, { x: 200, y: 170 }, { x: 200, y: 180 }, { x: 320, y: 180 }] }, // c1- to osc CH2+
  ],
  analyses: [
    { kind: 'tran', params: { tstep: '10u', tstop: '5m' } }
  ]
};

const state = {
  state: {
    circuit: circuit,
    activeView: 'schematic',
    autoSimulate: true,
    showInstruments: true,
    activeAnalysis: 'tran',
    probes: [
      { nodeId: '1', color: '#2ecc71', x: 250, y: 100 }, // R1+ node (total voltage)
      { nodeId: '2', color: '#f1c40f', x: 150, y: 170 }  // C1- node (V2 voltage)
    ]
  },
  version: 0
};

console.log(JSON.stringify(state));
