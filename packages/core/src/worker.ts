import { Simulation } from "eecircuit-engine";

const sim = new Simulation();

self.onmessage = async (e) => {
  if (e.data.type === "start") {
    try {
      if (!sim.isInitialized()) {
        await sim.start();
      }
      
      const netlist = e.data.netlist;
      if (!netlist) return;
      
      sim.setNetList(netlist);
      const results = await sim.runSim();
      
      self.postMessage({ type: "results", results });
    } catch (err) {
      self.postMessage({ type: "error", error: err });
    }
  }
};
