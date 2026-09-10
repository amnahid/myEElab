import fs from 'fs';
import { Simulation } from "eecircuit-engine";

async function run() {
  const sim = new Simulation();
  await sim.start();
  const netlist = `* LiveSpice Circuit
V1 1 0 SINE(0 20 100 0 0 0)
R1 1 2 200
VMM 2 0 DC 0
.tran 100u 10m
.end`;
  sim.setNetList(netlist);
  const res = await sim.runSim();
  console.log(res.data.find(d => d.name === 'i(vmm)').values.slice(0, 5));
}
run();
