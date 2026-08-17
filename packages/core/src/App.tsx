import { useEffect, useState, useRef } from 'react';
import { Canvas } from './editor/Canvas';
import { useEditorStore } from './store/editorStore';
import { Undo, Redo, RotateCw, Trash2 } from 'lucide-react';
import { NetlistGenerator } from './engine/netlist';
import { WaveformViewer } from './editor/WaveformViewer';
import { BodePlot } from './components/BodePlot';
import { ProbeMenuIcon } from './editor/ProbeIcon';

import { ComponentLibrary } from './engine/library';

const ComponentIcons: Record<string, React.ReactNode> = {
  resistor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 3 12 h 3 l 2.5 -5 l 3 10 l 3 -10 l 3 10 l 2.5 -5 h 4" />
    </svg>
  ),
  capacitor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 3 12 h 7" />
      <path d="M 10 6 v 12" />
      <path d="M 14 6 v 12" />
      <path d="M 14 12 h 7" />
    </svg>
  ),
  inductor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 3 12 h 3" />
      <path d="M 6 12 c 0 -5 4 -5 4 0 c 0 -5 4 -5 4 0 c 0 -5 4 -5 4 0" />
      <path d="M 18 12 h 3" />
    </svg>
  ),
  vsource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
      <path d="M 12 2 v 3" />
      <path d="M 12 19 v 3" />
      <path d="M 12 7 v 3" />
      <path d="M 10.5 8.5 h 3" />
      <path d="M 10.5 15.5 h 3" />
    </svg>
  ),
  isource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
      <path d="M 12 2 v 3" />
      <path d="M 12 19 v 3" />
      <path d="M 12 16 v -8" />
      <path d="M 9 11 l 3 -3 l 3 3" />
    </svg>
  ),
  ground: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 4 v 8" />
      <path d="M 6 12 h 12" />
      <path d="M 8 16 h 8" />
      <path d="M 10 20 h 4" />
    </svg>
  ),
  diode: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 2 v 6" />
      <path d="M 8 8 l 8 0 l -4 8 z" fill="currentColor" />
      <path d="M 8 16 h 8" />
      <path d="M 12 16 v 6" />
    </svg>
  ),
  npn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 2 12 h 6" />
      <path d="M 8 6 v 12" />
      <path d="M 8 8 l 8 -6 v -2" />
      <path d="M 8 16 l 8 6 v 2" />
      <path d="M 14 18 l 2 4 l 2 -4" />
    </svg>
  ),
  pnp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 2 12 h 6" />
      <path d="M 8 6 v 12" />
      <path d="M 8 8 l 8 -6 v -2" />
      <path d="M 8 16 l 8 6 v 2" />
      <path d="M 10 14 l 2 4 l -4 0" />
    </svg>
  ),
  nmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 2 12 h 6" />
      <path d="M 8 6 v 12" />
      <path d="M 10 6 v 3 m 0 2 v 2 m 0 2 v 3" />
      <path d="M 10 7 h 8 v -5" />
      <path d="M 10 17 h 8 v 5" />
    </svg>
  ),
  pmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 2 12 h 6" />
      <path d="M 8 6 v 12" />
      <path d="M 10 6 v 3 m 0 2 v 2 m 0 2 v 3" />
      <path d="M 10 7 h 8 v -5" />
      <path d="M 10 17 h 8 v 5" />
      <circle cx="9" cy="12" r="1" />
    </svg>
  ),
  opamp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 2 8 h 4" />
      <path d="M 2 16 h 4" />
      <path d="M 6 4 l 14 8 l -14 8 z" />
      <path d="M 20 12 h 4" />
    </svg>
  ),
  powersupply: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <rect x="6" y="8" width="12" height="6" fill="currentColor" opacity="0.2" />
      <circle cx="8" cy="17" r="1" />
      <circle cx="16" cy="17" r="1" />
    </svg>
  ),
  functiongenerator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M 6 12 q 3 -6 6 0 t 6 0" />
      <circle cx="8" cy="17" r="1" />
      <circle cx="16" cy="17" r="1" />
    </svg>
  ),
  oscilloscope: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <rect x="4" y="6" width="12" height="10" fill="currentColor" opacity="0.2" />
      <circle cx="18" cy="8" r="1" />
      <circle cx="18" cy="12" r="1" />
      <circle cx="18" cy="16" r="1" />
    </svg>
  ),
  breadboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="6" cy="10" r="1" />
      <circle cx="10" cy="10" r="1" />
      <circle cx="14" cy="10" r="1" />
      <circle cx="18" cy="10" r="1" />
      <circle cx="6" cy="14" r="1" />
      <circle cx="10" cy="14" r="1" />
      <circle cx="14" cy="14" r="1" />
      <circle cx="18" cy="14" r="1" />
    </svg>
  )
};

const PhysicalComponentIcons: Record<string, React.ReactNode> = {
  resistor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="6" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <rect x="6" y="8" width="12" height="8" fill="#f0c75e" stroke="#c9a832" strokeWidth="1" rx="2" />
      <rect x="8" y="8" width="2" height="8" fill="#8B4513" />
      <rect x="12" y="8" width="2" height="8" fill="#000000" />
      <rect x="16" y="8" width="2" height="8" fill="#FF0000" />
    </svg>
  ),
  capacitor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="8" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="12" y1="16" x2="12" y2="22" stroke="#bdc3c7" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="#e67e22" stroke="#d35400" strokeWidth="1" />
    </svg>
  ),
  inductor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="#bdc3c7" strokeWidth="2" />
      <rect x="8" y="6" width="8" height="12" fill="#2c3e50" rx="3" />
      <path d="M 8 9 h 8 M 8 12 h 8 M 8 15 h 8" stroke="#e67e22" strokeWidth="1.5" />
    </svg>
  ),
  vsource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="#2c3e50" rx="2" />
      <rect x="6" y="4" width="12" height="4" fill="#e74c3c" rx="2" />
      <text x="12" y="14" fill="white" fontSize="8" textAnchor="middle" stroke="none">9V</text>
    </svg>
  ),
  isource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="#34495e" rx="2" />
      <path d="M 12 18 V 6 M 9 9 l 3 -3 l 3 3" stroke="#f1c40f" strokeWidth="1.5" />
    </svg>
  ),
  ground: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 4 v 8" />
      <path d="M 6 12 h 12" />
      <path d="M 8 16 h 8" />
      <path d="M 10 20 h 4" />
    </svg>
  ),
  diode: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="6" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <rect x="6" y="8" width="12" height="8" fill="#e74c3c" rx="1" />
      <rect x="16" y="8" width="2" height="8" fill="#2c3e50" />
    </svg>
  ),
  npn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 4 20 Q 12 4 20 20" fill="#34495e" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="#bdc3c7" strokeWidth="2" />
    </svg>
  ),
  pnp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 4 20 Q 12 4 20 20" fill="#34495e" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="#bdc3c7" strokeWidth="2" />
    </svg>
  ),
  nmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="#34495e" rx="1" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="#bdc3c7" strokeWidth="2" />
    </svg>
  ),
  pmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="#34495e" rx="1" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="#bdc3c7" strokeWidth="2" />
    </svg>
  ),
  opamp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" fill="#2c3e50" rx="1" />
      <circle cx="7" cy="9" r="1" fill="#bdc3c7" />
      <line x1="4" y1="8" x2="2" y2="8" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="4" y1="12" x2="2" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="4" y1="16" x2="2" y2="16" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="20" y1="8" x2="22" y2="8" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="20" y1="12" x2="22" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="20" y1="16" x2="22" y2="16" stroke="#bdc3c7" strokeWidth="2" />
    </svg>
  ),
  powersupply: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" fill="#34495e" rx="2" />
      <rect x="6" y="8" width="12" height="6" fill="#1abc9c" />
      <circle cx="8" cy="17" r="1" fill="#e74c3c" />
      <circle cx="16" cy="17" r="1" fill="#3498db" />
    </svg>
  ),
  functiongenerator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" fill="#2c3e50" rx="2" />
      <path d="M 6 12 q 3 -6 6 0 t 6 0" stroke="#f1c40f" strokeWidth="1.5" />
      <circle cx="8" cy="17" r="1" fill="#e74c3c" />
      <circle cx="16" cy="17" r="1" fill="#3498db" />
    </svg>
  ),
  oscilloscope: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" fill="#34495e" rx="2" />
      <rect x="4" y="6" width="12" height="10" fill="#2ecc71" />
      <circle cx="18" cy="8" r="1" fill="#ecf0f1" />
      <circle cx="18" cy="12" r="1" fill="#ecf0f1" />
      <circle cx="18" cy="16" r="1" fill="#ecf0f1" />
    </svg>
  ),
  breadboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="1" rx="2" />
      <circle cx="6" cy="10" r="1" fill="#7f8c8d" />
      <circle cx="10" cy="10" r="1" fill="#7f8c8d" />
      <circle cx="14" cy="10" r="1" fill="#7f8c8d" />
      <circle cx="18" cy="10" r="1" fill="#7f8c8d" />
      <circle cx="6" cy="14" r="1" fill="#7f8c8d" />
      <circle cx="10" cy="14" r="1" fill="#7f8c8d" />
      <circle cx="14" cy="14" r="1" fill="#7f8c8d" />
      <circle cx="18" cy="14" r="1" fill="#7f8c8d" />
    </svg>
  )
};

function App() {
  const { mode, setMode, deleteSelected, circuit, updateComponentParams, rotateSelected, mirrorSelected, editingComponentId, componentToPlace, activeAnalysis, setActiveAnalysis, updateAnalysis, setCustomModels, probes, clearAll, theme, toggleTheme, activeView, setActiveView } = useEditorStore();
  const workerRef = useRef<Worker | null>(null);
  const [nodeVoltages, setNodeVoltages] = useState<Record<string, number>>({});
  const [tranData, setTranData] = useState<{ time: number[], vectors: Record<string, number[]> }>({ time: [], vectors: {} });
  const [acData, setAcData] = useState<{ freq: number[], magnitudes: Record<string, number[]>, phases: Record<string, number[]> }>({ freq: [], magnitudes: {}, phases: {} });
  const [simError, setSimError] = useState<string | null>(null);
  const [autoSimulate, setAutoSimulate] = useState(true);
  const [simFlash, setSimFlash] = useState(false);
  const [customModelsInput, setCustomModelsInput] = useState(circuit.customModels || '');

  useEffect(() => {
    setCustomModelsInput(circuit.customModels || '');
  }, [circuit.customModels]);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'results') {
        setSimError(null);
        const results = e.data.results;
        
        if (activeAnalysis === 'op') {
          const voltages: Record<string, number> = {};
          if (results && results.data) {
            results.data.forEach((d: any) => {
              if (d.type === 'voltage' && d.values.length > 0) {
                voltages[d.name] = d.values[0];
              }
            });
          }
          setNodeVoltages(voltages);
        } else if (activeAnalysis === 'tran') {
          let time: number[] = [];
          const vectors: Record<string, number[]> = {};
          if (results && results.data) {
            results.data.forEach((d: any) => {
              if (d.name === 'time') {
                time = d.values;
              } else if (d.type === 'voltage') {
                vectors[d.name] = d.values;
              }
            });
          }
          setTranData({ time, vectors });
        } else if (activeAnalysis === 'ac') {
          let freq: number[] = [];
          const magnitudes: Record<string, number[]> = {};
          const phases: Record<string, number[]> = {};
          
          if (results && results.data) {
            results.data.forEach((d: any) => {
              if (d.name === 'frequency') {
                freq = d.values.map((v: any) => v.real);
              } else if (d.type === 'voltage') {
                const mag = d.values.map((v: any) => 20 * Math.log10(Math.max(1e-15, Math.hypot(v.real, v.img))));
                const phase = d.values.map((v: any) => Math.atan2(v.img, v.real) * 180 / Math.PI);
                magnitudes[d.name] = mag;
                phases[d.name] = phase;
              }
            });
          }
          setAcData({ freq, magnitudes, phases });
        }
        
        setSimFlash(true);
        setTimeout(() => setSimFlash(false), 500);
      } else if (e.data.type === 'error') {
        const errorMsg = e.data.error?.message || (typeof e.data.error === 'string' ? e.data.error : 'Simulation Failed');
        setSimError(errorMsg);
      }
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, [activeAnalysis]);

  // Debounced Simulation Trigger
  useEffect(() => {
    if (autoSimulate) {
      const timer = setTimeout(() => runSimulation(), 300);
      return () => clearTimeout(timer);
    }
  }, [circuit, autoSimulate, activeAnalysis]);

  const runSimulation = () => {
    if (circuit.components.length === 0) return;
    const generator = new NetlistGenerator();
    
    // Ensure default .tran params exist if running transient
    if (activeAnalysis === 'tran') {
      const tranSettings = circuit.analyses.find(a => a.kind === 'tran');
      if (!tranSettings || !tranSettings.params.step) {
        updateAnalysis('tran', { step: '100u', stop: '10m' });
      }
    } else if (activeAnalysis === 'ac') {
      const acSettings = circuit.analyses.find(a => a.kind === 'ac');
      if (!acSettings || !acSettings.params.variation) {
        updateAnalysis('ac', { variation: 'dec', points: '10', fstart: '1', fstop: '1Meg' });
      }
    }

    const netlist = generator.generate(circuit, activeAnalysis);
    workerRef.current?.postMessage({ type: 'start', netlist });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key === 'Escape') {
        setMode('select');
      } else if (e.key === 'r') {
        rotateSelected();
      } else if (e.key === 'm') {
        mirrorSelected();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          useEditorStore.temporal.getState().redo();
        } else {
          useEditorStore.temporal.getState().undo();
        }
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        useEditorStore.temporal.getState().redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, setMode]);

  const editingComponent = circuit.components.find(c => c.id === editingComponentId);

  const isDark = theme === 'dark';
  
  // Theme palette
  const colors = {
    bg: isDark ? '#1e1e2e' : '#f5f6fa',
    headerBg: isDark ? '#181825' : '#2c3e50',
    toolbarBg: isDark ? '#313244' : '#34495e',
    panelBg: isDark ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    text: isDark ? '#cdd6f4' : '#2c3e50',
    border: isDark ? '#45475a' : '#bdc3c7',
    inputBg: isDark ? '#1e1e2e' : 'white',
    buttonHover: isDark ? '#45475a' : '#2c3e50'
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflow: 'hidden', backgroundColor: colors.bg, color: colors.text }}>
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '10px 20px', 
        backgroundColor: colors.headerBg, 
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>LiveSpice</h1>
          <button 
            onClick={() => runSimulation()}
            style={{ padding: '6px 12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Run Sim
          </button>
          <button 
            onClick={() => setAutoSimulate(!autoSimulate)}
            style={{ padding: '6px 12px', background: autoSimulate ? '#3498db' : '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Auto: {autoSimulate ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {/* Toolbars Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '5px', background: colors.toolbarBg, padding: '5px', borderRadius: '5px' }}>
            <button 
              onClick={() => setMode('select')}
              style={{ padding: '5px', background: mode === 'select' ? '#3498db' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}
              title="Select / Move"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 3 3 l 7.07 16.97 2.51-7.39 7.39-2.51 L 3 3 z" />
                <path d="M 13 13 l 6 6" />
              </svg>
            </button>
            <button 
              onClick={() => setMode('wire')}
              style={{ padding: '5px', background: mode === 'wire' ? '#3498db' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}
              title="Draw Wire"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 5 9 L 19 9" />
                <circle cx="5" cy="9" r="2" fill="currentColor" />
                <circle cx="19" cy="9" r="2" fill="currentColor" />
              </svg>
            </button>
            <button 
              onClick={() => setMode('probe')}
              style={{ padding: '5px', background: mode === 'probe' ? '#3498db' : 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '3px' }}
              title="Add Probe"
            >
              <ProbeMenuIcon size={20} color="white" />
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', background: colors.toolbarBg, padding: '5px', borderRadius: '5px', flexWrap: 'wrap', maxWidth: '350px' }}>
            {Object.entries(ComponentLibrary).map(([type, comp]) => (
              <button 
                key={type}
                title={`Place ${comp.name || type}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('componentType', type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => {
                  setMode('place', type);
                }}
                style={{
                  background: mode === 'place' && componentToPlace === type ? (theme === 'dark' ? '#4c566a' : '#ddd') : 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '6px',
                  borderRadius: '4px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1
                }}
              >
                {activeView === 'breadboard' ? PhysicalComponentIcons[type] : ComponentIcons[type]}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '5px', background: colors.toolbarBg, padding: '5px', borderRadius: '5px' }}>
            <button 
              style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
              onClick={() => useEditorStore.temporal.getState().undo()} title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button 
              style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
              onClick={() => useEditorStore.temporal.getState().redo()} title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
            <button 
              style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
              onClick={() => rotateSelected()} title="Rotate (R)"
            >
              <RotateCw size={18} />
            </button>
            <div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />
            <button 
              style={{ background: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                if (window.confirm("Are you sure you want to clear the entire circuit?")) {
                  clearAll();
                  useEditorStore.temporal.getState().clear();
                }
              }} title="Clear Circuit"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', background: colors.toolbarBg, padding: '5px 10px', borderRadius: '5px' }}>
            <select 
              value={activeAnalysis} 
              onChange={(e) => setActiveAnalysis(e.target.value as 'op' | 'tran' | 'ac')}
              style={{ padding: '5px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: colors.inputBg, color: colors.text }}
            >
              <option value="op">DC (.op)</option>
              <option value="tran">Transient (.tran)</option>
              <option value="ac">AC Sweep (.ac)</option>
            </select>
            {activeAnalysis === 'tran' && (
              <>
                <input 
                  type="text" 
                  placeholder="Step (e.g. 100u)" 
                  value={circuit.analyses.find(a => a.kind === 'tran')?.params.step || '100u'} 
                  onChange={(e) => updateAnalysis('tran', { step: e.target.value })}
                  style={{ width: '80px', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                />
                <input 
                  type="text" 
                  placeholder="Stop (e.g. 10m)" 
                  value={circuit.analyses.find(a => a.kind === 'tran')?.params.stop || '10m'} 
                  onChange={(e) => updateAnalysis('tran', { stop: e.target.value })}
                  style={{ width: '80px', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                />
              </>
            )}
            {activeAnalysis === 'ac' && (
              <>
                <select 
                  value={circuit.analyses.find(a => a.kind === 'ac')?.params.variation || 'dec'}
                  onChange={(e) => updateAnalysis('ac', { variation: e.target.value })}
                  style={{ width: '60px', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                >
                  <option value="dec">Decade</option>
                  <option value="oct">Octave</option>
                  <option value="lin">Linear</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Pts" 
                  value={circuit.analyses.find(a => a.kind === 'ac')?.params.points || '10'} 
                  onChange={(e) => updateAnalysis('ac', { points: e.target.value })}
                  style={{ width: '40px', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  title="Points"
                />
                <input 
                  type="text" 
                  placeholder="FStart" 
                  value={circuit.analyses.find(a => a.kind === 'ac')?.params.fstart || '1'} 
                  onChange={(e) => updateAnalysis('ac', { fstart: e.target.value })}
                  style={{ width: '60px', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  title="Start Frequency"
                />
                <input 
                  type="text" 
                  placeholder="FStop" 
                  value={circuit.analyses.find(a => a.kind === 'ac')?.params.fstop || '1Meg'} 
                  onChange={(e) => updateAnalysis('ac', { fstop: e.target.value })}
                  style={{ width: '60px', padding: '5px', borderRadius: '4px', border: 'none', backgroundColor: colors.inputBg, color: colors.text }}
                  title="Stop Frequency"
                />
              </>
            )}
          </div>

          <button 
            onClick={() => setActiveView(activeView === 'schematic' ? 'breadboard' : 'schematic')}
            style={{ padding: '8px', background: colors.toolbarBg, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Go to {activeView === 'schematic' ? 'Breadboard' : 'Schematic'}
          </button>

          <button 
            onClick={toggleTheme}
            style={{ padding: '8px', background: colors.toolbarBg, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      {simError && (
          <div style={{ position: 'absolute', top: '70px', right: '20px', background: '#e74c3c', color: 'white', padding: '10px', borderRadius: '4px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {simError}
          </div>
      )}

      <main style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden', backgroundColor: colors.bg }}>
        <Canvas nodeVoltages={activeAnalysis === 'op' ? nodeVoltages : undefined} theme={theme} />
        
        {/* Properties Panel */}
        {editingComponent && (
          <div style={{ 
            position: 'absolute', 
            top: 0, right: 0, 
            width: '300px', 
            height: '100%', 
            backgroundColor: colors.panelBg,
            borderLeft: `1px solid ${colors.border}`,
            padding: '20px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            color: colors.text
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: colors.text }}>Properties</h2>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>RefDes</label>
              <input 
                type="text" 
                value={editingComponent.refDes || ''} 
                onChange={e => updateComponentParams(editingComponent.id, { refDes: e.target.value })}
                placeholder={`Auto (${editingComponent.type})`}
                style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: isDark ? '#a6adc8' : '#7f8c8d' }}>Color</label>
              <input 
                type="color"
                value={editingComponent.color || '#000000'}
                onChange={(e) => updateComponentParams(editingComponent.id, { color: e.target.value })}
                style={{ width: '100%', height: '40px', padding: '2px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg }}
              />
            </div>

            {editingComponent.type === 'resistor' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Resistance (Ω)</label>
                <input 
                  type="text" 
                  value={editingComponent.params.resistance || '1k'} 
                  onChange={e => updateComponentParams(editingComponent.id, { resistance: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
                />
              </div>
            )}
            
            {editingComponent.type === 'capacitor' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Capacitance (F)</label>
                <input 
                  type="text" 
                  value={editingComponent.params.capacitance || '1u'} 
                  onChange={e => updateComponentParams(editingComponent.id, { capacitance: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
                />
              </div>
            )}
            
            {editingComponent.type === 'inductor' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Inductance (H)</label>
                <input 
                  type="text" 
                  value={editingComponent.params.inductance || '1m'} 
                  onChange={e => updateComponentParams(editingComponent.id, { inductance: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
                />
              </div>
            )}

            {(editingComponent.type === 'vsource' || editingComponent.type === 'isource') && (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: isDark ? '#a6adc8' : '#7f8c8d' }}>Source Type</label>
                  <select 
                    value={editingComponent.params.type || 'dc'} 
                    onChange={e => updateComponentParams(editingComponent.id, { type: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
                  >
                    <option value="dc">DC</option>
                    <option value="ac">AC</option>
                    <option value="sin">Sine (Transient)</option>
                  </select>
                </div>
                {(!editingComponent.params.type || editingComponent.params.type === 'dc') && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: isDark ? '#a6adc8' : '#7f8c8d' }}>DC Value</label>
                    <input 
                      type="text" 
                      value={editingComponent.params.dc || editingComponent.params.value || '0'} 
                      onChange={e => updateComponentParams(editingComponent.id, { dc: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.inputBg, color: colors.text }}
                    />
                  </div>
                )}
                {editingComponent.params.type === 'sin' && (
                  <>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>DC Offset</label>
                      <input type="text" value={editingComponent.params.offset || '0'} onChange={e => updateComponentParams(editingComponent.id, { offset: e.target.value })} style={{ width: '100%', padding: '5px', boxSizing: 'border-box' }} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Node Voltages Panel (Only in .op mode) */}
        {activeAnalysis === 'op' && (
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: colors.panelBg, padding: '10px', borderRadius: '5px', boxShadow: simFlash ? `0 0 0 2px #2ecc71, 0 4px 12px rgba(0,0,0,0.2)` : '0 2px 4px rgba(0,0,0,0.1)', transition: 'box-shadow 0.3s', pointerEvents: 'none', zIndex: 10 }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: colors.text }}>DC Operating Point</h4>
            {Object.keys(nodeVoltages).length === 0 ? (
              <div style={{ fontSize: '0.9rem', color: isDark ? '#a6adc8' : '#7f8c8d' }}>No nodes available</div>
            ) : (
              Object.entries(nodeVoltages).map(([node, v]) => (
                <div key={node} style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: colors.text }}>
                  {node.padEnd(5)} : {v.toPrecision(4)} V
                </div>
              ))
            )}
          </div>
        )}
      </main>
            {/* Context Menu for Node */}
      
      {/* Custom Models Panel */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: colors.panelBg, padding: '10px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10, width: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: colors.text }}>Custom SPICE Directives</h4>
        <textarea
          value={customModelsInput}
          onChange={(e) => setCustomModelsInput(e.target.value)}
          placeholder=".model MY_DIODE D(...)"
          style={{ width: '100%', height: '80px', padding: '5px', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.8rem', border: `1px solid ${colors.border}`, borderRadius: '4px', resize: 'vertical', backgroundColor: colors.inputBg, color: colors.text }}
        />
        <button
          onClick={() => setCustomModels(customModelsInput)}
          style={{ padding: '6px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', alignSelf: 'flex-end', fontWeight: 'bold' }}
        >
          Apply
        </button>
      </div>
      
      {activeAnalysis === 'tran' && (
        <WaveformViewer data={tranData} probes={probes} />
      )}
      {activeAnalysis === 'ac' && (
        <BodePlot data={acData} />
      )}
    </div>
  );
}

export default App;
