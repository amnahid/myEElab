import { describe, it, expect } from 'vitest';
import { 
  getComponentPrefix, 
  isUnindexedRefDes, 
  generateNextRefDes, 
  reindexRefDes, 
  ensureCircuitRefDes 
} from '../src/engine/refDes';
import { Circuit, ComponentInstance } from '../src/models/circuit';

describe('refDes module (Reference Designator numbering)', () => {
  describe('getComponentPrefix', () => {
    it('should return standard EDA prefixes for passives, sources, and semiconductors', () => {
      expect(getComponentPrefix('resistor')).toBe('R');
      expect(getComponentPrefix('capacitor')).toBe('C');
      expect(getComponentPrefix('inductor')).toBe('L');
      expect(getComponentPrefix('transformer')).toBe('T');
      expect(getComponentPrefix('vsource')).toBe('V');
      expect(getComponentPrefix('function_generator')).toBe('V');
      expect(getComponentPrefix('clock')).toBe('V');
      expect(getComponentPrefix('isource')).toBe('I');
      expect(getComponentPrefix('diode')).toBe('D');
      expect(getComponentPrefix('zener')).toBe('D');
      expect(getComponentPrefix('led')).toBe('LED');
      expect(getComponentPrefix('npn')).toBe('Q');
      expect(getComponentPrefix('pnp')).toBe('Q');
      expect(getComponentPrefix('nmos')).toBe('M');
      expect(getComponentPrefix('pmos')).toBe('M');
    });

    it('should return U for ICs and opamps', () => {
      expect(getComponentPrefix('opamp')).toBe('U');
      expect(getComponentPrefix('ne555')).toBe('U');
      expect(getComponentPrefix('lm7805')).toBe('U');
      expect(getComponentPrefix('lm317')).toBe('U');
      expect(getComponentPrefix('74hc164')).toBe('U');
      expect(getComponentPrefix('74hc00')).toBe('U');
      expect(getComponentPrefix('cd4017')).toBe('U');
    });

    it('should return SW for switches and buttons', () => {
      expect(getComponentPrefix('switch')).toBe('SW');
      expect(getComponentPrefix('pushbutton')).toBe('SW');
    });

    it('should return empty string for ground and breadboard', () => {
      expect(getComponentPrefix('ground')).toBe('');
      expect(getComponentPrefix('breadboard')).toBe('');
    });
  });

  describe('isUnindexedRefDes', () => {
    it('should identify missing or placeholder refDes as unindexed', () => {
      expect(isUnindexedRefDes(undefined)).toBe(true);
      expect(isUnindexedRefDes('')).toBe(true);
      expect(isUnindexedRefDes('  ')).toBe(true);
      expect(isUnindexedRefDes('U?')).toBe(true);
      expect(isUnindexedRefDes('R?')).toBe(true);
      expect(isUnindexedRefDes('?')).toBe(true);
    });

    it('should identify single un-numbered letters as unindexed', () => {
      expect(isUnindexedRefDes('R', 'resistor')).toBe(true);
      expect(isUnindexedRefDes('C', 'capacitor')).toBe(true);
      expect(isUnindexedRefDes('L', 'led')).toBe(true);
      expect(isUnindexedRefDes('S', 'switch')).toBe(true);
      expect(isUnindexedRefDes('V', 'vsource')).toBe(true);
      expect(isUnindexedRefDes('G', 'ground')).toBe(true);
      expect(isUnindexedRefDes('U', '74hc164')).toBe(true);
    });

    it('should identify un-numbered generic component names as unindexed', () => {
      expect(isUnindexedRefDes('RESISTOR', 'resistor')).toBe(true);
      expect(isUnindexedRefDes('LED', 'led')).toBe(true);
      expect(isUnindexedRefDes('SWITCH', 'switch')).toBe(true);
      expect(isUnindexedRefDes('74HC164', '74hc164')).toBe(true);
    });

    it('should recognize properly indexed refDes as indexed (not unindexed)', () => {
      expect(isUnindexedRefDes('R1', 'resistor')).toBe(false);
      expect(isUnindexedRefDes('R12', 'resistor')).toBe(false);
      expect(isUnindexedRefDes('C1', 'capacitor')).toBe(false);
      expect(isUnindexedRefDes('LED1', 'led')).toBe(false);
      expect(isUnindexedRefDes('SW1', 'switch')).toBe(false);
      expect(isUnindexedRefDes('U1', '74hc164')).toBe(false);
      expect(isUnindexedRefDes('V1', 'vsource')).toBe(false);
    });
  });

  describe('generateNextRefDes', () => {
    it('should generate sequential numbers starting at 1', () => {
      const existing: ComponentInstance[] = [];
      const r1 = generateNextRefDes('resistor', existing);
      expect(r1).toBe('R1');

      existing.push({ id: '1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: {}, refDes: 'R1' });
      const r2 = generateNextRefDes('resistor', existing);
      expect(r2).toBe('R2');
    });

    it('should avoid collisions using usedInBatch set', () => {
      const existing: ComponentInstance[] = [
        { id: '1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: {}, refDes: 'R1' }
      ];
      const batch = new Set<string>();
      const r2 = generateNextRefDes('resistor', existing, batch);
      expect(r2).toBe('R2');
      expect(batch.has('R2')).toBe(true);

      const r3 = generateNextRefDes('resistor', existing, batch);
      expect(r3).toBe('R3');
      expect(batch.has('R3')).toBe(true);
    });

    it('should return undefined for ground', () => {
      expect(generateNextRefDes('ground', [])).toBeUndefined();
    });
  });

  describe('reindexRefDes', () => {
    it('should reindex indexed components on copy/paste', () => {
      const existing: ComponentInstance[] = [
        { id: '1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: {}, refDes: 'R1' }
      ];
      const batch = new Set<string>();
      const pasted = reindexRefDes('R1', 'resistor', existing, batch);
      expect(pasted).toBe('R2');
    });

    it('should convert unindexed originalRefDes to a proper numbered refDes', () => {
      const existing: ComponentInstance[] = [
        { id: '1', type: 'led', position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: {}, refDes: 'LED1' }
      ];
      const batch = new Set<string>();
      // Legacy or unnumbered "L" on LED
      const pasted = reindexRefDes('L', 'led', existing, batch);
      expect(pasted).toBe('LED2');
    });
  });

  describe('ensureCircuitRefDes (Auto-annotation of entire circuits)', () => {
    it('should annotate a full circuit missing numbering like the user screenshot', () => {
      const circuit: Circuit = {
        id: 'test-circuit',
        name: 'Shift Register Demo',
        components: [
          { id: 'c-v1', type: 'vsource', position: { x: 100, y: 100 }, rotation: 0, mirrored: false, params: { value: 5 } },
          { id: 'c-gnd', type: 'ground', position: { x: 100, y: 200 }, rotation: 0, mirrored: false, params: {}, refDes: 'G' },
          { id: 'c-s1', type: 'switch', position: { x: 200, y: 100 }, rotation: 0, mirrored: false, params: { state: 'closed' } },
          { id: 'c-r1', type: 'resistor', position: { x: 200, y: 150 }, rotation: 0, mirrored: false, params: { resistance: '10k' } },
          { id: 'c-c1', type: 'capacitor', position: { x: 250, y: 150 }, rotation: 0, mirrored: false, params: { capacitance: '100pF' } },
          { id: 'c-c2', type: 'capacitor', position: { x: 300, y: 50 }, rotation: 0, mirrored: false, params: { capacitance: '0.1uF' } },
          { id: 'c-u1', type: '74hc164', position: { x: 400, y: 200 }, rotation: 0, mirrored: false, params: {}, refDes: 'U?' },
          { id: 'c-r2', type: 'resistor', position: { x: 500, y: 100 }, rotation: 0, mirrored: false, params: { resistance: '220' } },
          { id: 'c-r3', type: 'resistor', position: { x: 500, y: 130 }, rotation: 0, mirrored: false, params: { resistance: '220' } },
          { id: 'c-led1', type: 'led', position: { x: 600, y: 100 }, rotation: 0, mirrored: false, params: { model: 'LED_RED' } },
          { id: 'c-led2', type: 'led', position: { x: 600, y: 130 }, rotation: 0, mirrored: false, params: { model: 'LED_RED' } }
        ],
        wires: [],
        analyses: [{ kind: 'tran', params: { step: '1m', stop: '10m' } }]
      };

      const changed = ensureCircuitRefDes(circuit);
      expect(changed).toBe(true);

      const comps = circuit.components;
      // VSource -> V1
      expect(comps.find(c => c.id === 'c-v1')?.refDes).toBe('V1');
      // Ground -> no refDes (suppresses "G")
      expect(comps.find(c => c.id === 'c-gnd')?.refDes).toBeUndefined();
      // Switch -> SW1
      expect(comps.find(c => c.id === 'c-s1')?.refDes).toBe('SW1');
      // Capacitors -> C1, C2
      expect(comps.find(c => c.id === 'c-c1')?.refDes).toBe('C1');
      expect(comps.find(c => c.id === 'c-c2')?.refDes).toBe('C2');
      // Resistors -> R1, R2, R3
      expect(comps.find(c => c.id === 'c-r1')?.refDes).toBe('R1');
      expect(comps.find(c => c.id === 'c-r2')?.refDes).toBe('R2');
      expect(comps.find(c => c.id === 'c-r3')?.refDes).toBe('R3');
      // IC 74HC164 -> U1 (not U?)
      expect(comps.find(c => c.id === 'c-u1')?.refDes).toBe('U1');
      // LEDs -> LED1, LED2 (not L)
      expect(comps.find(c => c.id === 'c-led1')?.refDes).toBe('LED1');
      expect(comps.find(c => c.id === 'c-led2')?.refDes).toBe('LED2');
    });

    it('should preserve existing indexed refDes and fill the next numbers', () => {
      const circuit: Circuit = {
        id: 'test-circuit-2',
        name: 'Partial Circuit',
        components: [
          { id: '1', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: {}, refDes: 'R1' },
          { id: '2', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: {}, refDes: 'R3' },
          { id: '3', type: 'resistor', position: { x: 0, y: 0 }, rotation: 0, mirrored: false, params: {} } // missing refDes
        ],
        wires: [],
        analyses: []
      };

      ensureCircuitRefDes(circuit);
      // R1 and R3 should remain unchanged
      expect(circuit.components[0].refDes).toBe('R1');
      expect(circuit.components[1].refDes).toBe('R3');
      // The third should take the next available slot (R2 or R4)
      expect(circuit.components[2].refDes).toBe('R2');
    });
  });
});
