import { ComponentDefinition } from "../models/circuit";

export const ComponentLibrary: Record<string, ComponentDefinition> = {
  resistor: {
    type: "resistor",
    name: "Resistor",
    category: "passives",
    package: "discrete",
    description: "Standard passive fixed-value resistor with configurable resistance",
    manufacturer: "Generic Passives",
    keywords: ["resistor", "r", "passive", "resistance", "ohm"],
    pins: [
      { id: "1", label: "p1", offset: { x: 0, y: -20 } },
      { id: "2", label: "p2", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { resistance: "1k" },
    maxPower: 0.25 // 250mW standard 1/4W resistor
  },
  capacitor: {
    type: "capacitor",
    name: "Capacitor",
    category: "passives",
    package: "discrete",
    description: "Standard passive capacitor with configurable capacitance",
    manufacturer: "Generic Passives",
    keywords: ["capacitor", "c", "passive", "capacitance", "farad"],
    pins: [
      { id: "1", label: "p1", offset: { x: 0, y: -20 } },
      { id: "2", label: "p2", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { capacitance: "1u" }
  },
  inductor: {
    type: "inductor",
    name: "Inductor",
    category: "passives",
    package: "discrete",
    description: "Standard passive inductor with configurable inductance",
    manufacturer: "Generic Passives",
    keywords: ["inductor", "l", "coil", "choke", "henry"],
    pins: [
      { id: "1", label: "p1", offset: { x: 0, y: -20 } },
      { id: "2", label: "p2", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { inductance: "1m" }
  },
  transformer: {
    type: "transformer",
    name: "Transformer",
    category: "passives",
    package: "discrete",
    description: "Coupled mutual inductor transformer with primary and secondary windings",
    manufacturer: "Generic Passives",
    keywords: ["transformer", "xfmr", "coupled", "isolation"],
    pins: [
      { id: "p1", label: "Pri +", offset: { x: -20, y: -20 } },
      { id: "p2", label: "Pri -", offset: { x: -20, y: 20 } },
      { id: "s1", label: "Sec +", offset: { x: 20, y: -20 } },
      { id: "s2", label: "Sec -", offset: { x: 20, y: 20 } }
    ],
    defaultParams: { L1: "1m", L2: "1m", K: "0.99" }
  },
  vsource: {
    type: "vsource",
    name: "DC Power Supply",
    category: "sources",
    package: "discrete",
    description: "Constant DC voltage source with adjustable output voltage",
    manufacturer: "Bench Instruments",
    keywords: ["vsource", "dc", "voltage", "battery", "supply", "vcc"],
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { dc: "5", type: "dc" }
  },
  function_generator: {
    type: "function_generator",
    name: "Function Generator",
    category: "sources",
    package: "discrete",
    description: "Signal generator providing sine, triangle, and square waveforms",
    manufacturer: "Bench Instruments",
    keywords: ["generator", "sine", "ac", "frequency", "oscillator"],
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { type: "sin", offset: "0", amplitude: "5", frequency: "1k" }
  },
  clock: {
    type: "clock",
    name: "Clock Source",
    category: "sources",
    package: "discrete",
    description: "Digital clock pulse generator with configurable frequency, high/low voltage, and duty cycle",
    manufacturer: "Generic Sources",
    keywords: ["clock", "clk", "pulse", "square", "oscillator", "generator", "digital", "timing"],
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: {
      frequency: "1k",
      vhigh: "5",
      vlow: "0",
      duty: "50",
      delay: "0",
      trise: "1n",
      tfall: "1n"
    },
    spice: {
      prefix: "V",
      modelType: "primitive"
    }
  },
  isource: {
    type: "isource",
    name: "Current Source",
    category: "sources",
    package: "discrete",
    description: "Ideal independent constant current source",
    manufacturer: "Bench Instruments",
    keywords: ["isource", "current", "amperes", "constant current"],
    pins: [
      { id: "1", label: "+", offset: { x: 0, y: -20 } },
      { id: "2", label: "-", offset: { x: 0, y: 20 } },
    ],
    defaultParams: { dc: "1m", type: "dc" }
  },
  ground: {
    type: "ground",
    name: "Ground",
    category: "sources",
    package: "discrete",
    description: "Zero-volt reference node (SPICE node 0)",
    manufacturer: "System",
    keywords: ["ground", "gnd", "0", "earth", "reference"],
    pins: [
      { id: "1", label: "gnd", offset: { x: 0, y: -20 } },
    ],
  },
  diode: {
    type: "diode",
    name: "Diode (1N4148)",
    category: "semiconductors",
    package: "discrete",
    description: "High-speed switching silicon epitaxial diode (1N4148)",
    manufacturer: "Vishay / ON Semi",
    keywords: ["diode", "1n4148", "rectifier", "semiconductor"],
    pins: [
      { id: "1", label: "anode", offset: { x: 0, y: -20 } },
      { id: "2", label: "cathode", offset: { x: 0, y: 20 } }
    ],
    defaultParams: { model: "1N4148" },
    maxPower: 0.5 // 500mW max for 1N4148
  },
  led: {
    type: "led",
    name: "LED (Red)",
    category: "semiconductors",
    package: "discrete",
    description: "Light Emitting Diode with forward voltage drop and visual indicator",
    manufacturer: "Kingbright",
    keywords: ["led", "light", "diode", "indicator", "red"],
    pins: [
      { id: "1", label: "anode", offset: { x: 0, y: -20 } },
      { id: "2", label: "cathode", offset: { x: 0, y: 20 } }
    ],
    defaultParams: { model: "LED_RED", color: "#ff0000" },
    maxPower: 0.05 // 50mW max for standard LED (e.g., 20mA * 2.5V)
  },
  zener: {
    type: "zener",
    name: "Zener Diode (1N4733A 5.1V)",
    category: "semiconductors",
    package: "discrete",
    description: "5.1V 1W Zener voltage regulator diode (1N4733A)",
    manufacturer: "ON Semiconductor",
    keywords: ["zener", "diode", "regulator", "1n4733a", "5.1v"],
    pins: [
      { id: "1", label: "anode", offset: { x: 0, y: -20 } },
      { id: "2", label: "cathode", offset: { x: 0, y: 20 } }
    ],
    defaultParams: { model: "1N4733A" },
    maxPower: 1.0 // 1W max for 1N4733A Zener
  },
  npn: {
    type: "npn",
    name: "NPN BJT (2N3904)",
    category: "semiconductors",
    package: "to92",
    description: "General-purpose NPN bipolar junction transistor in TO-92 package",
    manufacturer: "Fairchild / ON Semi",
    keywords: ["npn", "bjt", "transistor", "2n3904", "to-92"],
    pins: [
      { id: "c", label: "collector", offset: { x: 20, y: -20 } },
      { id: "b", label: "base", offset: { x: -20, y: 0 } },
      { id: "e", label: "emitter", offset: { x: 20, y: 20 } }
    ],
    defaultParams: { model: "2N3904" }
  },
  pnp: {
    type: "pnp",
    name: "PNP BJT (2N3906)",
    category: "semiconductors",
    package: "to92",
    description: "General-purpose PNP bipolar junction transistor in TO-92 package",
    manufacturer: "Fairchild / ON Semi",
    keywords: ["pnp", "bjt", "transistor", "2n3906", "to-92"],
    pins: [
      { id: "c", label: "collector", offset: { x: 20, y: 20 } },
      { id: "b", label: "base", offset: { x: -20, y: 0 } },
      { id: "e", label: "emitter", offset: { x: 20, y: -20 } }
    ],
    defaultParams: { model: "2N3906" }
  },
  nmos: {
    type: "nmos",
    name: "N-Channel MOSFET (BS170)",
    category: "semiconductors",
    package: "to92",
    description: "60V N-Channel small-signal enhancement mode Field Effect Transistor",
    manufacturer: "ON Semiconductor",
    keywords: ["nmos", "mosfet", "fet", "bs170", "transistor"],
    pins: [
      { id: "d", label: "drain", offset: { x: 20, y: -20 } },
      { id: "g", label: "gate", offset: { x: -20, y: 0 } },
      { id: "s", label: "source", offset: { x: 20, y: 20 } }
    ],
    defaultParams: { model: "BS170" }
  },
  pmos: {
    type: "pmos",
    name: "P-Channel MOSFET (BS250)",
    category: "semiconductors",
    package: "to92",
    description: "45V P-Channel small-signal enhancement mode Field Effect Transistor",
    manufacturer: "ON Semiconductor",
    keywords: ["pmos", "mosfet", "fet", "bs250", "transistor"],
    pins: [
      { id: "d", label: "drain", offset: { x: 20, y: 20 } },
      { id: "g", label: "gate", offset: { x: -20, y: 0 } },
      { id: "s", label: "source", offset: { x: 20, y: -20 } }
    ],
    defaultParams: { model: "BS250" }
  },
  opamp: {
    type: "opamp",
    name: "Op-Amp (LM358 Model)",
    category: "analog_ic",
    package: "dip8",
    description: "Dual operational amplifier with wide supply range and low power drain",
    manufacturer: "National Semiconductor / TI",
    keywords: ["opamp", "amplifier", "lm358", "comparator", "analog"],
    pins: [
      { id: "1", label: "in+", offset: { x: -20, y: -10 } },
      { id: "2", label: "in-", offset: { x: -20, y: 10 } },
      { id: "3", label: "V+", offset: { x: 0, y: -20 } },
      { id: "4", label: "V-", offset: { x: 0, y: 20 } },
      { id: "5", label: "out", offset: { x: 20, y: 0 } }
    ],
    defaultParams: { model: "LM358" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "LM358",
      pinOrder: ["1", "2", "3", "4", "5"],
      subcircuitBody: `.subckt LM358 1 2 3 4 5\n* 1=in+, 2=in-, 3=v+, 4=v-, 5=out\nE1 5 0 1 2 100k\n.ends LM358`
    }
  },

  ne555: {
    type: "ne555",
    name: "NE555 Timer",
    category: "analog_ic",
    package: "dip8",
    description: "Highly stable controller capable of producing accurate timing oscillations or delays",
    manufacturer: "Signetics / TI / ST",
    keywords: ["555", "ne555", "timer", "oscillator", "astable", "monostable", "clock", "dip8"],
    pins: [
      { id: "1", label: "GND", offset: { x: 0, y: 65 } },
      { id: "2", label: "TRIG", offset: { x: -70, y: -10 } },
      { id: "3", label: "OUT", offset: { x: 70, y: 10 } },
      { id: "4", label: "RESET", offset: { x: -70, y: -30 } },
      { id: "5", label: "CTRL", offset: { x: -70, y: 30 } },
      { id: "6", label: "THRES", offset: { x: -70, y: 10 } },
      { id: "7", label: "DISCH", offset: { x: 70, y: -10 } },
      { id: "8", label: "VCC", offset: { x: 0, y: -65 } }
    ],
    defaultParams: { model: "NE555" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "NE555",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8"],
      subcircuitBody: `.subckt NE555 1 2 3 4 5 6 7 8\n* 1=GND 2=TRIG 3=OUT 4=RESET 5=CTRL 6=THRES 7=DISCH 8=VCC\nRa 8 5 5k\nRb 5 11 5k\nRc 11 1 5k\nBcomp1 12 1 V = (V(6,5) > 0 ? 1 : 0)\nBcomp2 13 1 V = (V(11,2) > 0 ? 1 : 0)\nR_latch 14 1 10k\nC_latch 14 1 10n\nB_latch 14 1 I = (V(4,1) < 0.7 ? 1m : (V(12,1) > 0.5 ? 1m : (V(13,1) > 0.5 ? -1m : (V(14,1) > 0.5 ? 0.2m : -0.2m))))\nB_out 3 1 V = (V(4,1) < 0.7 ? 0 : (V(14,1) > 0.5 ? 0.1 : V(8,1) - 0.5))\nS_disch 7 1 14 1 S_SW\n.model S_SW SW(RON=5 ROFF=1Meg VT=0.5 VH=0.1)\n.ends NE555`
    }
  },

  lm7805: {
    type: "lm7805",
    name: "LM7805 +5V Regulator",
    category: "power",
    package: "to220",
    description: "3-terminal 1.5A positive fixed 5V linear voltage regulator with internal thermal limiting",
    manufacturer: "Texas Instruments / ST",
    keywords: ["7805", "lm7805", "regulator", "power", "5v", "linear", "to220"],
    pins: [
      { id: "1", label: "IN", offset: { x: -70, y: -10 } },
      { id: "2", label: "GND", offset: { x: 0, y: 35 } },
      { id: "3", label: "OUT", offset: { x: 70, y: -10 } }
    ],
    defaultParams: { model: "LM7805" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "LM7805",
      pinOrder: ["1", "2", "3"],
      subcircuitBody: `.subckt LM7805 1 2 3\n* 1=IN 2=GND 3=OUT\nRin 1 2 1Meg\nB1 3_int 2 V = (V(1,2) > 7.0 ? 5.0 : (V(1,2) > 2.0 ? V(1,2) - 2.0 : 0))\nRout 3_int 3 0.05\nCout 3 2 0.1u\n.ends LM7805`
    }
  },

  tl072: {
    type: "tl072",
    name: "TL072 Dual JFET Op-Amp",
    category: "analog_ic",
    package: "dip8",
    description: "Low-noise JFET-input dual operational amplifier with high slew rate and low input bias currents",
    manufacturer: "Texas Instruments",
    keywords: ["tl072", "jfet", "opamp", "audio", "dual", "amplifier", "dip8"],
    pins: [
      { id: "1", label: "1OUT", offset: { x: 70, y: -30 } },
      { id: "2", label: "1IN-", offset: { x: -70, y: -20 } },
      { id: "3", label: "1IN+", offset: { x: -70, y: -40 } },
      { id: "4", label: "V-", offset: { x: 0, y: 75 } },
      { id: "5", label: "2IN+", offset: { x: -70, y: 20 } },
      { id: "6", label: "2IN-", offset: { x: -70, y: 40 } },
      { id: "7", label: "2OUT", offset: { x: 70, y: 30 } },
      { id: "8", label: "V+", offset: { x: 0, y: -75 } }
    ],
    defaultParams: { model: "TL072" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "TL072",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8"],
      subcircuitBody: `.subckt TL072 1 2 3 4 5 6 7 8\n* 1=1OUT 2=1IN- 3=1IN+ 4=V- 5=2IN+ 6=2IN- 7=2OUT 8=V+\nE1 1 0 3 2 200k\nE2 7 0 5 6 200k\nR1 3 2 10Meg\nR2 5 6 10Meg\n.ends TL072`
    }
  },

  "74hc00": {
    type: "74hc00",
    name: "74HC00 Quad NAND",
    category: "digital_logic",
    package: "dip14",
    description: "Quadruple 2-input positive-NAND gates, high-speed CMOS",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["nand", "logic", "gate", "7400", "74hc00", "cmos", "quad", "dip14"],
    pins: [
      { id: "1", label: "1A", offset: { x: -70, y: -50 } },
      { id: "2", label: "1B", offset: { x: -70, y: -30 } },
      { id: "3", label: "1Y", offset: { x: 70, y: -40 } },
      { id: "4", label: "2A", offset: { x: -70, y: -10 } },
      { id: "5", label: "2B", offset: { x: -70, y: 10 } },
      { id: "6", label: "2Y", offset: { x: 70, y: 0 } },
      { id: "7", label: "GND", offset: { x: 0, y: 125 } },
      { id: "8", label: "3Y", offset: { x: 70, y: 20 } },
      { id: "9", label: "3A", offset: { x: -70, y: 30 } },
      { id: "10", label: "3B", offset: { x: -70, y: 50 } },
      { id: "11", label: "4Y", offset: { x: 70, y: 50 } },
      { id: "12", label: "4A", offset: { x: -70, y: 70 } },
      { id: "13", label: "4B", offset: { x: -70, y: 90 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC00" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC00",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC00 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 14=VCC 7=GND; Gate 1: 1,2->3; Gate 2: 4,5->6; Gate 3: 9,10->8; Gate 4: 12,13->11\nB_1 3_i 7 V = ((V(1,7) > 2.0 && V(2,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_1 3_i 3 50\nB_2 6_i 7 V = ((V(4,7) > 2.0 && V(5,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_2 6_i 6 50\nB_3 8_i 7 V = ((V(9,7) > 2.0 && V(10,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_3 8_i 8 50\nB_4 11_i 7 V = ((V(12,7) > 2.0 && V(13,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_4 11_i 11 50\n.ends 74HC00`
    }
  },

  "74hc04": {
    type: "74hc04",
    name: "74HC04 Hex Inverter",
    category: "digital_logic",
    package: "dip14",
    description: "Hex inverter gates, high-speed CMOS",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["not", "inverter", "logic", "gate", "7404", "74hc04", "cmos", "dip14"],
    pins: [
      { id: "1", label: "1A", offset: { x: -70, y: -50 } },
      { id: "2", label: "1Y", offset: { x: 70, y: -50 } },
      { id: "3", label: "2A", offset: { x: -70, y: -30 } },
      { id: "4", label: "2Y", offset: { x: 70, y: -30 } },
      { id: "5", label: "3A", offset: { x: -70, y: -10 } },
      { id: "6", label: "3Y", offset: { x: 70, y: -10 } },
      { id: "7", label: "GND", offset: { x: 0, y: 85 } },
      { id: "8", label: "4Y", offset: { x: 70, y: 10 } },
      { id: "9", label: "4A", offset: { x: -70, y: 10 } },
      { id: "10", label: "5Y", offset: { x: 70, y: 30 } },
      { id: "11", label: "5A", offset: { x: -70, y: 30 } },
      { id: "12", label: "6Y", offset: { x: 70, y: 50 } },
      { id: "13", label: "6A", offset: { x: -70, y: 50 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC04" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC04",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC04 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 14=VCC 7=GND; Inv 1..6\nB_1 2_i 7 V = (V(1,7) > 2.0 ? 0.05 : V(14,7) - 0.05)\nR_1 2_i 2 50\nB_2 4_i 7 V = (V(3,7) > 2.0 ? 0.05 : V(14,7) - 0.05)\nR_2 4_i 4 50\nB_3 6_i 7 V = (V(5,7) > 2.0 ? 0.05 : V(14,7) - 0.05)\nR_3 6_i 6 50\nB_4 8_i 7 V = (V(9,7) > 2.0 ? 0.05 : V(14,7) - 0.05)\nR_4 8_i 8 50\nB_5 10_i 7 V = (V(11,7) > 2.0 ? 0.05 : V(14,7) - 0.05)\nR_5 10_i 10 50\nB_6 12_i 7 V = (V(13,7) > 2.0 ? 0.05 : V(14,7) - 0.05)\nR_6 12_i 12 50\n.ends 74HC04`
    }
  },

  "74hc08": {
    type: "74hc08",
    name: "74HC08 Quad AND",
    category: "digital_logic",
    package: "dip14",
    description: "Quadruple 2-input positive-AND gates, high-speed CMOS",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["and", "logic", "gate", "7408", "74hc08", "cmos", "quad", "dip14"],
    pins: [
      { id: "1", label: "1A", offset: { x: -70, y: -50 } },
      { id: "2", label: "1B", offset: { x: -70, y: -30 } },
      { id: "3", label: "1Y", offset: { x: 70, y: -40 } },
      { id: "4", label: "2A", offset: { x: -70, y: -10 } },
      { id: "5", label: "2B", offset: { x: -70, y: 10 } },
      { id: "6", label: "2Y", offset: { x: 70, y: 0 } },
      { id: "7", label: "GND", offset: { x: 0, y: 125 } },
      { id: "8", label: "3Y", offset: { x: 70, y: 20 } },
      { id: "9", label: "3A", offset: { x: -70, y: 30 } },
      { id: "10", label: "3B", offset: { x: -70, y: 50 } },
      { id: "11", label: "4Y", offset: { x: 70, y: 50 } },
      { id: "12", label: "4A", offset: { x: -70, y: 70 } },
      { id: "13", label: "4B", offset: { x: -70, y: 90 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC08" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC08",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC08 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 14=VCC 7=GND; Quad 2-Input AND Gate\nB_1 3_i 7 V = ((V(1,7) > 2.0 && V(2,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_1 3_i 3 50\nB_2 6_i 7 V = ((V(4,7) > 2.0 && V(5,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_2 6_i 6 50\nB_3 8_i 7 V = ((V(9,7) > 2.0 && V(10,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_3 8_i 8 50\nB_4 11_i 7 V = ((V(12,7) > 2.0 && V(13,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_4 11_i 11 50\n.ends 74HC08`
    }
  },

  "74hc32": {
    type: "74hc32",
    name: "74HC32 Quad OR",
    category: "digital_logic",
    package: "dip14",
    description: "Quadruple 2-input positive-OR gates, high-speed CMOS",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["or", "logic", "gate", "7432", "cmos", "quad"],
    pins: [
      { id: "1", label: "1A", offset: { x: -70, y: -50 } },
      { id: "2", label: "1B", offset: { x: -70, y: -30 } },
      { id: "3", label: "1Y", offset: { x: 70, y: -40 } },
      { id: "4", label: "2A", offset: { x: -70, y: -10 } },
      { id: "5", label: "2B", offset: { x: -70, y: 10 } },
      { id: "6", label: "2Y", offset: { x: 70, y: 0 } },
      { id: "7", label: "GND", offset: { x: 0, y: 125 } },
      { id: "8", label: "3Y", offset: { x: 70, y: 20 } },
      { id: "9", label: "3A", offset: { x: -70, y: 30 } },
      { id: "10", label: "3B", offset: { x: -70, y: 50 } },
      { id: "11", label: "4Y", offset: { x: 70, y: 50 } },
      { id: "12", label: "4A", offset: { x: -70, y: 70 } },
      { id: "13", label: "4B", offset: { x: -70, y: 90 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC32" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC32",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC32 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 14=VCC 7=GND; Quad 2-Input OR Gate\nB_1 3_i 7 V = ((V(1,7) > 2.0 || V(2,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_1 3_i 3 50\nB_2 6_i 7 V = ((V(4,7) > 2.0 || V(5,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_2 6_i 6 50\nB_3 8_i 7 V = ((V(9,7) > 2.0 || V(10,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_3 8_i 8 50\nB_4 11_i 7 V = ((V(12,7) > 2.0 || V(13,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nR_4 11_i 11 50\n.ends 74HC32`
    }
  },

  "74hc02": {
    type: "74hc02",
    name: "74HC02 Quad NOR",
    category: "digital_logic",
    package: "dip14",
    description: "Quadruple 2-input positive-NOR gates, high-speed CMOS",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["nor", "logic", "gate", "7402", "cmos", "quad"],
    pins: [
      { id: "1", label: "1Y", offset: { x: 70, y: -40 } },
      { id: "2", label: "1A", offset: { x: -70, y: -50 } },
      { id: "3", label: "1B", offset: { x: -70, y: -30 } },
      { id: "4", label: "2Y", offset: { x: 70, y: 0 } },
      { id: "5", label: "2A", offset: { x: -70, y: -10 } },
      { id: "6", label: "2B", offset: { x: -70, y: 10 } },
      { id: "7", label: "GND", offset: { x: 0, y: 125 } },
      { id: "8", label: "3A", offset: { x: -70, y: 30 } },
      { id: "9", label: "3B", offset: { x: -70, y: 50 } },
      { id: "10", label: "3Y", offset: { x: 70, y: 20 } },
      { id: "11", label: "4A", offset: { x: -70, y: 70 } },
      { id: "12", label: "4B", offset: { x: -70, y: 90 } },
      { id: "13", label: "4Y", offset: { x: 70, y: 50 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC02" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC02",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC02 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 14=VCC 7=GND; Gate 1: 2,3->1; Gate 2: 5,6->4; Gate 3: 8,9->10; Gate 4: 11,12->13\nB_1 1_i 7 V = ((V(2,7) > 2.0 || V(3,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_1 1_i 1 50\nB_2 4_i 7 V = ((V(5,7) > 2.0 || V(6,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_2 4_i 4 50\nB_3 10_i 7 V = ((V(8,7) > 2.0 || V(9,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_3 10_i 10 50\nB_4 13_i 7 V = ((V(11,7) > 2.0 || V(12,7) > 2.0) ? 0.05 : V(14,7) - 0.05)\nR_4 13_i 13 50\n.ends 74HC02`
    }
  },

  "74hc86": {
    type: "74hc86",
    name: "74HC86 Quad XOR",
    category: "digital_logic",
    package: "dip14",
    description: "Quadruple 2-input Exclusive-OR gates, high-speed CMOS",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["xor", "exclusive-or", "logic", "gate", "7486", "cmos", "quad"],
    pins: [
      { id: "1", label: "1A", offset: { x: -70, y: -50 } },
      { id: "2", label: "1B", offset: { x: -70, y: -30 } },
      { id: "3", label: "1Y", offset: { x: 70, y: -40 } },
      { id: "4", label: "2A", offset: { x: -70, y: -10 } },
      { id: "5", label: "2B", offset: { x: -70, y: 10 } },
      { id: "6", label: "2Y", offset: { x: 70, y: 0 } },
      { id: "7", label: "GND", offset: { x: 0, y: 125 } },
      { id: "8", label: "3Y", offset: { x: 70, y: 20 } },
      { id: "9", label: "3A", offset: { x: -70, y: 30 } },
      { id: "10", label: "3B", offset: { x: -70, y: 50 } },
      { id: "11", label: "4Y", offset: { x: 70, y: 50 } },
      { id: "12", label: "4A", offset: { x: -70, y: 70 } },
      { id: "13", label: "4B", offset: { x: -70, y: 90 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC86" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC86",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC86 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 14=VCC 7=GND; Gate 1: 1,2->3; Gate 2: 4,5->6; Gate 3: 9,10->8; Gate 4: 12,13->11\nB_1 3_i 7 V = (((V(1,7) > 2.0 && V(2,7) <= 2.0) || (V(1,7) <= 2.0 && V(2,7) > 2.0)) ? V(14,7) - 0.05 : 0.05)\nR_1 3_i 3 50\nB_2 6_i 7 V = (((V(4,7) > 2.0 && V(5,7) <= 2.0) || (V(4,7) <= 2.0 && V(5,7) > 2.0)) ? V(14,7) - 0.05 : 0.05)\nR_2 6_i 6 50\nB_3 8_i 7 V = (((V(9,7) > 2.0 && V(10,7) <= 2.0) || (V(9,7) <= 2.0 && V(10,7) > 2.0)) ? V(14,7) - 0.05 : 0.05)\nR_3 8_i 8 50\nB_4 11_i 7 V = (((V(12,7) > 2.0 && V(13,7) <= 2.0) || (V(12,7) <= 2.0 && V(13,7) > 2.0)) ? V(14,7) - 0.05 : 0.05)\nR_4 11_i 11 50\n.ends 74HC86`
    }
  },

  "74hc161": {
    type: "74hc161",
    name: "74HC161 4-Bit Binary Counter",
    category: "digital_logic",
    package: "dip16",
    description: "Synchronous 4-bit binary counter with asynchronous reset, parallel load and ripple carry",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc16", "74hc161", "74161", "161", "counter", "binary counter", "4-bit", "synchronous", "dip16", "logic"],
    pins: [
      { id: "1", label: "~MR", offset: { x: -70, y: -70 } },
      { id: "2", label: "CP", offset: { x: -70, y: -50 } },
      { id: "3", label: "D0", offset: { x: -70, y: -30 } },
      { id: "4", label: "D1", offset: { x: -70, y: -10 } },
      { id: "5", label: "D2", offset: { x: -70, y: 10 } },
      { id: "6", label: "D3", offset: { x: -70, y: 30 } },
      { id: "7", label: "CEP", offset: { x: -70, y: 50 } },
      { id: "8", label: "GND", offset: { x: 0, y: 105 } },
      { id: "9", label: "~PE", offset: { x: -70, y: 70 } },
      { id: "10", label: "CET", offset: { x: 70, y: -50 } },
      { id: "11", label: "Q3", offset: { x: 70, y: 50 } },
      { id: "12", label: "Q2", offset: { x: 70, y: 30 } },
      { id: "13", label: "Q1", offset: { x: 70, y: 10 } },
      { id: "14", label: "Q0", offset: { x: 70, y: -10 } },
      { id: "15", label: "TC", offset: { x: 70, y: -30 } },
      { id: "16", label: "VCC", offset: { x: 0, y: -105 } }
    ],
    defaultParams: { model: "74HC161" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC161",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
      subcircuitBody: `.subckt 74HC161 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n* 1=~MR 2=CP 3=D0 4=D1 5=D2 6=D3 7=CEP 8=GND 9=~PE 10=CET 11=Q3 12=Q2 13=Q1 14=Q0 15=TC 16=VCC\nB_TC 15_i 8 V = ((V(14,8) > 2.0 && V(13,8) > 2.0 && V(12,8) > 2.0 && V(11,8) > 2.0 && V(10,8) > 2.0) ? V(16,8) - 0.05 : 0.05)\nR_TC 15_i 15 50\nB_Q0 14_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(3,8) : (V(14,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q0 14_i 14 50\nB_Q1 13_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(4,8) : (V(13,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q1 13_i 13 50\nB_Q2 12_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(5,8) : (V(12,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q2 12_i 12 50\nB_Q3 11_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(6,8) : (V(11,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q3 11_i 11 50\n.ends 74HC161`
    }
  },

  "74hc163": {
    type: "74hc163",
    name: "74HC163 4-Bit Binary Counter (Sync Reset)",
    category: "digital_logic",
    package: "dip16",
    description: "Synchronous 4-bit binary counter with synchronous reset, parallel load and ripple carry",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc16", "74hc163", "74163", "163", "counter", "binary counter", "sync clear", "dip16", "logic"],
    pins: [
      { id: "1", label: "~SR", offset: { x: -30, y: -70 } },
      { id: "2", label: "CP", offset: { x: -30, y: -50 } },
      { id: "3", label: "D0", offset: { x: -30, y: -30 } },
      { id: "4", label: "D1", offset: { x: -30, y: -10 } },
      { id: "5", label: "D2", offset: { x: -30, y: 10 } },
      { id: "6", label: "D3", offset: { x: -30, y: 30 } },
      { id: "7", label: "CEP", offset: { x: -30, y: 50 } },
      { id: "8", label: "GND", offset: { x: -30, y: 70 } },
      { id: "9", label: "~PE", offset: { x: 30, y: 70 } },
      { id: "10", label: "CET", offset: { x: 30, y: 50 } },
      { id: "11", label: "Q3", offset: { x: 30, y: 30 } },
      { id: "12", label: "Q2", offset: { x: 30, y: 10 } },
      { id: "13", label: "Q1", offset: { x: 30, y: -10 } },
      { id: "14", label: "Q0", offset: { x: 30, y: -30 } },
      { id: "15", label: "TC", offset: { x: 30, y: -50 } },
      { id: "16", label: "VCC", offset: { x: 30, y: -70 } }
    ],
    defaultParams: { model: "74HC163" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC163",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
      subcircuitBody: `.subckt 74HC163 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n* 1=~SR 2=CP 3=D0 4=D1 5=D2 6=D3 7=CEP 8=GND 9=~PE 10=CET 11=Q3 12=Q2 13=Q1 14=Q0 15=TC 16=VCC\nB_TC 15_i 8 V = ((V(14,8) > 2.0 && V(13,8) > 2.0 && V(12,8) > 2.0 && V(11,8) > 2.0 && V(10,8) > 2.0) ? V(16,8) - 0.05 : 0.05)\nR_TC 15_i 15 50\nB_Q0 14_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(3,8) : (V(14,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q0 14_i 14 50\nB_Q1 13_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(4,8) : (V(13,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q1 13_i 13 50\nB_Q2 12_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(5,8) : (V(12,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q2 12_i 12 50\nB_Q3 11_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(6,8) : (V(11,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q3 11_i 11 50\n.ends 74HC163`
    }
  },

  "74hc164": {
    type: "74hc164",
    name: "74HC164 8-Bit SIPO Shift Register",
    category: "digital_logic",
    package: "dip14",
    description: "8-bit serial-in parallel-out shift register with asynchronous master reset",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc16", "74hc164", "74164", "164", "shift register", "sipo", "serial in parallel out", "dip14", "logic"],
    pins: [
      { id: "1", label: "DSA", offset: { x: -70, y: -50 } },
      { id: "2", label: "DSB", offset: { x: -70, y: -30 } },
      { id: "3", label: "Q0", offset: { x: 70, y: -50 } },
      { id: "4", label: "Q1", offset: { x: 70, y: -30 } },
      { id: "5", label: "Q2", offset: { x: 70, y: -10 } },
      { id: "6", label: "Q3", offset: { x: 70, y: 10 } },
      { id: "7", label: "GND", offset: { x: 0, y: 125 } },
      { id: "8", label: "CP", offset: { x: -70, y: -10 } },
      { id: "9", label: "~MR", offset: { x: -70, y: 10 } },
      { id: "10", label: "Q4", offset: { x: 70, y: 30 } },
      { id: "11", label: "Q5", offset: { x: 70, y: 50 } },
      { id: "12", label: "Q6", offset: { x: 70, y: 70 } },
      { id: "13", label: "Q7", offset: { x: 70, y: 90 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC164" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC164",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC164 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 1=DSA 2=DSB 3=Q0 4=Q1 5=Q2 6=Q3 7=GND 8=CP 9=~MR 10=Q4 11=Q5 12=Q6 13=Q7 14=VCC\nB_IN in_d 7 V = ((V(1,7) > 2.0 && V(2,7) > 2.0) ? V(14,7) - 0.05 : 0.05)\nB_Q0 3_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(in_d))\nR_Q0 3_i 3 50\nB_Q1 4_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(3,7))\nR_Q1 4_i 4 50\nB_Q2 5_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(4,7))\nR_Q2 5_i 5 50\nB_Q3 6_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(5,7))\nR_Q3 6_i 6 50\nB_Q4 10_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(6,7))\nR_Q4 10_i 10 50\nB_Q5 11_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(10,7))\nR_Q5 11_i 11 50\nB_Q6 12_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(11,7))\nR_Q6 12_i 12 50\nB_Q7 13_i 7 V = (V(9,7) < 0.8 ? 0.05 : V(12,7))\nR_Q7 13_i 13 50\n.ends 74HC164`
    }
  },

  "74hc165": {
    type: "74hc165",
    name: "74HC165 8-Bit PISO Shift Register",
    category: "digital_logic",
    package: "dip16",
    description: "8-bit parallel-in serial-out shift register with complementary serial outputs",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc16", "74hc165", "74165", "165", "shift register", "piso", "parallel in serial out", "dip16", "logic"],
    pins: [
      { id: "1", label: "~PL", offset: { x: -70, y: -70 } },
      { id: "2", label: "CP", offset: { x: -70, y: -50 } },
      { id: "3", label: "D4", offset: { x: -70, y: 70 } },
      { id: "4", label: "D5", offset: { x: -70, y: 90 } },
      { id: "5", label: "D6", offset: { x: -70, y: 110 } },
      { id: "6", label: "D7", offset: { x: -70, y: 130 } },
      { id: "7", label: "~Q7", offset: { x: 70, y: 30 } },
      { id: "8", label: "GND", offset: { x: 0, y: 165 } },
      { id: "9", label: "Q7", offset: { x: 70, y: 10 } },
      { id: "10", label: "DS", offset: { x: -70, y: -10 } },
      { id: "11", label: "D0", offset: { x: -70, y: -10 } },
      { id: "12", label: "D1", offset: { x: -70, y: 10 } },
      { id: "13", label: "D2", offset: { x: -70, y: 30 } },
      { id: "14", label: "D3", offset: { x: -70, y: 50 } },
      { id: "15", label: "~CE", offset: { x: -70, y: -30 } },
      { id: "16", label: "VCC", offset: { x: 0, y: -105 } }
    ],
    defaultParams: { model: "74HC165" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC165",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
      subcircuitBody: `.subckt 74HC165 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n* 1=~PL 2=CP 3=D4 4=D5 5=D6 6=D7 7=~Q7 8=GND 9=Q7 10=DS 11=D0 12=D1 13=D2 14=D3 15=~CE 16=VCC\nB_Q7 9_i 8 V = (V(1,8) < 0.8 ? V(6,8) : (V(9,8) > 2.0 ? V(16,8) - 0.05 : 0.05))\nR_Q7 9_i 9 50\nB_NQ7 7_i 8 V = (V(9,8) > 2.0 ? 0.05 : V(16,8) - 0.05)\nR_NQ7 7_i 7 50\n.ends 74HC165`
    }
  },

  "74hc160": {
    type: "74hc160",
    name: "74HC160 4-Bit BCD Decade Counter",
    category: "digital_logic",
    package: "dip16",
    description: "Synchronous 4-bit BCD decade counter with asynchronous clear and ripple carry",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc16", "74hc160", "74160", "160", "counter", "bcd", "decade counter", "dip16", "logic"],
    pins: [
      { id: "1", label: "~MR", offset: { x: -70, y: -70 } },
      { id: "2", label: "CP", offset: { x: -70, y: -50 } },
      { id: "3", label: "D0", offset: { x: -70, y: -30 } },
      { id: "4", label: "D1", offset: { x: -70, y: -10 } },
      { id: "5", label: "D2", offset: { x: -70, y: 10 } },
      { id: "6", label: "D3", offset: { x: -70, y: 30 } },
      { id: "7", label: "CEP", offset: { x: -70, y: 50 } },
      { id: "8", label: "GND", offset: { x: 0, y: 105 } },
      { id: "9", label: "~PE", offset: { x: -70, y: 70 } },
      { id: "10", label: "CET", offset: { x: 70, y: -50 } },
      { id: "11", label: "Q3", offset: { x: 70, y: 50 } },
      { id: "12", label: "Q2", offset: { x: 70, y: 30 } },
      { id: "13", label: "Q1", offset: { x: 70, y: 10 } },
      { id: "14", label: "Q0", offset: { x: 70, y: -10 } },
      { id: "15", label: "TC", offset: { x: 70, y: -30 } },
      { id: "16", label: "VCC", offset: { x: 0, y: -105 } }
    ],
    defaultParams: { model: "74HC160" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC160",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
      subcircuitBody: `.subckt 74HC160 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n* 1=~MR 2=CP 3=D0 4=D1 5=D2 6=D3 7=CEP 8=GND 9=~PE 10=CET 11=Q3 12=Q2 13=Q1 14=Q0 15=TC 16=VCC\nB_TC 15_i 8 V = ((V(14,8) > 2.0 && V(11,8) > 2.0 && V(10,8) > 2.0) ? V(16,8) - 0.05 : 0.05)\nR_TC 15_i 15 50\nB_Q0 14_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(3,8) : (V(14,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q0 14_i 14 50\nB_Q1 13_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(4,8) : (V(13,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q1 13_i 13 50\nB_Q2 12_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(5,8) : (V(12,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q2 12_i 12 50\nB_Q3 11_i 8 V = (V(1,8) < 0.8 ? 0.05 : (V(9,8) < 0.8 ? V(6,8) : (V(11,8) > 2.0 ? V(16,8) - 0.05 : 0.05)))\nR_Q3 11_i 11 50\n.ends 74HC160`
    }
  },

  "74hc595": {
    type: "74hc595",
    name: "74HC595 8-Bit Shift Register + Latch",
    category: "digital_logic",
    package: "dip16",
    description: "8-bit serial-in parallel-out shift register with storage register and 3-state outputs",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc595", "74595", "595", "shift register", "latch", "serial", "led driver", "dip16", "logic"],
    pins: [
      { id: "1", label: "QB", offset: { x: 70, y: -50 } },
      { id: "2", label: "QC", offset: { x: 70, y: -30 } },
      { id: "3", label: "QD", offset: { x: 70, y: -10 } },
      { id: "4", label: "QE", offset: { x: 70, y: 10 } },
      { id: "5", label: "QF", offset: { x: 70, y: 30 } },
      { id: "6", label: "QG", offset: { x: 70, y: 50 } },
      { id: "7", label: "QH", offset: { x: 70, y: 70 } },
      { id: "8", label: "GND", offset: { x: 0, y: 125 } },
      { id: "9", label: "QH'", offset: { x: 70, y: 90 } },
      { id: "10", label: "~MR", offset: { x: -70, y: 30 } },
      { id: "11", label: "SHCP", offset: { x: -70, y: -30 } },
      { id: "12", label: "STCP", offset: { x: -70, y: -10 } },
      { id: "13", label: "~OE", offset: { x: -70, y: 10 } },
      { id: "14", label: "DS", offset: { x: -70, y: -50 } },
      { id: "15", label: "QA", offset: { x: 70, y: -70 } },
      { id: "16", label: "VCC", offset: { x: 0, y: -105 } }
    ],
    defaultParams: { model: "74HC595" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC595",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
      subcircuitBody: `.subckt 74HC595 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n* 1=QB 2=QC 3=QD 4=QE 5=QF 6=QG 7=QH 8=GND 9=QH' 10=~MR 11=SHCP 12=STCP 13=~OE 14=DS 15=QA 16=VCC\nB_QA 15_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(14,8)))\nR_QA 15_i 15 50\nB_QB 1_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(15,8)))\nR_QB 1_i 1 50\nB_QC 2_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(1,8)))\nR_QC 2_i 2 50\nB_QD 3_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(2,8)))\nR_QD 3_i 3 50\nB_QE 4_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(3,8)))\nR_QE 4_i 4 50\nB_QF 5_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(4,8)))\nR_QF 5_i 5 50\nB_QG 6_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(5,8)))\nR_QG 6_i 6 50\nB_QH 7_i 8 V = (V(13,8) > 2.0 ? 0 : (V(10,8) < 0.8 ? 0.05 : V(6,8)))\nR_QH 7_i 7 50\nB_QHP 9_i 8 V = (V(10,8) < 0.8 ? 0.05 : V(7,8))\nR_QHP 9_i 9 50\n.ends 74HC595`
    }
  },

  "74hc74": {
    type: "74hc74",
    name: "74HC74 Dual D-Type Flip-Flop",
    category: "digital_logic",
    package: "dip14",
    description: "Dual D-type positive-edge-triggered flip-flop with preset and clear",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc74", "7474", "flip-flop", "d-type", "d-flipflop", "latch", "dip14", "logic"],
    pins: [
      { id: "1", label: "1~CLR", offset: { x: -70, y: -50 } },
      { id: "2", label: "1D", offset: { x: -70, y: -30 } },
      { id: "3", label: "1CLK", offset: { x: -70, y: -10 } },
      { id: "4", label: "1~PRE", offset: { x: -70, y: 10 } },
      { id: "5", label: "1Q", offset: { x: 70, y: -40 } },
      { id: "6", label: "1~Q", offset: { x: 70, y: -20 } },
      { id: "7", label: "GND", offset: { x: 0, y: 125 } },
      { id: "8", label: "2~Q", offset: { x: 70, y: 40 } },
      { id: "9", label: "2Q", offset: { x: 70, y: 20 } },
      { id: "10", label: "2~PRE", offset: { x: -70, y: 30 } },
      { id: "11", label: "2CLK", offset: { x: -70, y: 50 } },
      { id: "12", label: "2D", offset: { x: -70, y: 70 } },
      { id: "13", label: "2~CLR", offset: { x: -70, y: 90 } },
      { id: "14", label: "VCC", offset: { x: 0, y: -85 } }
    ],
    defaultParams: { model: "74HC74" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC74",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"],
      subcircuitBody: `.subckt 74HC74 1 2 3 4 5 6 7 8 9 10 11 12 13 14\n* 1=1~CLR 2=1D 3=1CLK 4=1~PRE 5=1Q 6=1~Q 7=GND 8=2~Q 9=2Q 10=2~PRE 11=2CLK 12=2D 13=2~CLR 14=VCC\nB_Q1 5_i 7 V = (V(1,7) < 0.8 ? 0.05 : (V(4,7) < 0.8 ? V(14,7)-0.05 : (V(2,7) > 2.0 ? V(14,7)-0.05 : 0.05)))\nR_Q1 5_i 5 50\nB_NQ1 6_i 7 V = (V(5,7) > 2.0 ? 0.05 : V(14,7)-0.05)\nR_NQ1 6_i 6 50\nB_Q2 9_i 7 V = (V(13,7) < 0.8 ? 0.05 : (V(10,7) < 0.8 ? V(14,7)-0.05 : (V(12,7) > 2.0 ? V(14,7)-0.05 : 0.05)))\nR_Q2 9_i 9 50\nB_NQ2 8_i 7 V = (V(9,7) > 2.0 ? 0.05 : V(14,7)-0.05)\nR_NQ2 8_i 8 50\n.ends 74HC74`
    }
  },

  "74hc138": {
    type: "74hc138",
    name: "74HC138 3-to-8 Line Decoder",
    category: "digital_logic",
    package: "dip16",
    description: "3-to-8 line inverting decoder / demultiplexer with 3 enable inputs",
    manufacturer: "Texas Instruments / Nexperia",
    keywords: ["74hc138", "74138", "decoder", "demux", "demultiplexer", "3-to-8", "dip16", "logic"],
    pins: [
      { id: "1", label: "A0", offset: { x: -70, y: -70 } },
      { id: "2", label: "A1", offset: { x: -70, y: -50 } },
      { id: "3", label: "A2", offset: { x: -70, y: -30 } },
      { id: "4", label: "~E1", offset: { x: -70, y: -10 } },
      { id: "5", label: "~E2", offset: { x: -70, y: 10 } },
      { id: "6", label: "E3", offset: { x: -70, y: 30 } },
      { id: "7", label: "~Y7", offset: { x: 70, y: 50 } },
      { id: "8", label: "GND", offset: { x: 0, y: 105 } },
      { id: "9", label: "~Y6", offset: { x: 70, y: 30 } },
      { id: "10", label: "~Y5", offset: { x: 70, y: 10 } },
      { id: "11", label: "~Y4", offset: { x: 70, y: -10 } },
      { id: "12", label: "~Y3", offset: { x: 70, y: -30 } },
      { id: "13", label: "~Y2", offset: { x: 70, y: -50 } },
      { id: "14", label: "~Y1", offset: { x: 70, y: -70 } },
      { id: "15", label: "~Y0", offset: { x: 70, y: -90 } },
      { id: "16", label: "VCC", offset: { x: 0, y: -105 } }
    ],
    defaultParams: { model: "74HC138" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "74HC138",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
      subcircuitBody: `.subckt 74HC138 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n* 1=A0 2=A1 3=A2 4=~E1 5=~E2 6=E3 7=~Y7 8=GND 9=~Y6 10=~Y5 11=~Y4 12=~Y3 13=~Y2 14=~Y1 15=~Y0 16=VCC\nB_EN en 8 V = ((V(6,8) > 2.0 && V(4,8) < 0.8 && V(5,8) < 0.8) ? 1 : 0)\nB_Y0 15_i 8 V = ((V(en) > 0.5 && V(1,8)<0.8 && V(2,8)<0.8 && V(3,8)<0.8) ? 0.05 : V(16,8) - 0.05)\nR_0 15_i 15 50\nB_Y1 14_i 8 V = ((V(en) > 0.5 && V(1,8)>2.0 && V(2,8)<0.8 && V(3,8)<0.8) ? 0.05 : V(16,8) - 0.05)\nR_1 14_i 14 50\nB_Y2 13_i 8 V = ((V(en) > 0.5 && V(1,8)<0.8 && V(2,8)>2.0 && V(3,8)<0.8) ? 0.05 : V(16,8) - 0.05)\nR_2 13_i 13 50\nB_Y3 12_i 8 V = ((V(en) > 0.5 && V(1,8)>2.0 && V(2,8)>2.0 && V(3,8)<0.8) ? 0.05 : V(16,8) - 0.05)\nR_3 12_i 12 50\nB_Y4 11_i 8 V = ((V(en) > 0.5 && V(1,8)<0.8 && V(2,8)<0.8 && V(3,8)>2.0) ? 0.05 : V(16,8) - 0.05)\nR_4 11_i 11 50\nB_Y5 10_i 8 V = ((V(en) > 0.5 && V(1,8)>2.0 && V(2,8)<0.8 && V(3,8)>2.0) ? 0.05 : V(16,8) - 0.05)\nR_5 10_i 10 50\nB_Y6 9_i 8 V = ((V(en) > 0.5 && V(1,8)<0.8 && V(2,8)>2.0 && V(3,8)>2.0) ? 0.05 : V(16,8) - 0.05)\nR_6 9_i 9 50\nB_Y7 7_i 8 V = ((V(en) > 0.5 && V(1,8)>2.0 && V(2,8)>2.0 && V(3,8)>2.0) ? 0.05 : V(16,8) - 0.05)\nR_7 7_i 7 50\n.ends 74HC138`
    }
  },

  cd4017: {
    type: "cd4017",
    name: "CD4017 Decade Counter / Divider",
    category: "digital_logic",
    package: "dip16",
    description: "5-stage Johnson decade counter with 10 decoded active-HIGH outputs",
    manufacturer: "Texas Instruments",
    keywords: ["cd4017", "4017", "74hc4017", "decade counter", "sequencer", "johnson counter", "dip16", "logic"],
    pins: [
      { id: "1", label: "Q5", offset: { x: 70, y: 10 } },
      { id: "2", label: "Q1", offset: { x: 70, y: -70 } },
      { id: "3", label: "Q0", offset: { x: 70, y: -90 } },
      { id: "4", label: "Q2", offset: { x: 70, y: -50 } },
      { id: "5", label: "Q6", offset: { x: 70, y: 30 } },
      { id: "6", label: "Q7", offset: { x: 70, y: 50 } },
      { id: "7", label: "Q3", offset: { x: 70, y: -30 } },
      { id: "8", label: "GND", offset: { x: 0, y: 145 } },
      { id: "9", label: "Q8", offset: { x: 70, y: 70 } },
      { id: "10", label: "Q4", offset: { x: 70, y: -10 } },
      { id: "11", label: "Q9", offset: { x: 70, y: 90 } },
      { id: "12", label: "CO", offset: { x: 70, y: 110 } },
      { id: "13", label: "~CP1", offset: { x: -70, y: 10 } },
      { id: "14", label: "CP0", offset: { x: -70, y: -10 } },
      { id: "15", label: "MR", offset: { x: -70, y: -30 } },
      { id: "16", label: "VDD", offset: { x: 0, y: -125 } }
    ],
    defaultParams: { model: "CD4017" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "CD4017",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
      subcircuitBody: `.subckt CD4017 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n* 3=Q0 2=Q1 4=Q2 7=Q3 10=Q4 1=Q5 5=Q6 6=Q7 9=Q8 11=Q9 12=CO 16=VDD 8=GND 15=MR 14=CP0 13=~CP1\nB_Q0 3_i 8 V = (V(15,8) > 2.0 ? V(16,8)-0.05 : (V(3,8) > 2.0 ? V(16,8)-0.05 : 0.05))\nR_0 3_i 3 50\n.ends CD4017`
    }
  },

  lm393: {
    type: "lm393",
    name: "LM393 Dual Voltage Comparator",
    category: "analog_ic",
    package: "dip8",
    description: "Low-power dual independent precision voltage comparators with open-collector outputs",
    manufacturer: "Texas Instruments / ON Semi",
    keywords: ["lm393", "393", "comparator", "voltage comparator", "dual", "analog", "dip8"],
    pins: [
      { id: "1", label: "1OUT", offset: { x: 70, y: -30 } },
      { id: "2", label: "1IN-", offset: { x: -70, y: -20 } },
      { id: "3", label: "1IN+", offset: { x: -70, y: -40 } },
      { id: "4", label: "GND", offset: { x: 0, y: 75 } },
      { id: "5", label: "2IN+", offset: { x: -70, y: 20 } },
      { id: "6", label: "2IN-", offset: { x: -70, y: 40 } },
      { id: "7", label: "2OUT", offset: { x: 70, y: 30 } },
      { id: "8", label: "VCC", offset: { x: 0, y: -75 } }
    ],
    defaultParams: { model: "LM393" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "LM393",
      pinOrder: ["1", "2", "3", "4", "5", "6", "7", "8"],
      subcircuitBody: `.subckt LM393 1 2 3 4 5 6 7 8\n* 1=1OUT 2=1IN- 3=1IN+ 4=GND 5=2IN+ 6=2IN- 7=2OUT 8=VCC\nB_1 1_i 4 V = (V(3,2) > 0 ? V(8,4) - 0.1 : 0.05)\nR_1 1_i 1 25\nB_2 7_i 4 V = (V(5,6) > 0 ? V(8,4) - 0.1 : 0.05)\nR_2 7_i 7 25\n.ends LM393`
    }
  },

  lm317: {
    type: "lm317",
    name: "LM317 Adjustable Regulator",
    category: "power",
    package: "to220",
    description: "3-terminal adjustable positive linear voltage regulator (1.2V to 37V, up to 1.5A)",
    manufacturer: "Texas Instruments / ON Semi",
    keywords: ["lm317", "317", "regulator", "voltage regulator", "adjustable", "linear", "power", "to220"],
    pins: [
      { id: "1", label: "ADJ", offset: { x: 0, y: 35 } },
      { id: "2", label: "OUT", offset: { x: 70, y: -10 } },
      { id: "3", label: "IN", offset: { x: -70, y: -10 } }
    ],
    defaultParams: { model: "LM317" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "LM317",
      pinOrder: ["1", "2", "3"],
      subcircuitBody: `.subckt LM317 1 2 3\n* 1=ADJ 2=OUT 3=IN\nRin 3 2 1Meg\nB_reg 2_int 1 V = 1.25\nRout 2_int 2 0.05\nCout 2 1 0.1u\n.ends LM317`
    }
  },

  lm741: {
    type: "lm741",
    name: "LM741 General Purpose Op-Amp",
    category: "analog_ic",
    package: "dip8",
    description: "Classic general-purpose single operational amplifier with internal frequency compensation",
    manufacturer: "Texas Instruments",
    keywords: ["opamp", "amplifier", "analog", "741", "lm741"],
    pins: [
      { id: "1", label: "OF1", offset: { x: -70, y: -30 } },
      { id: "2", label: "IN-", offset: { x: -70, y: -10 } },
      { id: "3", label: "IN+", offset: { x: -70, y: 10 } },
      { id: "4", label: "V-", offset: { x: 0, y: 55 } },
      { id: "5", label: "OF2", offset: { x: 70, y: 20 } },
      { id: "6", label: "OUT", offset: { x: 70, y: 0 } },
      { id: "7", label: "V+", offset: { x: 0, y: -55 } },
      { id: "8", label: "NC", offset: { x: 70, y: -20 } }
    ],
    defaultParams: { model: "LM741" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "LM741",
      pinOrder: ["3", "2", "7", "4", "6"],
      subcircuitBody: `.subckt LM741 3 2 7 4 6\n* 3=IN+ 2=IN- 7=V+ 4=V- 6=OUT\nRin 3 2 2Meg\nE1 6_i 0 3 2 200k\nRout 6_i 6 75\n.ends LM741`
    }
  },

  lm324: {
    type: "lm324",
    name: "LM324 Quad Op-Amp",
    category: "analog_ic",
    package: "dip14",
    description: "Low-power quad operational amplifier operating from single or split power supplies",
    manufacturer: "Texas Instruments / STMicroelectronics",
    keywords: ["opamp", "quad", "amplifier", "analog", "lm324", "single-supply"],
    pins: [
      { id: "1", label: "1OUT", offset: { x: 70, y: -50 } },
      { id: "2", label: "1IN-", offset: { x: -70, y: -50 } },
      { id: "3", label: "1IN+", offset: { x: -70, y: -30 } },
      { id: "4", label: "VCC", offset: { x: 0, y: -85 } },
      { id: "5", label: "2IN+", offset: { x: -70, y: -10 } },
      { id: "6", label: "2IN-", offset: { x: -70, y: 10 } },
      { id: "7", label: "2OUT", offset: { x: 70, y: -10 } },
      { id: "8", label: "3OUT", offset: { x: 70, y: 10 } },
      { id: "9", label: "3IN-", offset: { x: -70, y: 30 } },
      { id: "10", label: "3IN+", offset: { x: -70, y: 50 } },
      { id: "11", label: "GND", offset: { x: 0, y: 125 } },
      { id: "12", label: "4IN+", offset: { x: -70, y: 70 } },
      { id: "13", label: "4IN-", offset: { x: -70, y: 90 } },
      { id: "14", label: "4OUT", offset: { x: 70, y: 50 } }
    ],
    defaultParams: { model: "LM324" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "LM324",
      pinOrder: ["3", "2", "1", "5", "6", "7", "10", "9", "8", "12", "13", "14", "4", "11"],
      subcircuitBody: `.subckt LM324 3 2 1 5 6 7 10 9 8 12 13 14 4 11\n* 4=VCC 11=GND\nE1 1 0 3 2 100k\nE2 7 0 5 6 100k\nE3 8 0 10 9 100k\nE4 14 0 12 13 100k\nR1 3 2 10Meg\nR2 5 6 10Meg\nR3 10 9 10Meg\nR4 12 13 10Meg\n.ends LM324`
    }
  },

  lm7812: {
    type: "lm7812",
    name: "LM7812 +12V Regulator",
    category: "power",
    package: "to220",
    description: "3-terminal positive voltage regulator, 12V output up to 1.5A",
    manufacturer: "STMicroelectronics / ON Semi",
    keywords: ["regulator", "voltage", "power", "7812", "12v", "to-220"],
    pins: [
      { id: "1", label: "IN", offset: { x: -70, y: -10 } },
      { id: "2", label: "GND", offset: { x: 0, y: 35 } },
      { id: "3", label: "OUT", offset: { x: 70, y: -10 } }
    ],
    defaultParams: { model: "LM7812" },
    spice: {
      prefix: "X",
      modelType: "subcircuit",
      subcircuitName: "LM7812",
      pinOrder: ["1", "2", "3"],
      subcircuitBody: `.subckt LM7812 1 2 3\n* 1=IN 2=GND 3=OUT\nRin 1 2 1Meg\nB1 3_int 2 V = (V(1,2) > 14.5 ? 12.0 : (V(1,2) > 2.0 ? V(1,2) - 2.5 : 0))\nRout 3_int 3 0.05\nCout 3 2 0.1u\n.ends LM7812`
    }
  },

  oscilloscope: {
    type: "oscilloscope",
    name: "Oscilloscope",
    category: "instruments",
    package: "custom",
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
    category: "instruments",
    package: "custom",
    pins: [
      { id: "1", label: "V/A/Ω", offset: { x: -22, y: 48 } },
      { id: "2", label: "COM", offset: { x: 22, y: 48 } },
    ],
    defaultParams: { mode: "voltage" }
  },
  current_probe: {
    type: "current_probe",
    name: "Current Probe",
    category: "instruments",
    package: "custom",
    pins: [
      { id: "in", label: "IN", offset: { x: 0, y: -20 } },
      { id: "out", label: "OUT", offset: { x: 0, y: 20 } },
      { id: "scope", label: "SCOPE", offset: { x: 20, y: 0 } },
    ],
    defaultParams: {}
  },
  pushbutton: {
    type: "pushbutton",
    name: "Push Button",
    category: "inputs",
    package: "discrete",
    pins: [
      { id: "1", label: "L1", offset: { x: -20, y: -20 } },
      { id: "2", label: "L2", offset: { x: -20, y: 20 } },
      { id: "3", label: "R1", offset: { x: 20, y: -20 } },
      { id: "4", label: "R2", offset: { x: 20, y: 20 } },
    ],
    defaultParams: { state: "open" }
  },
  breadboard: {
    type: "breadboard",
    name: "Breadboard",
    category: "custom",
    package: "custom",
    pins: [],
    defaultParams: {}
  }
};
