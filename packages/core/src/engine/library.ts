import { Pin } from "../models/circuit";

export const ComponentLibrary: Record<string, { name?: string, type?: string, pins: Pin[], defaultParams?: any }> = {
  resistor: {
    pins: [
      { id: "1", label: "p1", offset: { x: 0, y: -20 } },
      { id: "2", label: "p2", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { resistance: "1k" }
  },
  capacitor: {
    pins: [
      { id: "1", label: "p1", offset: { x: 0, y: -20 } },
      { id: "2", label: "p2", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { capacitance: "1u" }
  },
  inductor: {
    pins: [
      { id: "1", label: "p1", offset: { x: 0, y: -20 } },
      { id: "2", label: "p2", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { inductance: "1m" }
  },
  vsource: {
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { dc: "5", type: "dc" }
  },
  isource: {
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { dc: "1m", type: "dc" }
  },
  ground: {
    pins: [
      { id: "1", label: "gnd", offset: { x: 0, y: -20 } },
    ],
  },
  diode: {
    type: "diode",
    name: "Diode",
    pins: [
      { id: "1", label: "anode", offset: { x: 0, y: -20 } },
      { id: "2", label: "cathode", offset: { x: 0, y: 20 } }
    ],
    defaultParams: { model: "1N4148" }
  },
  npn: {
    type: "npn",
    name: "NPN BJT",
    pins: [
      { id: "c", label: "collector", offset: { x: 20, y: -20 } },
      { id: "b", label: "base", offset: { x: -20, y: 0 } },
      { id: "e", label: "emitter", offset: { x: 20, y: 20 } }
    ],
    defaultParams: { model: "2N3904" }
  },
  pnp: {
    type: "pnp",
    name: "PNP BJT",
    pins: [
      { id: "c", label: "collector", offset: { x: 20, y: 20 } },
      { id: "b", label: "base", offset: { x: -20, y: 0 } },
      { id: "e", label: "emitter", offset: { x: 20, y: -20 } }
    ],
    defaultParams: { model: "2N3906" }
  },
  nmos: {
    type: "nmos",
    name: "N-Channel MOSFET",
    pins: [
      { id: "d", label: "drain", offset: { x: 20, y: -20 } },
      { id: "g", label: "gate", offset: { x: -20, y: 0 } },
      { id: "s", label: "source", offset: { x: 20, y: 20 } }
    ],
    defaultParams: { model: "BS170" }
  },
  pmos: {
    type: "pmos",
    name: "P-Channel MOSFET",
    pins: [
      { id: "d", label: "drain", offset: { x: 20, y: 20 } },
      { id: "g", label: "gate", offset: { x: -20, y: 0 } },
      { id: "s", label: "source", offset: { x: 20, y: -20 } }
    ],
    defaultParams: { model: "BS250" }
  },
  opamp: {
    type: "opamp",
    name: "Op-Amp",
    pins: [
      { id: "1", label: "in+", offset: { x: -20, y: -10 } },
      { id: "2", label: "in-", offset: { x: -20, y: 10 } },
      { id: "3", label: "V+", offset: { x: 0, y: -20 } },
      { id: "4", label: "V-", offset: { x: 0, y: 20 } },
      { id: "5", label: "out", offset: { x: 20, y: 0 } }
    ],
    defaultParams: { model: "LM358" }
  },
  powersupply: {
    type: "powersupply",
    name: "Power Supply",
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -40 }, breadboardOffset: { x: -20, y: 30 } },
      { id: "2", label: "-", offset: { x: 0, y: 40 }, breadboardOffset: { x: 20, y: 30 } },
    ],
    defaultParams: { dc: "5" }
  },
  functiongenerator: {
    type: "functiongenerator",
    name: "Function Generator",
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -40 }, breadboardOffset: { x: -20, y: 30 } },
      { id: "2", label: "-", offset: { x: 0, y: 40 }, breadboardOffset: { x: 10, y: 30 } },
    ],
    defaultParams: { type: "sine", amplitude: "5", frequency: "1k" }
  },
  oscilloscope: {
    type: "oscilloscope",
    name: "Oscilloscope",
    pins: [
      { id: "1", label: "CH1+", offset: { x: -40, y: -20 }, breadboardOffset: { x: 40, y: -10 } },
      { id: "2", label: "CH1-", offset: { x: -40, y: 20 }, breadboardOffset: { x: 40, y: 10 } },
    ],
    defaultParams: {}
  },
  breadboard: {
    type: "breadboard",
    name: "Breadboard",
    pins: [],
    defaultParams: {}
  }
};
