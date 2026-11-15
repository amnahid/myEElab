import { Circuit, ComponentInstance, Wire, Point } from "../models/circuit";
import { ComponentLibrary } from "../engine/library";
import JSZip from "jszip";

/**
 * Parses a standard SPICE netlist (exported by Proteus) into a Circuit graph.
 * Note: Since SPICE netlists do not contain layout information (X/Y coordinates),
 * this parser arranges components in a simple grid and connects nets directly.
 */
export function parseProteusNetlist(netlistContent: string, circuitName: string = "Imported Circuit"): Circuit {
  const lines = netlistContent.split(/\r?\n/);
  
  const components: ComponentInstance[] = [];
  const wires: Wire[] = [];
  
  // Map of node names to a central point where all wires for that node will connect
  const nodePoints: Record<string, Point> = {};
  
  let componentCount = 0;
  
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("*") || line.startsWith(".")) {
      // Ignore comments and directives for basic layout mapping
      continue;
    }
    
    // Simple SPICE line parser: RefDes Node1 Node2 ... Value
    const parts = line.split(/\s+/);
    if (parts.length < 4) continue;
    
    const refDes = parts[0].toUpperCase();
    const prefix = refDes.charAt(0);
    
    let type = "";
    let params: Record<string, string | number> = {};
    let nodes: string[] = [];
    
    if (prefix === "R") {
      type = "resistor";
      nodes = [parts[1], parts[2]];
      params.resistance = parseValue(parts[3]);
    } else if (prefix === "C") {
      type = "capacitor";
      nodes = [parts[1], parts[2]];
      params.capacitance = parseValue(parts[3]);
    } else if (prefix === "L") {
      type = "inductor";
      nodes = [parts[1], parts[2]];
      params.inductance = parseValue(parts[3]);
    } else if (prefix === "V") {
      nodes = [parts[1], parts[2]];
      if (line.toUpperCase().includes("PULSE")) {
        type = "clock";
        const pulseMatch = line.match(/PULSE\s*\(\s*([^)]+)\s*\)/i);
        if (pulseMatch) {
          const pArgs = pulseMatch[1].trim().split(/\s+/);
          if (pArgs.length >= 7) {
            params.vlow = pArgs[0];
            params.vhigh = pArgs[1];
            params.delay = pArgs[2];
            params.trise = pArgs[3];
            params.tfall = pArgs[4];
            const ton = parseNumericSpice(pArgs[5]);
            const tperiod = parseNumericSpice(pArgs[6]);
            if (tperiod > 0) {
              const freq = Math.round(1 / tperiod);
              params.frequency = freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${freq}`;
              params.duty = Math.round((ton / tperiod) * 100).toString();
            }
          }
        }
      } else {
        type = "vsource";
        params.voltage = parseValue(parts[parts.length - 1]);
      }
    } else if (prefix === "I") {
      type = "isource";
      nodes = [parts[1], parts[2]];
      params.current = parseValue(parts[parts.length - 1]);
    } else if (prefix === "D") {
      type = "diode";
      nodes = [parts[1], parts[2]];
      params.model = parts[3] || "1N4148";
    } else if (prefix === "Q") {
      type = "npn";
      nodes = [parts[1], parts[2], parts[3]];
      params.model = parts[4] || "2N3904";
    } else if (prefix === "M") {
      type = "nmos";
      nodes = [parts[1], parts[2], parts[3], parts[4]];
      params.model = parts[5] || "BS170";
    } else if (prefix === "X" || prefix === "U") {
      const modelToken = parts[parts.length - 1].toUpperCase();
      nodes = parts.slice(1, parts.length - 1);
      if (modelToken.includes("555")) {
        type = "ne555";
      } else if (modelToken.includes("7805")) {
        type = "lm7805";
      } else if (modelToken.includes("7400") || modelToken.includes("74HC00")) {
        type = "74hc00";
      } else if (modelToken.includes("7404") || modelToken.includes("74HC04")) {
        type = "74hc04";
      } else if (modelToken.includes("7408") || modelToken.includes("74HC08")) {
        type = "74hc08";
      } else if (modelToken.includes("7432") || modelToken.includes("74HC32")) {
        type = "74hc32";
      } else if (modelToken.includes("TL072")) {
        type = "tl072";
      } else {
        type = "opamp";
        params.model = modelToken;
      }
    } else {
      // Unknown or unhandled component
      continue;
    }
    
    // Assign a naive grid position
    const position = { x: 100 + (componentCount % 5) * 150, y: 100 + Math.floor(componentCount / 5) * 150 };
    
    const comp: ComponentInstance = {
      id: generateId("comp"),
      type,
      position,
      rotation: 0,
      mirrored: false,
      params,
      refDes
    };
    
    components.push(comp);
    
    // Basic auto-routing logic: Connect pins to a shared node coordinate
    // For simplicity, pin 1 is at (-30, 0) and pin 2 is at (30, 0) relative to component
    const pinOffsets = [{ x: -30, y: 0 }, { x: 30, y: 0 }];
    
    nodes.forEach((nodeName, index) => {
      if (!nodePoints[nodeName]) {
        // First time seeing this node, place its junction point arbitrarily (e.g. above the component)
        nodePoints[nodeName] = { x: position.x, y: position.y - 50 };
      }
      
      const pinAbsPosition = {
        x: position.x + (pinOffsets[index]?.x || 0),
        y: position.y + (pinOffsets[index]?.y || 0)
      };
      
      wires.push({
        id: generateId("wire"),
        points: [pinAbsPosition, nodePoints[nodeName]]
      });
    });
    
    componentCount++;
  }
  
  // Ground node '0' requires a ground component in schematic
  if (nodePoints["0"]) {
     components.push({
        id: generateId("comp"),
        type: "ground",
        position: nodePoints["0"],
        rotation: 0,
        mirrored: false,
        params: {}
     });
  }

  return {
    id: generateId("circuit"),
    name: circuitName,
    components,
    wires,
    analyses: [
      { kind: 'op', params: {} },
      { kind: 'tran', params: { step: '1m', stop: '10m' } },
      { kind: 'ac', params: { variation: 'dec', points: '10', fstart: '1', fstop: '10k' } }
    ] // Will default to whatever the editor sets up
  };
}

function parseNumericSpice(val: string): number {
  const match = val.match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)(.*)$/);
  if (!match) return parseFloat(val) || 0;
  const num = parseFloat(match[1]);
  const suffix = match[2].trim().toLowerCase();
  switch (suffix) {
    case 't': return num * 1e12;
    case 'g': return num * 1e9;
    case 'meg': return num * 1e6;
    case 'k': return num * 1e3;
    case 'm': return num * 1e-3;
    case 'u': return num * 1e-6;
    case 'n': return num * 1e-9;
    case 'p': return num * 1e-12;
    case 'f': return num * 1e-15;
    default: return num;
  }
}

function parseValue(val: string): string {
  // Returns raw string; ngspice can parse '1k', '1u', etc.
  return val;
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Advanced heuristic binary parser for Proteus .pdsprj archives.
 * Extracts actual graphical X/Y layout coordinates for components and wires.
 */
export async function parsePdsprjExperimental(buffer: ArrayBuffer, circuitName: string = "Imported Circuit", options?: { componentsOnly?: boolean }): Promise<Circuit> {
  const zip = new JSZip();
  let components: ComponentInstance[] = [];
  let wires: Wire[] = [];
  const unparsedRefs: string[] = [];
  
  try {
    const contents = await zip.loadAsync(buffer);
    
    // Proteus stores the schematic in ROOT.DSN
    const dsnFile = contents.file("ROOT.DSN");
    if (!dsnFile) {
      throw new Error("ROOT.DSN not found in archive");
    }
    
    const dsnBuffer = await dsnFile.async("arraybuffer");
    const view = new DataView(dsnBuffer);
    const bytes = new Uint8Array(dsnBuffer);
    
    // Helper to read ASCII
    // const readAscii = (offset: number, len: number) => {
    //   let str = "";
    //   for (let i = 0; i < len; i++) {
    //     str += String.fromCharCode(bytes[offset + i]);
    //   }
    //   return str;
    // };
    
    // 1. Extract Wires
    let i = 0;
    
    
    // 1. Extract Wires
    if (!options?.componentsOnly) {
      while (i < bytes.length - 10) {
        if (bytes[i] === 0x57 && bytes[i+1] === 0x49 && bytes[i+2] === 0x52 && bytes[i+3] === 0x45 && bytes[i+4] === 0x00) {
          i += 5;
          if (bytes[i] === 0x00 && bytes[i+1] === 0x00) {
              const numPoints = view.getUint16(i+2, true);
              i += 4;
              if (numPoints > 0 && numPoints < 100) {
                  const wirePoints: Point[] = [];
                  for (let p = 0; p < numPoints && i < bytes.length - 8; p++) {
                    const x = (view.getInt32(i, true) / 254000) * 20;
                    const y = (view.getInt32(i+4, true) / 254000) * 20;
                    wirePoints.push({ x, y });
                    i += 8;
                  }
                  wires.push({ id: generateId("wire"), points: wirePoints });
              }
          } else { i++; }
        } else { i++; }
      }
    }
    
    // 2. Extract Components
    i = 0;
    let lastRef: string | null = null;
    let lastRotByte = 0;
    while (i < bytes.length - 10) {
      if (bytes[i] === 0xFF && (bytes[i+1] > 0 && bytes[i+1] < 30)) {
        const len = bytes[i+1];
        let isAscii = true;
        for(let j=0; j<len; j++) {
           if(bytes[i+2+j] < 32 || bytes[i+2+j] > 126) isAscii = false;
        }
        
        if (isAscii && i+2+len+8 <= bytes.length) {
          const str = new TextDecoder("ascii").decode(bytes.slice(i+2, i+2+len));
          
          if (/^[A-Za-z]+\d+$/.test(str)) {
             lastRef = str;
             lastRotByte = bytes[i+2+len+10];
          } else if (["RESISTOR", "CAPACITOR", "NPN", "DIODE", "ALTERNATOR", "BATTERY", "2N2222", "1N4148", "$IDC VOLTMETER", "$IDC AMMETER", "$IAC VOLTMETER", "$IAC AMMETER", "$IOSCILLOSCOPE", "GROUND", "GND", "$DCGEN", "$DCGN", "SINEWAVE", "VCC", "VSINE", "VSOURCE", "BATTERY", "TERMINAL", "$TEROUTPUT", "SlowSine", "FastSine", "555", "NE555", "7805", "LM7805", "7400", "74HC00", "7404", "74HC04", "7408", "74HC08", "7432", "74HC32", "TL072", "LM358"].includes(str)) {
             const rawX = (view.getInt32(i+2+len, true) / 254000) * 20;
             const rawY = (view.getInt32(i+2+len+4, true) / 254000) * 20;
             
             let cx = rawX, cy = rawY;
             let rotation = ((lastRotByte === 2) ? 0 : 90) as 0 | 90 | 180 | 270; // myEElab 0 is vertical
             
             // Apply precise hardcoded binary offsets discovered via deep analysis
             if (str === "RESISTOR") {
                 if (lastRotByte === 0) { cx += 31.6; cy += 29.6; }
                 else { cx -= 19.6; cy += 18.4; }
             } else if (str === "CAPACITOR") {
                 if (lastRotByte === 0) { cx += 21.6; cy += 41.6; }
                 else { cx -= 18.4; cy += 1.6; }
             } else if (str === "2N2222" || str === "NPN") {
                 cx -= 11.6; cy -= 11.6;
             } else if (str.includes("METER")) {
                 cx -= 11.6; cy -= 11.6; // Approximation for instruments
             } else if (str === "$IOSCILLOSCOPE") {
                 cx += 40; cy += 40; // Approx center for oscilloscope
             }
             
             let type = "resistor";
             let params: Record<string, string | number> = {};
             
             if (str === "$IOSCILLOSCOPE") { type = "oscilloscope"; }
             else if (str === "GROUND" || str === "GND" || str === "$DCGEN" || str === "$DCGN" || str === "$TEROUTPUT" || (str === "TERMINAL" && lastRef === "GROUND")) { type = "ground"; }
             else if (str === "TERMINAL" && lastRef === "VCC") { type = "vsource"; params.voltage = 5; }
             else if (str === "TERMINAL") { type = "ground"; /* default terminal to ground if unknown */ }
             else if (str === "SINEWAVE" || str === "ALTERNATOR" || str === "VSINE" || str === "SlowSine" || str === "FastSine") { type = "function_generator"; }
             else if (str === "VCC" || str === "BATTERY") { type = "vsource"; params.voltage = 9; }
             else if (str.includes("VOLTMETER")) { type = "multimeter"; params.mode = "voltage"; }
             else if (str.includes("AMMETER")) { type = "multimeter"; params.mode = "current"; }
             else if (str === "CAPACITOR" || (lastRef || "").startsWith("C")) { type = "capacitor"; params.capacitance = "1u"; }
             else if ((lastRef || "").startsWith("V")) { type = "vsource"; params.voltage = 5; }
             else if ((lastRef || "").startsWith("L")) { type = "inductor"; params.inductance = "1m"; }
             else if (str === "DIODE" || str === "1N4148" || (lastRef || "").startsWith("D")) { type = "diode"; params.model = "1N4148"; }
             else if (str === "NPN" || str === "2N2222" || (lastRef || "").startsWith("Q")) { type = "npn"; params.model = "2N2222"; }
             else if ((lastRef || "").startsWith("I")) { type = "isource"; params.current = "1m"; }
             else if (str === "RESISTOR") { type = "resistor"; params.resistance = "10k"; }
             else if (str === "555" || str === "NE555") { type = "ne555"; }
             else if (str === "7805" || str === "LM7805") { type = "lm7805"; }
             else if (str === "7812" || str === "LM7812") { type = "lm7812"; }
             else if (str === "7400" || str === "74HC00") { type = "74hc00"; }
             else if (str === "7402" || str === "74HC02") { type = "74hc02"; }
             else if (str === "7404" || str === "74HC04") { type = "74hc04"; }
             else if (str === "7408" || str === "74HC08") { type = "74hc08"; }
             else if (str === "7432" || str === "74HC32") { type = "74hc32"; }
             else if (str === "7486" || str === "74HC86") { type = "74hc86"; }
             else if (str === "TL072") { type = "tl072"; }
             else if (str === "LM358" || str === "OPAMP") { type = "opamp"; }
             else if (str === "741" || str === "LM741") { type = "lm741"; }
             else if (str === "324" || str === "LM324") { type = "lm324"; }
             else if (str === "161" || str === "74161" || str === "74HC161") { type = "74hc161"; }
             else if (str === "163" || str === "74163" || str === "74HC163") { type = "74hc163"; }
             else if (str === "160" || str === "74160" || str === "74HC160") { type = "74hc160"; }
             else if (str === "164" || str === "74164" || str === "74HC164") { type = "74hc164"; }
             else if (str === "165" || str === "74165" || str === "74HC165") { type = "74hc165"; }
             else if (str === "595" || str === "74595" || str === "74HC595") { type = "74hc595"; }
             else if (str === "74" || str === "7474" || str === "74HC74") { type = "74hc74"; }
             else if (str === "138" || str === "74138" || str === "74HC138") { type = "74hc138"; }
             else if (str === "4017" || str === "CD4017") { type = "cd4017"; }
             else if (str === "393" || str === "LM393") { type = "lm393"; }
             else if (str === "317" || str === "LM317") { type = "lm317"; }
             else if (str === "CLOCK" || str === "DCLOCK" || str === "PULSE" || str.includes("DCLOCK")) {
               type = "clock";
               params = { frequency: "1k", vhigh: "5", vlow: "0", duty: "50" };
             }
             
             components.push({
               id: generateId("comp"),
               type,
               position: { x: cx, y: cy },
               rotation,
               mirrored: false,
               params,
               refDes: lastRef || str
             });
             
             lastRef = null;
          } else if (["$MKDECREMENT", "$MKLABEL", "$MKPINNAME"].includes(str)) {
              // Decorative markers — silently ignore, not real components
          } else if (["TEXT"].includes(str)) {
              // Known unsupported components
              unparsedRefs.push(`Unsupported: "${str}"${lastRef ? ` (ref: ${lastRef})` : ''}`);
              lastRef = null;
          } else if (/^[A-Z$]/.test(str) && str.length > 1 && !str.includes('\0')) {
              // Unknown string that looks like a component name — log it so user can see what we missed
              unparsedRefs.push(`Unknown: "${str}"${lastRef ? ` (ref: ${lastRef})` : ''}`);
          }
          i += 2 + len + 8;
        } else { i++; }
      } else { i++; }
    }
    
    // 3. Post-process: Triangulation & Wire Gap Filling
    // Since our extracted component coordinates are actually the RefDes text label coordinates,
    // they are slightly off from the true center. We triangulate the true center using the wire endpoints!
    const exactProteusMap: Record<string, { dx: number, dy: number, myPinId: string }[]> = {
        "clock": [
            { dx: 0, dy: -50, myPinId: "1" }, { dx: 0, dy: 50, myPinId: "2" }
        ],
        "resistor": [
            { dx: 0, dy: -50, myPinId: "1" }, { dx: 0, dy: 50, myPinId: "2" }
        ],
        "capacitor": [
            { dx: 0, dy: -40, myPinId: "1" }, { dx: 0, dy: 40, myPinId: "2" }
        ],
        "npn": [
            { dx: -60, dy: 0, myPinId: "b" }, { dx: 0, dy: -60, myPinId: "c" }, { dx: 0, dy: 60, myPinId: "e" }
        ],
        "diode": [
            { dx: 0, dy: -50, myPinId: "1" }, { dx: 0, dy: 50, myPinId: "2" }
        ],
        "oscilloscope": [
            { dx: -80, dy: -60, myPinId: "1" }, { dx: -80, dy: -20, myPinId: "3" },
            { dx: -80, dy: 20, myPinId: "5" }, { dx: -80, dy: 60, myPinId: "7" }
        ],
        "multimeter": [
            { dx: 0, dy: -50, myPinId: "1" }, { dx: 0, dy: 50, myPinId: "2" }
        ],
        "ground": [
            { dx: 0, dy: -50, myPinId: "1" }
        ],
        "vsource": [
            { dx: 0, dy: -50, myPinId: "1" }, { dx: 0, dy: 50, myPinId: "2" }
        ],
        "function_generator": [
            { dx: 0, dy: -50, myPinId: "1" }, { dx: 0, dy: 50, myPinId: "2" }
        ]
    };

    components.forEach(comp => {
      const def = ComponentLibrary[comp.type];
      if (!def) return;
      
      const exactPins = exactProteusMap[comp.type];
      if (!exactPins) return;
      
      const angle = (comp.rotation * Math.PI) / 180;
      
      // Step A: Find all wires that heuristic-snap to this component's text-label-based pins
      const connectedPins: { ep: any, wire: Wire, isFirst: boolean, pt: Point }[] = [];
      
      const potentialMatches: { ep: any, wire: Wire, isFirst: boolean, pt: Point, dist: number }[] = [];
      
      exactPins.forEach(ep => {
          let rotDx = ep.dx * Math.cos(angle) - ep.dy * Math.sin(angle);
          let rotDy = ep.dx * Math.sin(angle) + ep.dy * Math.cos(angle);
          
          const assumedX = comp.position.x + rotDx;
          const assumedY = comp.position.y + rotDy;
          
          wires.forEach(wire => {
             if (wire.points.length < 2) return;
             const first = wire.points[0];
             const last = wire.points[wire.points.length - 1];
             
             const distFirst = Math.hypot(first.x - assumedX, first.y - assumedY);
             const distLast = Math.hypot(last.x - assumedX, last.y - assumedY);
             
             if (distFirst <= 150) potentialMatches.push({ ep, wire, isFirst: true, pt: first, dist: distFirst });
             if (distLast <= 150) potentialMatches.push({ ep, wire, isFirst: false, pt: last, dist: distLast });
          });
      });
      
      // Greedy closest-first matching to prevent 1 wire snapping to 2 pins
      potentialMatches.sort((a, b) => a.dist - b.dist);
      const usedPins = new Set();
      const usedEndpoints = new Set();
      
      potentialMatches.forEach(match => {
          const endpointId = `${match.wire.id}-${match.isFirst ? 'start' : 'end'}`;
          if (!usedPins.has(match.ep.myPinId) && !usedEndpoints.has(endpointId)) {
              usedPins.add(match.ep.myPinId);
              usedEndpoints.add(endpointId);
              connectedPins.push(match);
          }
      });
      
      // Step B: Triangulate the TRUE component center
      if (connectedPins.length > 0) {
          let sumCx = 0, sumCy = 0;
          connectedPins.forEach(c => {
              let rotDx = c.ep.dx;
              let rotDy = c.ep.dy;
              if (true) {
                  rotDx = c.ep.dx * Math.cos(angle) - c.ep.dy * Math.sin(angle);
                  rotDy = c.ep.dx * Math.sin(angle) + c.ep.dy * Math.cos(angle);
              }
              sumCx += (c.pt.x - rotDx);
              sumCy += (c.pt.y - rotDy);
          });
          comp.position.x = sumCx / connectedPins.length;
          comp.position.y = sumCy / connectedPins.length;
      }
      
      // Step C: Move the wire endpoints to the myEElab pin coordinates
      connectedPins.forEach(c => {
          const myPin = def.pins.find((p: any) => p.id === c.ep.myPinId);
          if (myPin) {
             const absPinX = comp.position.x + (myPin.offset.x * Math.cos(angle) - myPin.offset.y * Math.sin(angle));
             const absPinY = comp.position.y + (myPin.offset.x * Math.sin(angle) + myPin.offset.y * Math.cos(angle));
             
             const pt = c.pt;
             const dx = absPinX - pt.x;
             const dy = absPinY - pt.y;
             
             if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                 pt.x = absPinX; pt.y = absPinY;
                 return;
             }
             
             const prevPt = c.isFirst ? c.wire.points[1] : c.wire.points[c.wire.points.length - 2];
             const isVertical = Math.abs(pt.x - prevPt.x) < 1;
             
             const newPoints = [];
             if (Math.abs(dx) > 1 && Math.abs(dy) > 1) {
                 if (isVertical) {
                     newPoints.push({ x: pt.x, y: absPinY });
                 } else {
                     newPoints.push({ x: absPinX, y: pt.y });
                 }
             }
             newPoints.push({ x: absPinX, y: absPinY });
             
             if (c.isFirst) {
                 c.wire.points.unshift(...newPoints.reverse());
             } else {
                 c.wire.points.push(...newPoints);
             }
          }
      });
      
      // Force component to nearest 20px grid to look perfect
      comp.position.x = Math.round(comp.position.x / 20) * 20;
      comp.position.y = Math.round(comp.position.y / 20) * 20;
    });
    
    } catch (err: any) {
    console.error("Failed to parse .pdsprj as zip archive", err);
    window.alert("Parse error: " + (err.message || err.toString()));
    throw new Error("Invalid or unsupported .pdsprj format");
  }

  const warnings = unparsedRefs.length > 0 
      ? Array.from(new Set(unparsedRefs))
      : undefined;

  return {
    id: generateId("circuit"),
    warnings,
    name: circuitName,
    components,
    wires,
    analyses: [
      { kind: 'op', params: {} },
      { kind: 'tran', params: { step: '1m', stop: '10m' } },
      { kind: 'ac', params: { variation: 'dec', points: '10', fstart: '1', fstop: '10k' } }
    ]
  };
}
