import { Simulation } from "eecircuit-engine";

async function run() {
  const sim = new Simulation();
  await sim.start();
  const netlist = `
* Test Circuit
V1 1 0 DC 5
R1 1 0 1k
.op
.end
`;
  sim.setNetList(netlist);
  const results = await sim.runSim();
  console.log(JSON.stringify(results, null, 2));
}

run();
