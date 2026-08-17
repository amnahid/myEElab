export interface Point {
  x: number;
  y: number;
}

export interface Pin {
  id: string;        // stable id, unique within its component type
  label: string;      // e.g. "anode", "gate", "+"
  offset: Point;       // position relative to component origin, pre-rotation

}

export interface ComponentInstance {
  id: string;                                 // unique within the circuit
  type: string;                                // "resistor" | "capacitor" | "vsource" | "inductor" | "isource" | "ground"
  position: Point;
  rotation: 0 | 90 | 180 | 270;

  mirrored: boolean;
  color?: string;
  params: Record<string, number | string>;      // e.g. { resistance: 1000 }
  refDes?: string;                               // "R1", "C3" — assigned at netlist-gen time if absent
}

export interface Wire {
  id: string;
  points: Point[];    // polyline; orthogonal segments only
  color?: string;     // custom wire color
}

export interface AnalysisConfig {
  kind: "op" | "tran" | "ac" | "dc";
  params: Record<string, number | string>;
}

export interface Circuit {
  id: string;
  name: string;
  components: ComponentInstance[];
  wires: Wire[];
  analyses: AnalysisConfig[];
  customModels?: string; // User-provided .model or .subckt definitions
  breadboard?: Breadboard;
}

export interface BreadboardHole {
  id: string; // e.g. "a1".."j30", "pwr-top-red", etc.
}

export interface BreadboardPlacement {
  componentId: string;                 // references a ComponentInstance
  legHoles: Record<string, string>;     // pinId -> BreadboardHole id
}

export interface BreadboardJumper {
  id: string;
  startHole: string;
  endHole: string;
  color: string;
  points: Point[]; // For rendering the bendable wire on the breadboard
}

export interface Breadboard {
  layout: "half" | "full";              // hole-grid size
  placements: BreadboardPlacement[];
  jumperWires: BreadboardJumper[];
}

export interface Probe {
  nodeId: string;
  color: string;
  x: number;
  y: number;
}
