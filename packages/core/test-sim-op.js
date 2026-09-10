import { Simulation } from "eecircuit-engine";

async function run() {
  const sim = new Simulation();
  await sim.start();
  const netlist = `
* Test circuit
V1 1 0 DC 10
R1 1 2 200
VMM 2 0 DC 0
.op
.end
  `;
  sim.setNetList(netlist);
  const res = await sim.runSim();
  console.log(JSON.stringify(res.data.map(d => ({ name: d.name, type: d.type }))));
}
run();
