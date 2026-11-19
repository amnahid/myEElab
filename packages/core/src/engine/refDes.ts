import { Circuit, ComponentDefinition, ComponentInstance } from "../models/circuit";
import { ComponentLibrary } from "./library";

export const COMPONENT_PREFIX_MAP: Record<string, string> = {
  resistor: 'R',
  capacitor: 'C',
  inductor: 'L',
  transformer: 'T',
  vsource: 'V',
  function_generator: 'V',
  clock: 'V',
  isource: 'I',
  diode: 'D',
  zener: 'D',
  led: 'LED',
  npn: 'Q',
  pnp: 'Q',
  nmos: 'M',
  pmos: 'M',
  opamp: 'U',
  ne555: 'U',
  lm7805: 'U',
  lm317: 'U',
  lm393: 'U',
  tl072: 'U',
  lm741: 'U',
  lm324: 'U',
  lm7812: 'U',
  cd4017: 'U',
  switch: 'SW',
  pushbutton: 'SW',
  multimeter: 'DMM',
  oscilloscope: 'OSC',
  current_probe: 'CP'
};

export const GENERIC_UNINDEXED_NAMES = new Set([
  'R', 'C', 'L', 'D', 'Q', 'M', 'U', 'V', 'I', 'S', 'G', 'T',
  'U?', 'R?', 'C?', 'D?', 'Q?', '?',
  'RESISTOR', 'CAPACITOR', 'INDUCTOR', 'TRANSFORMER', 'DIODE', 'ZENER', 'LED',
  'SWITCH', 'PUSHBUTTON', 'VSOURCE', 'ISOURCE', 'CLOCK', 'GROUND', 'GND',
  'OPAMP', 'BREADBOARD', 'MULTIMETER', 'OSCILLOSCOPE', 'SW', 'TX', 'DMM', 'OSC',
  'RES', 'CAP', 'IND', 'BTN', 'BUTTON', 'VOLTAGE', 'CURRENT', 'IC'
]);

/**
 * Returns the standard EDA schematic Reference Designator prefix for a component type.
 * Returns empty string for power net / non-numbered components like ground and breadboard.
 */
export function getComponentPrefix(type: string, customDef?: ComponentDefinition): string {
  if (type === 'ground' || type === 'breadboard') {
    return '';
  }

  if (COMPONENT_PREFIX_MAP[type]) {
    return COMPONENT_PREFIX_MAP[type];
  }

  const def = customDef || ComponentLibrary[type];
  if (def) {
    if (def.category === 'digital_logic' || def.category === 'analog_ic' || def.category === 'power') {
      return 'U';
    }
    if (def.spice?.prefix) {
      if (def.spice.prefix === 'X') return 'U';
      if (def.spice.prefix === 'TX') return 'T';
      return def.spice.prefix;
    }
  }

  if (/^(74|cd4|lm|tl|max|ne|ad|op)/i.test(type)) {
    return 'U';
  }

  return 'U';
}

/**
 * Determines whether a given refDes is missing or generic/unindexed (e.g. undefined, "R", "C", "L", "S", "U?", "LED").
 */
export function isUnindexedRefDes(refDes?: string, type?: string): boolean {
  if (!refDes || typeof refDes !== 'string') return true;
  const trimmed = refDes.trim();
  if (trimmed === '') return true;
  if (trimmed.endsWith('?')) return true;

  const upper = trimmed.toUpperCase();
  if (GENERIC_UNINDEXED_NAMES.has(upper)) return true;

  if (type && upper === type.toUpperCase()) return true;

  // Single letter without numbers (e.g. "R", "C", "L", "S", "V", "G")
  if (/^[A-Za-z]$/.test(trimmed)) return true;

  // Check if it has no digits and matches prefix or type abbreviation
  if (!/\d/.test(trimmed)) {
    const prefix = type ? getComponentPrefix(type).toUpperCase() : '';
    if (prefix && upper === prefix) return true;
    if (type && type.length > 0 && upper === type.charAt(0).toUpperCase()) return true;
  }

  return false;
}

/**
 * Generates the next sequential indexed Reference Designator (e.g. "R1", "C2", "LED1", "U1")
 * for a new component, avoiding collisions with existing components and batch allocations.
 */
export function generateNextRefDes(
  type: string,
  existingComps: ComponentInstance[],
  usedInBatch?: Set<string>,
  customDef?: ComponentDefinition
): string | undefined {
  const prefix = getComponentPrefix(type, customDef);
  if (!prefix) return undefined;

  let maxNum = 0;
  const prefixRegex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  for (const c of existingComps) {
    if (c.refDes) {
      const match = c.refDes.match(prefixRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  if (usedInBatch) {
    for (const ref of usedInBatch) {
      const match = ref.match(prefixRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const nextRefDes = `${prefix}${nextNum}`;
  if (usedInBatch) {
    usedInBatch.add(nextRefDes.toUpperCase());
  }
  return nextRefDes;
}

/**
 * Generates an indexed refDes for a duplicated or pasted component.
 */
export function reindexRefDes(
  originalRefDes: string | undefined,
  type: string | undefined,
  existingComps: ComponentInstance[],
  usedInBatch: Set<string>,
  customDef?: ComponentDefinition
): string | undefined {
  if (type === 'ground' || type === 'breadboard') return undefined;

  // If originalRefDes was unindexed or missing, generate a fresh indexed one
  if (!originalRefDes || (type && isUnindexedRefDes(originalRefDes, type))) {
    return type ? generateNextRefDes(type, existingComps, usedInBatch, customDef) : undefined;
  }

  // If originalRefDes has a prefix and number (e.g. R1, LED2, U3)
  const match = originalRefDes.match(/^([a-zA-Z_]+)(\d+)$/);
  if (match) {
    const prefix = match[1];
    let maxNum = 0;
    const prefixRegex = new RegExp(`^${prefix}(\\d+)$`, 'i');

    for (const c of existingComps) {
      if (c.refDes) {
        const cMatch = c.refDes.match(prefixRegex);
        if (cMatch) {
          const num = parseInt(cMatch[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    for (const ref of usedInBatch) {
      const bMatch = ref.match(prefixRegex);
      if (bMatch) {
        const num = parseInt(bMatch[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newRef = `${prefix}${maxNum + 1}`;
    usedInBatch.add(newRef.toUpperCase());
    return newRef;
  } else {
    // Custom name like "VCC" or "RESET"
    const base = originalRefDes;
    let newRef = base;
    let counter = 1;
    const allUsed = new Set<string>();
    existingComps.forEach(c => c.refDes && allUsed.add(c.refDes.toUpperCase()));
    usedInBatch.forEach(ref => allUsed.add(ref.toUpperCase()));

    while (allUsed.has(newRef.toUpperCase())) {
      newRef = `${base}_${counter}`;
      counter++;
    }
    usedInBatch.add(newRef.toUpperCase());
    return newRef;
  }
}

/**
 * Scans an entire circuit and automatically assigns sequential indexed Reference Designators
 * (e.g. R1, R2, C1, U1, LED1, SW1, V1) to any component missing one or holding a generic unindexed placeholder.
 * Suppresses refDes on ground and breadboard components.
 * Returns true if any component was modified.
 */
export function ensureCircuitRefDes(circuit: Circuit): boolean {
  if (!circuit || !circuit.components || circuit.components.length === 0) {
    return false;
  }

  let changed = false;
  const usedRefDes = new Set<string>();

  // Pass 1: Collect all valid, indexed refDes
  for (const c of circuit.components) {
    if (c.type === 'ground' || c.type === 'breadboard') {
      if (c.refDes !== undefined) {
        delete c.refDes;
        changed = true;
      }
      continue;
    }

    if (c.refDes && !isUnindexedRefDes(c.refDes, c.type)) {
      usedRefDes.add(c.refDes.toUpperCase());
    }
  }

  // Pass 2: Assign indexed refDes to components that need it
  for (const c of circuit.components) {
    if (c.type === 'ground' || c.type === 'breadboard') {
      continue;
    }

    if (!c.refDes || isUnindexedRefDes(c.refDes, c.type)) {
      const prefix = getComponentPrefix(c.type, c.customDefinition || circuit.customComponents?.[c.type]);
      if (!prefix) continue;

      let counter = 1;
      let candidate = `${prefix}${counter}`;
      while (usedRefDes.has(candidate.toUpperCase())) {
        counter++;
        candidate = `${prefix}${counter}`;
      }

      c.refDes = candidate;
      usedRefDes.add(candidate.toUpperCase());
      changed = true;
    }
  }

  return changed;
}
