import { Simulation } from "eecircuit-engine";

async function run() {
  const sim = new Simulation();
  await sim.start();
  const netlist = `
* Test circuit
V1 1 0 SINE(0 10 100 0 0 0)
R1 1 2 200
VMM 2 0 DC 0
.tran 100u 10m
.end
  `;
  sim.setNetList(netlist);
  const res = await sim.runSim();
  console.log(JSON.stringify(res.data.map((d: any) => d.name)));
}
run();
