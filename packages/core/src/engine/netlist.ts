import { Circuit } from "../models/circuit";
import { NodeResolver } from "./nodeResolver";
import { deriveBreadboardWires } from "./breadboardSync";
import { useEditorStore } from "../store/editorStore";

function parseSpiceValue(val: string | number): number {
  if (typeof val === 'number') return val;
  const match = val.toString().match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)(.*)$/);
  if (!match) return 0;
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

export class NetlistGenerator {
  public generate(circuit: Circuit, activeAnalysis: string = 'op'): string {
    const lines: string[] = [];
    lines.push(`* ${circuit.name || "LiveSpice Circuit"}`);

    const derivedWires = deriveBreadboardWires(circuit);
    const combinedCircuit = {
      ...circuit,
      wires: [...circuit.wires, ...derivedWires]
    };

    const resolver = new NodeResolver();
    const nodeMap = resolver.resolve(combinedCircuit).components;

    // Track refDes counters to assign them if absent
    const counters: Record<string, number> = {};
    const usedRefDes = new Set<string>();

    const showInstruments = useEditorStore.getState().showInstruments;

    for (const comp of circuit.components) {
      if (comp.type === "ground" || comp.type === "breadboard") continue;
      
      if (comp.type === "oscilloscope") {
        const pins = nodeMap.get(comp.id);
        if (pins) {
          for (const [pinId, nodeName] of pins.entries()) {
             if (nodeName !== "0") {
               lines.push(`R_OSC_${comp.id.replace(/-/g, '')}_${pinId} ${nodeName} 0 1G`);
             }
          }
        }
        continue;
      }
      // Exclude passive instruments from simulation if hidden
      if (!showInstruments && ['multimeter'].includes(comp.type)) continue;

      const pins = nodeMap.get(comp.id);
      if (!pins) {
        console.warn(`Could not resolve pins for component ${comp.id}`);
        continue;
      }

      // Assign refDes if missing or if it's a virtual instrument that requires a strict prefix
      let refDes = comp.refDes ? comp.refDes.replace(/\s+/g, '_') : undefined;
      let prefix = "X";
      if (comp.type === "resistor") prefix = "R";
      else if (comp.type === "capacitor") prefix = "C";
      else if (comp.type === "inductor") prefix = "L";
      else if (comp.type === "vsource" || comp.type === "function_generator") prefix = "V";
      else if (comp.type === "isource") prefix = "I";
      else if (comp.type === "diode" || comp.type === "led" || comp.type === "zener") prefix = "D";
      else if (comp.type === "npn" || comp.type === "pnp") prefix = "Q";
      else if (comp.type === "nmos" || comp.type === "pmos") prefix = "M";
      else if (comp.type === "opamp") prefix = "X";
      else if (comp.type === "transformer") prefix = "TX";
      else if (comp.type === "pushbutton") prefix = "SW";

      if (comp.type === "multimeter") {
        const isCur = comp.params.mode === "current" || comp.params.mode === "ac_current";
        const isRes = comp.params.mode === "resistance";
        refDes = `${isCur ? "VMM_" : isRes ? "IMM_" : "RMM_"}${comp.id.replace(/-/g, '')}`;
      } else if (comp.type === "current_probe") {
        refDes = `V_CP_${comp.id.replace(/-/g, '')}`; // Dummy refDes to bypass prefix logic
      } else if (!refDes) {
        counters[prefix] = (counters[prefix] || 0) + 1;
        refDes = `${prefix}${counters[prefix]}`;
        while (usedRefDes.has(refDes.toUpperCase())) {
          counters[prefix]++;
          refDes = `${prefix}${counters[prefix]}`;
        }
      } else {
        // Enforce SPICE prefix on user-provided refDes
        if (!refDes.toUpperCase().startsWith(prefix) && comp.type !== "transformer" && comp.type !== "pushbutton") {
            refDes = `${prefix}_${refDes}`;
        }
        let baseRef = refDes;
        let dupCounter = 1;
        while (usedRefDes.has(refDes.toUpperCase())) {
            refDes = `${baseRef}_${dupCounter}`;
            dupCounter++;
        }
      }
      usedRefDes.add(refDes.toUpperCase());

      // Build value string
      const sanitizeVal = (v: any, def: string) => v ? v.toString().replace(/\s+/g, '') : def;
      let value = "";
      if (comp.type === "resistor") value = sanitizeVal(comp.params.resistance, "1k");
      else if (comp.type === "capacitor") value = sanitizeVal(comp.params.capacitance, "1u");
      else if (comp.type === "inductor") value = sanitizeVal(comp.params.inductance, "1m");
      else if (comp.type === "vsource" || comp.type === "function_generator" || comp.type === "isource") {
        if (comp.params.type === "dc" || (!comp.params.type && comp.type !== "function_generator")) {
           value = `DC ${sanitizeVal(comp.params.dc || comp.params.value, "0")}`;
        } else if (comp.params.type === "ac") {
           value = `AC ${sanitizeVal(comp.params.ac_mag, "1")} ${sanitizeVal(comp.params.ac_phase, "0")}`;
        } else if (comp.params.type === "sin" || (!comp.params.type && comp.type === "function_generator")) {
           const offset = sanitizeVal(comp.params.offset, "0");
           let amplitudeStr = comp.params.amplitude?.toString() || "5";
           const freq = sanitizeVal(comp.params.frequency, "1k");
           const phase = sanitizeVal(comp.params.phase, "0");
           const mode = comp.params.amplitudeMode || "peak";
           
           let amplitudeNum = parseFloat(amplitudeStr) || 5;
           if (mode !== "peak") {
             const val = parseSpiceValue(amplitudeStr);
             if (mode === "pp") amplitudeNum = val / 2;
             else if (mode === "rms") amplitudeNum = val * Math.SQRT2;
             amplitudeStr = amplitudeNum.toString();
           } else {
             amplitudeStr = sanitizeVal(amplitudeStr, "5");
           }
           
           value = `SINE(${offset} ${amplitudeStr} ${freq} 0 0 ${phase})`;
        } else {
           value = sanitizeVal(comp.params.value, "DC 0");
        }
      } else if (comp.type === "multimeter") {
        if (comp.params.mode === "resistance") value = "DC 1";
        else if (comp.params.mode === "current" || comp.params.mode === "ac_current") value = "DC 0";
        else value = "1G"; // Voltmeter is high impedance resistor
      }

      if (comp.type === "current_probe") {
        const n1 = pins.get("in") || "0";
        const n2 = pins.get("out") || "0";
        const nScope = pins.get("scope") || "0";
        const vcp = `V_CP_${comp.id.replace(/-/g, '')}`;
        lines.push(`${vcp} ${n1} ${n2} DC 0`);
        lines.push(`H_CP_${comp.id.replace(/-/g, '')} ${nScope} 0 ${vcp} 1`);
      } else if (comp.type === "diode" || comp.type === "led" || comp.type === "zener") {
        const defaultModel = comp.type === "led" ? "LED_RED" : (comp.type === "zener" ? "1N4733A" : "1N4148");
        lines.push(`${refDes} ${pins.get("1") || "0"} ${pins.get("2") || "0"} ${sanitizeVal(comp.params.model, defaultModel)}`);
      } else if (comp.type === "npn" || comp.type === "pnp") {
        const defaultModel = comp.type === "npn" ? "2N3904" : "2N3906";
        lines.push(`${refDes} ${pins.get("c") || "0"} ${pins.get("b") || "0"} ${pins.get("e") || "0"} ${sanitizeVal(comp.params.model, defaultModel)}`);
      } else if (comp.type === "nmos" || comp.type === "pmos") {
        const d = pins.get("d") || "0";
        const g = pins.get("g") || "0";
        const s = pins.get("s") || "0";
        const defaultModel = comp.type === "nmos" ? "BS170" : "BS250";
        lines.push(`${refDes} ${d} ${g} ${s} ${s} ${sanitizeVal(comp.params.model, defaultModel)}`);
      } else if (comp.type === "opamp") {
        const inp = pins.get("in+") || "0";
        const inn = pins.get("in-") || "0";
        const vp = pins.get("v+") || "0";
        const vn = pins.get("v-") || "0";
        const out = pins.get("out") || "0";
        lines.push(`${refDes} ${inp} ${inn} ${vp} ${vn} ${out} ${sanitizeVal(comp.params.model, "LM358")}`);
      } else if (comp.type === "transformer") {
        const idSafe = comp.id.replace(/-/g, '');
        const l1 = `L_${idSafe}_1`;
        const l2 = `L_${idSafe}_2`;
        const p1 = pins.get("p1") || "0";
        const p2 = pins.get("p2") || "0";
        const s1 = pins.get("s1") || "0";
        const s2 = pins.get("s2") || "0";
        
        lines.push(`${l1} ${p1} ${p2} ${comp.params.L1 || "1m"}`);
        lines.push(`${l2} ${s1} ${s2} ${comp.params.L2 || "1m"}`);
        lines.push(`K_${idSafe} ${l1} ${l2} ${comp.params.K || "0.99"}`);
      } else if (comp.type === "pushbutton") {
        const l1 = pins.get("1") || "0";
        const l2 = pins.get("2") || "0";
        const r1 = pins.get("3") || "0";
        const r2 = pins.get("4") || "0";
        const idSafe = comp.id.replace(/-/g, '');
        lines.push(`R_${idSafe}_L ${l1} ${l2} 1m`);
        lines.push(`R_${idSafe}_R ${r1} ${r2} 1m`);
        lines.push(`R_${refDes} ${l1} ${r1} ${comp.params.state === 'closed' ? '1m' : '1G'}`);
      } else {
        const n1 = pins.get("1") || "0";
        const n2 = pins.get("2") || "0";
        lines.push(`${refDes} ${n1} ${n2} ${value}`);
      }
    }

    // Default Models for Semiconductors & Subcircuits
    lines.push(".model 1N4148 D(IS=2.52n RS=0.568 N=1.752 CJO=4p M=0.4 tt=20n IKF=1000)");
    lines.push(".model LED_RED D(IS=93.2P RS=42M N=3.73 BV=5 IBV=10U CJO=2.98P VJ=.75 M=.333 TT=4.32U)");
    lines.push(".model 1N4728A D(IS=1.004e-15 RS=0.589 N=1.14 BV=3.3 IBV=0.076 CJO=400e-12 VJ=0.75 M=0.33)");
    lines.push(".model 1N5228B D(IS=1.004e-15 RS=0.589 N=1.14 BV=3.9 IBV=0.02 CJO=300e-12 VJ=0.75 M=0.33)");
    lines.push(".model 1N4733A D(IS=1.004e-15 RS=0.589 N=1.14 BV=5.1 IBV=0.049 CJO=285e-12 VJ=0.75 M=0.33)");
    lines.push(".model 1N4742A D(IS=1.004e-15 RS=0.589 N=1.14 BV=12 IBV=0.021 CJO=110e-12 VJ=0.75 M=0.33)");
    lines.push(".model 2N3904 NPN(IS=1E-14 VAF=100 Bf=300 IKF=0.4 XTB=1.5 BR=4 CJC=4E-12 CJE=8E-12 TR=250E-9 TF=350E-12 ITF=1 VTF=2 XTF=3 RB=10)");
    lines.push(".model 2N2222 NPN(IS=1E-14 VAF=100 Bf=200 IKF=0.3 XTB=1.5 BR=3 CJC=8E-12 CJE=25E-12 TR=100E-9 TF=400E-12 ITF=1 VTF=2 XTF=3 RB=10)");
    lines.push(".model 2N3906 PNP(IS=1E-14 VAF=100 Bf=200 IKF=0.4 XTB=1.5 BR=4 CJC=4.5E-12 CJE=10E-12 TR=250E-9 TF=350E-12 ITF=1 VTF=2 XTF=3 RB=10)");
    lines.push(".model BS170 NMOS(LEVEL=1 VTO=2.1 KP=0.320 CBD=1.0E-10 CBS=1.0E-10)");
    lines.push(".model BS250 PMOS(LEVEL=1 VTO=-2.1 KP=0.320 CBD=1.0E-10 CBS=1.0E-10)");
    lines.push(".subckt LM358 1 2 3 4 5");
    lines.push("* 1=in+, 2=in-, 3=v+, 4=v-, 5=out");
    lines.push("E1 5 0 1 2 100k");
    lines.push(".ends LM358");

    if (circuit.customModels) {
      lines.push(circuit.customModels);
    }

    // Append active analysis at the end, right before .end
    const analysis = circuit.analyses.find(a => a.kind === activeAnalysis);
    if (analysis) {
      if (analysis.kind === "op") {
        lines.push(`.op`);
      } else if (analysis.kind === "tran") {
        lines.push(`.tran ${analysis.params.step} ${analysis.params.stop}`);
      } else if (analysis.kind === "ac") {
        lines.push(`.ac ${analysis.params.variation} ${analysis.params.points} ${analysis.params.fstart} ${analysis.params.fstop}`);
      } else if (analysis.kind === "dc") {
        lines.push(`.dc ${analysis.params.source} ${analysis.params.start} ${analysis.params.stop} ${analysis.params.step}`);
      }
    }

    lines.push(".end");
    return lines.join("\n");
  }
}
