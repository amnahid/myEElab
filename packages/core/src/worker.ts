import { Simulation } from "eecircuit-engine";

let lastError = '';
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  const msg = args.join(' ');
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.includes('error') || lowerMsg.includes('singular matrix') || lowerMsg.includes('unknown parameter')) {
    lastError += msg + '\n';
  }
  originalLog.apply(console, args);
};
console.error = function(...args) {
  lastError += args.join(' ') + '\n';
  originalError.apply(console, args);
};

const sim = new Simulation();

self.onmessage = async (e) => {
  if (e.data.type === "start") {
    try {
      if (!sim.isInitialized()) {
        await sim.start();
      }
      
      const netlist = e.data.netlist;
      if (!netlist) return;
      
      lastError = ''; // Reset before run
      sim.setNetList(netlist);
      const results = await sim.runSim();
      
      if (lastError && (lastError.toLowerCase().includes('error') || lastError.toLowerCase().includes('singular matrix') || lastError.includes('interrupted'))) {
        throw new Error(`SPICE Error: \n${lastError.trim()}`);
      }
      
      self.postMessage({ type: "results", results });
    } catch (err: any) {
      const message = err?.message || (typeof err === 'string' ? err : String(err));
      self.postMessage({ type: "error", error: message });
    }
  }
};
