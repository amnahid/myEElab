import fs from 'fs';
import { Simulation } from "eecircuit-engine";

async function run() {
  const sim = new Simulation();
  await sim.start();
  const netlist = `* LiveSpice Circuit
V1 1 0 SINE(0 20 100 0 0 0)
R1 1 2 200
L1 2 3 2.2m
VMM_e2b85e05a2e947ee93b79da9d6f0f2cf 3 0 DC 0
.tran 100u 10m
.end`;
  sim.setNetList(netlist);
  const res = await sim.runSim();
  console.log(Object.keys(res.data.reduce((acc, d) => ({...acc, [d.name]: d.type}), {})));
}
run();
