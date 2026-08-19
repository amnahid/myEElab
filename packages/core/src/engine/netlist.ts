import { Circuit } from "../models/circuit";
import { NodeResolver } from "./nodeResolver";
import { deriveBreadboardWires } from "./breadboardSync";
import { useEditorStore } from "../store/editorStore";

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

    const showInstruments = useEditorStore.getState().showInstruments;

    for (const comp of circuit.components) {
      if (comp.type === "ground" || comp.type === "oscilloscope" || comp.type === "breadboard") continue;
      
      // Exclude passive instruments from simulation if hidden
      if (!showInstruments && ['multimeter'].includes(comp.type)) continue;

      const pins = nodeMap.get(comp.id);
      if (!pins) {
        console.warn(`Could not resolve pins for component ${comp.id}`);
        continue;
      }

      // Assign refDes if missing or if it's a virtual instrument that requires a strict prefix
      let refDes = comp.refDes;
      if (comp.type === "multimeter") {
        refDes = `${comp.params.mode === "current" ? "VMM_" : comp.params.mode === "resistance" ? "IMM_" : "RMM_"}${comp.id.replace(/-/g, '')}`;
      } else if (comp.type === "current_probe") {
        refDes = `V_CP_${comp.id.replace(/-/g, '')}`; // Dummy refDes to bypass prefix logic
      } else if (!refDes) {
        let prefix = "X";
        if (comp.type === "resistor") prefix = "R";
        else if (comp.type === "capacitor") prefix = "C";
        else if (comp.type === "inductor") prefix = "L";
        else if (comp.type === "vsource" || comp.type === "function_generator") prefix = "V";
        else if (comp.type === "isource") prefix = "I";
        else if (comp.type === "diode") prefix = "D";
        else if (comp.type === "npn" || comp.type === "pnp") prefix = "Q";
        else if (comp.type === "nmos" || comp.type === "pmos") prefix = "M";
        else if (comp.type === "opamp") prefix = "X";
        
        counters[prefix] = (counters[prefix] || 0) + 1;
        refDes = `${prefix}${counters[prefix]}`;
      }

      // Build value string
      let value = "";
      if (comp.type === "resistor") value = comp.params.resistance?.toString() || "1k";
      else if (comp.type === "capacitor") value = comp.params.capacitance?.toString() || "1u";
      else if (comp.type === "inductor") value = comp.params.inductance?.toString() || "1m";
      else if (comp.type === "vsource" || comp.type === "function_generator" || comp.type === "isource") {
        if (comp.params.type === "dc" || (!comp.params.type && comp.type !== "function_generator")) {
           value = `DC ${comp.params.dc || comp.params.value || 0}`;
        } else if (comp.params.type === "ac") {
           value = `AC ${comp.params.ac_mag || 1} ${comp.params.ac_phase || 0}`;
        } else if (comp.params.type === "sin" || (!comp.params.type && comp.type === "function_generator")) {
           const offset = comp.params.offset || 0;
           const amplitude = comp.params.amplitude || 5;
           const freq = comp.params.frequency || "1k";
           const phase = comp.params.phase || 0;
           value = `SINE(${offset} ${amplitude} ${freq} 0 0 ${phase})`;
        } else {
           value = comp.params.value?.toString() || "DC 0";
        }
      } else if (comp.type === "multimeter") {
        if (comp.params.mode === "resistance") value = "DC 1";
        else if (comp.params.mode === "current") value = "DC 0";
        else value = "1G"; // Voltmeter is high impedance resistor
      }

      if (comp.type === "current_probe") {
        const n1 = pins.get("in") || "0";
        const n2 = pins.get("out") || "0";
        const nScope = pins.get("scope") || "0";
        const vcp = `V_CP_${comp.id.replace(/-/g, '')}`;
        lines.push(`${vcp} ${n1} ${n2} DC 0`);
        lines.push(`H_CP_${comp.id.replace(/-/g, '')} ${nScope} 0 ${vcp} 1`);
      } else if (comp.type === "diode") {
        lines.push(`${refDes} ${pins.get("1") || "0"} ${pins.get("2") || "0"} ${comp.params.model || "1N4148"}`);
      } else if (comp.type === "npn" || comp.type === "pnp") {
        lines.push(`${refDes} ${pins.get("c") || "0"} ${pins.get("b") || "0"} ${pins.get("e") || "0"} ${comp.params.model || (comp.type === "npn" ? "2N3904" : "2N3906")}`);
      } else if (comp.type === "nmos" || comp.type === "pmos") {
        const d = pins.get("d") || "0";
        const g = pins.get("g") || "0";
        const s = pins.get("s") || "0";
        lines.push(`${refDes} ${d} ${g} ${s} ${s} ${comp.params.model || (comp.type === "nmos" ? "BS170" : "BS250")}`);
      } else if (comp.type === "opamp") {
        const inp = pins.get("in+") || "0";
        const inn = pins.get("in-") || "0";
        const vp = pins.get("v+") || "0";
        const vn = pins.get("v-") || "0";
        const out = pins.get("out") || "0";
        lines.push(`${refDes} ${inp} ${inn} ${vp} ${vn} ${out} ${comp.params.model || "LM358"}`);
      } else {
        const n1 = pins.get("1") || "0";
        const n2 = pins.get("2") || "0";
        lines.push(`${refDes} ${n1} ${n2} ${value}`);
      }
    }

    // Default Models for Semiconductors & Subcircuits
    lines.push(".model 1N4148 D(IS=2.52n RS=0.568 N=1.752 CJO=4p M=0.4 tt=20n IKF=1000)");
    lines.push(".model 2N3904 NPN(IS=1E-14 VAF=100 Bf=300 IKF=0.4 XTB=1.5 BR=4 CJC=4E-12 CJE=8E-12 TR=250E-9 TF=350E-12 ITF=1 VTF=2 XTF=3 RB=10)");
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
