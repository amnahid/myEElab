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
    name: "DC Power Supply",
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { dc: "5", type: "dc" }
  },
  function_generator: {
    name: "Function Generator",
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { type: "sin", offset: "0", amplitude: "5", frequency: "1k" }
  },
  isource: {
    name: "Current Source",
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

  oscilloscope: {
    type: "oscilloscope",
    name: "Oscilloscope",
    pins: [
      { id: "1", label: "CH1+", offset: { x: -80, y: -70 } },
      { id: "2", label: "CH1-", offset: { x: -80, y: -50 } },
      { id: "3", label: "CH2+", offset: { x: -80, y: -20 } },
      { id: "4", label: "CH2-", offset: { x: -80, y: 0 } },
      { id: "5", label: "CH3+", offset: { x: -80, y: 30 } },
      { id: "6", label: "CH3-", offset: { x: -80, y: 50 } },
      { id: "7", label: "CH4+", offset: { x: -80, y: 80 } },
      { id: "8", label: "CH4-", offset: { x: -80, y: 100 } },
    ],
    defaultParams: {}
  },
  multimeter: {
    type: "multimeter",
    name: "Multimeter",
    pins: [
      { id: "1", label: "V/A/Ω", offset: { x: -22, y: 48 } },
      { id: "2", label: "COM", offset: { x: 22, y: 48 } },
    ],
    defaultParams: { mode: "voltage" }
  },
  current_probe: {
    type: "current_probe",
    name: "Current Probe",
    pins: [
      { id: "in", label: "IN", offset: { x: 0, y: -20 } },
      { id: "out", label: "OUT", offset: { x: 0, y: 20 } },
      { id: "scope", label: "SCOPE", offset: { x: 20, y: 0 } },
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
