import { expect, test } from "vitest";
import { NetlistGenerator } from "../src/engine/netlist";
import { Simulation } from "eecircuit-engine";

test("AC simulation", async () => {
    const netlist = `
* AC Filter
V1 1 0 AC 1 0
R1 1 2 1k
C1 2 0 1u
.ac dec 10 1 100k
.end
`;

    const sim = new Simulation();
    await sim.start();
    sim.setNetList(netlist);
    const results = await sim.runSim();
    console.log(JSON.stringify(results.data.slice(0, 3), null, 2));
    expect(results.data.length).toBeGreaterThan(0);
});
