import { create } from 'zustand';

export interface LedState {
  isOn: boolean;
  intensity: number;
}

export interface SimulationState {
  nodeVoltages: Record<string, number>;
  operatingPointVoltages: Record<string, number>;
  ledStates: Record<string, LedState>;
  setNodeVoltages: (voltages: Record<string, number>, leds?: Record<string, LedState>) => void;
  setOperatingPointVoltages: (opVoltages: Record<string, number>) => void;
  resetSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  nodeVoltages: {},
  operatingPointVoltages: {},
  ledStates: {},
  setNodeVoltages: (nodeVoltages, ledStates = {}) => set({ nodeVoltages, ledStates }),
  setOperatingPointVoltages: (operatingPointVoltages) => set({ operatingPointVoltages }),
  resetSimulation: () => set({ nodeVoltages: {}, operatingPointVoltages: {}, ledStates: {} }),
}));
