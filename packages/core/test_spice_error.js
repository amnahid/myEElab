import { Simulation } from "eecircuit-engine";

async function run() {
  const sim = new Simulation();
  await sim.start();
  const netlist = `
* Floating Node Circuit
V1 1 0 DC 5
R1 2 0 1k
C1 3 0 1u
.op
.end
`;
  sim.setNetList(netlist);
  try {
    const results = await sim.runSim();
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.log("SPICE ERROR:", err.message || err);
  }
}

run();
