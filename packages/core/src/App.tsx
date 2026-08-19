import { useEffect, useState, useRef } from 'react';
import { Canvas } from './editor/Canvas';
import { useEditorStore } from './store/editorStore';
import { Undo, Redo, RotateCw, Trash2, Settings, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { NetlistGenerator } from './engine/netlist';
import { WaveformViewer } from './editor/WaveformViewer';
import { BodePlot } from './components/BodePlot';
import { PropertyPopup } from './components/PropertyPopup';
import { ProbeMenuIcon } from './editor/ProbeIcon';

import { ScopeWindow } from './components/ScopeWindow';
import { NodeResolver } from './engine/nodeResolver';
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
  function_generator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
      <path d="M 12 2 v 3" />
      <path d="M 12 19 v 3" />
      <path d="M 8 12 Q 10 8 12 12 T 16 12" />
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
  oscilloscope: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <rect x="4" y="6" width="12" height="10" fill="currentColor" opacity="0.2" />
      <circle cx="18" cy="8" r="1" />
      <circle cx="18" cy="12" r="1" />
      <circle cx="18" cy="16" r="1" />
    </svg>
  ),
  multimeter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="6" y="4" width="12" height="6" fill="currentColor" opacity="0.2" rx="1" />
      <circle cx="12" cy="14" r="3" />
      <circle cx="8" cy="19" r="1" />
      <circle cx="16" cy="19" r="1" />
    </svg>
  ),
  current_probe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
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
      <line x1="2" y1="12" x2="6" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="6" y="8" width="12" height="8" fill="var(--highlight)" stroke="var(--accent)" strokeWidth="1" rx="2" />
      <rect x="8" y="8" width="2" height="8" fill="#8B4513" />
      <rect x="12" y="8" width="2" height="8" fill="#000000" />
      <rect x="16" y="8" width="2" height="8" fill="#FF0000" />
    </svg>
  ),
  capacitor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="8" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="16" x2="12" y2="22" stroke="var(--foreground)" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1" />
    </svg>
  ),
  inductor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="8" y="6" width="8" height="12" fill="var(--ink)" rx="3" />
      <path d="M 8 9 h 8 M 8 12 h 8 M 8 15 h 8" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  ),
  vsource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" fill="var(--background)" rx="2" />
      <rect x="6" y="6" width="12" height="6" fill="var(--ink)" rx="1" />
      <circle cx="8" cy="16" r="2" fill="var(--accent)" />
      <circle cx="16" cy="16" r="2" fill="var(--foreground)" />
    </svg>
  ),
  function_generator: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" fill="var(--foreground)" rx="2" />
      <rect x="6" y="6" width="12" height="6" fill="var(--ink)" rx="1" />
      <path d="M 8 9 Q 10 7 12 9 T 16 9" stroke="var(--signal)" strokeWidth="1.5" />
      <circle cx="12" cy="16" r="2" fill="var(--accent)" />
    </svg>
  ),
  isource: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="var(--foreground)" rx="2" />
      <path d="M 12 18 V 6 M 9 9 l 3 -3 l 3 3" stroke="var(--highlight)" strokeWidth="1.5" />
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
      <line x1="2" y1="12" x2="6" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="6" y="8" width="12" height="8" fill="var(--accent)" rx="1" />
      <rect x="16" y="8" width="2" height="8" fill="var(--ink)" />
    </svg>
  ),
  npn: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 4 20 Q 12 4 20 20" fill="var(--foreground)" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  pnp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 4 20 Q 12 4 20 20" fill="var(--foreground)" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  nmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="var(--foreground)" rx="1" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  pmos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" fill="var(--foreground)" rx="1" />
      <line x1="8" y1="20" x2="8" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="12" y1="20" x2="12" y2="24" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="16" y1="20" x2="16" y2="24" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),
  opamp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" fill="var(--ink)" rx="1" />
      <circle cx="7" cy="9" r="1" fill="var(--panel)" />
      <line x1="4" y1="8" x2="2" y2="8" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="4" y1="12" x2="2" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="4" y1="16" x2="2" y2="16" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="20" y1="8" x2="22" y2="8" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="20" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="20" y1="16" x2="22" y2="16" stroke="var(--foreground)" strokeWidth="2" />
    </svg>
  ),

  oscilloscope: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" fill="var(--foreground)" rx="2" />
      <rect x="4" y="6" width="12" height="10" fill="var(--signal)" />
      <circle cx="18" cy="8" r="1" fill="var(--panel)" />
      <circle cx="18" cy="12" r="1" fill="var(--panel)" />
      <circle cx="18" cy="16" r="1" fill="var(--panel)" />
    </svg>
  ),
  multimeter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" fill="var(--highlight)" rx="2" />
      <rect x="6" y="4" width="12" height="6" fill="var(--panel)" rx="1" />
      <circle cx="12" cy="14" r="3" fill="var(--foreground)" />
      <circle cx="8" cy="19" r="1" fill="var(--accent)" />
      <circle cx="16" cy="19" r="1" fill="var(--ink)" />
    </svg>
  ),
  current_probe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" stroke="var(--foreground)" />
      <path d="M12 2v4" stroke="var(--accent)" />
      <path d="M12 18v4" stroke="var(--ink)" />
    </svg>
  ),
  breadboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="1" rx="2" />
      <circle cx="6" cy="10" r="1" fill="var(--ink)" />
      <circle cx="10" cy="10" r="1" fill="var(--ink)" />
      <circle cx="14" cy="10" r="1" fill="var(--ink)" />
      <circle cx="18" cy="10" r="1" fill="var(--ink)" />
      <circle cx="6" cy="14" r="1" fill="var(--ink)" />
      <circle cx="10" cy="14" r="1" fill="var(--ink)" />
      <circle cx="14" cy="14" r="1" fill="var(--ink)" />
      <circle cx="18" cy="14" r="1" fill="var(--ink)" />
    </svg>
  )
};

function App() {
  const { mode, setMode, deleteSelected, circuit, rotateSelected, mirrorSelected, componentToPlace, activeAnalysis, setActiveAnalysis, updateAnalysis,
    setCustomModels,
    autoSimulate,
    setAutoSimulate, probes, clearAll, editingComponentId, activeView, setActiveView,
    showInstruments, setShowInstruments
  } = useEditorStore();
  const theme = useEditorStore(state => state.theme);
  const setTheme = useEditorStore(state => state.setTheme);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      
      // Set initial
      setTheme(mediaQuery.matches ? 'dark' : 'light');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [setTheme]);
  
  const [activeScopeId, setActiveScopeId] = useState<string | null>(null);
  const [showAnalysisSettings, setShowAnalysisSettings] = useState(false);
  const [showMoreComponents, setShowMoreComponents] = useState(false);

  const componentsContainerRef = useRef<HTMLDivElement>(null);
  const [maxVisibleComponents, setMaxVisibleComponents] = useState(6);

  useEffect(() => {
    if (!componentsContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        const itemHeight = 54; // 46px button + 8px gap
        const totalItems = Object.keys(ComponentLibrary).length;
        if (totalItems * itemHeight <= height + 8) {
          setMaxVisibleComponents(totalItems);
        } else {
          setMaxVisibleComponents(Math.max(1, Math.floor((height - itemHeight) / itemHeight)));
        }
      }
    });
    observer.observe(componentsContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (editingComponentId) {
      const comp = circuit.components.find(c => c.id === editingComponentId);
      if (comp?.type === 'oscilloscope') {
        setActiveScopeId(comp.id);
        useEditorStore.getState().setEditingComponent(null);
      }
    }
  }, [editingComponentId, circuit.components]);

  const workerRef = useRef<Worker | null>(null);
  const [nodeVoltages, setNodeVoltages] = useState<Record<string, number>>({});
  const [tranData, setTranData] = useState<{ time: number[], vectors: Record<string, number[]> }>({ time: [], vectors: {} });
  const [acData, setAcData] = useState<{ freq: number[], magnitudes: Record<string, number[]>, phases: Record<string, number[]> }>({ freq: [], magnitudes: {}, phases: {} });
  const [simError, setSimError] = useState<string | null>(null);
  const [simFlash, setSimFlash] = useState(false);
  const [customModelsInput, setCustomModelsInput] = useState(circuit.customModels || '');

  useEffect(() => {
    setCustomModelsInput(circuit.customModels || '');
  }, [circuit.customModels]);

  const initWorker = () => {
    if (workerRef.current) workerRef.current.terminate();
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'results') {
        setSimError(null);
        const results = e.data.results;
        
        if (activeAnalysis === 'op') {
          const voltages: Record<string, number> = {};
          if (results && results.data) {
            results.data.forEach((d: any) => {
              const isVoltage = d.type === 'voltage' || (d.name.startsWith('v(') && !d.name.includes('#branch'));
              if (isVoltage && d.values && d.values.length > 0) {
                const val = d.values[0];
                voltages[d.name] = typeof val === 'object' ? val.real : Number(val);
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
        // Force recreation of the worker on fatal error to reset ngspice WASM state
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
  };

  // Initialize Worker
  useEffect(() => {
    initWorker();
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
    if (import.meta.env.DEV) {
      console.groupCollapsed(`🛠️ Generated Netlist (${activeAnalysis})`);
      console.log(netlist);
      console.groupEnd();
    }
    if (!workerRef.current) {
      initWorker();
    }
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



  const isDark = theme === 'dark';
  
  // Theme palette
  const colors = {
    bg: isDark ? '#20252A' : '#EEEAE4',
    headerBg: isDark ? '#323A3F' : '#E2DCD3',
    toolbarBg: isDark ? '#262D32' : '#D0C8B8',
    panelBg: isDark ? '#323A3F' : '#E2DCD3',
    text: isDark ? '#EEEAE4' : '#30383E',
    border: isDark ? '#EEEAE4' : '#30383E',
    inputBg: isDark ? '#20252A' : '#EEEAE4',
    buttonHover: isDark ? '#EEEAE4' : '#30383E',
    signal: '#367985',
    accent: '#A9553D',
    tech: '#5A8796',
    highlight: '#B9924D'
  };

  return (
    <div data-theme={theme} style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflow: 'hidden', backgroundColor: colors.bg, color: colors.text }}>
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '10px 20px', 
        backgroundColor: colors.headerBg, 
        color: colors.text,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img src={isDark ? '/logo_dark.svg' : '/logo_light.svg'} alt="myEElab logo" style={{ height: '28px' }} />
          <button 
            onClick={() => runSimulation()}
            style={{ padding: '6px 12px', background: 'var(--signal)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Run Sim
          </button>
          <button 
            onClick={() => setAutoSimulate(!autoSimulate)}
            style={{ padding: '6px 12px', background: autoSimulate ? 'var(--tech)' : 'gray', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Auto: {autoSimulate ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {/* Toolbars Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '5px', background: colors.toolbarBg, padding: '5px', borderRadius: '5px' }}>
            <button 
              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => useEditorStore.temporal.getState().undo()} title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button 
              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => useEditorStore.temporal.getState().redo()} title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
            <button 
              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => rotateSelected()} title="Rotate (R)"
            >
              <RotateCw size={18} />
            </button>
            <div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />
            <button 
              style={{ padding: '8px', background: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', borderRadius: '5px' }}
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
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', background: colors.toolbarBg, padding: '5px 10px', borderRadius: '5px', position: 'relative' }}>
            <select 
              value={activeAnalysis} 
              onChange={(e) => {
                setActiveAnalysis(e.target.value as 'op' | 'tran' | 'ac');
                setShowAnalysisSettings(false);
              }}
              style={{ padding: '5px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: colors.inputBg, color: colors.text }}
            >
              <option value="op">DC (.op)</option>
              <option value="tran">Transient (.tran)</option>
              <option value="ac">AC Sweep (.ac)</option>
            </select>
            
            {activeAnalysis !== 'op' && (
              <button
                onClick={() => setShowAnalysisSettings(!showAnalysisSettings)}
                style={{ background: 'transparent', color: showAnalysisSettings ? 'var(--highlight)' : colors.text, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Analysis Settings"
              >
                <Settings size={18} />
              </button>
            )}

            {showAnalysisSettings && activeAnalysis !== 'op' && (
              <div style={{ 
                position: 'absolute', 
                top: '120%', 
                right: 0, 
                background: colors.panelBg, 
                padding: '15px', 
                borderRadius: '6px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '220px',
                border: `1px solid ${colors.border}`
              }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: colors.text, borderBottom: `1px solid ${colors.border}`, paddingBottom: '5px' }}>
                  {activeAnalysis === 'tran' ? 'Transient Settings' : 'AC Sweep Settings'}
                </h4>
                
                {activeAnalysis === 'tran' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Step Time (e.g. 100u)</label>
                      <input 
                        type="text" 
                        value={circuit.analyses.find(a => a.kind === 'tran')?.params.step || '100u'} 
                        onChange={(e) => updateAnalysis('tran', { step: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Stop Time (e.g. 10m)</label>
                      <input 
                        type="text" 
                        value={circuit.analyses.find(a => a.kind === 'tran')?.params.stop || '10m'} 
                        onChange={(e) => updateAnalysis('tran', { stop: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      />
                    </div>
                  </>
                )}
                
                {activeAnalysis === 'ac' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Sweep Type</label>
                      <select 
                        value={circuit.analyses.find(a => a.kind === 'ac')?.params.variation || 'dec'}
                        onChange={(e) => updateAnalysis('ac', { variation: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      >
                        <option value="dec">Decade</option>
                        <option value="oct">Octave</option>
                        <option value="lin">Linear</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', color: colors.text }}>Points / Sweep</label>
                      <input 
                        type="text" 
                        value={circuit.analyses.find(a => a.kind === 'ac')?.params.points || '10'} 
                        onChange={(e) => updateAnalysis('ac', { points: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: colors.text }}>Start Freq</label>
                        <input 
                          type="text" 
                          value={circuit.analyses.find(a => a.kind === 'ac')?.params.fstart || '1'} 
                          onChange={(e) => updateAnalysis('ac', { fstart: e.target.value })}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: colors.text }}>Stop Freq</label>
                        <input 
                          type="text" 
                          value={circuit.analyses.find(a => a.kind === 'ac')?.params.fstop || '1Meg'} 
                          onChange={(e) => updateAnalysis('ac', { fstop: e.target.value })}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '5px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button 
            title={showInstruments ? 'Hide Instruments' : 'Show Instruments'}
            onClick={() => setShowInstruments(!showInstruments)}
            style={{ padding: '8px 12px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '34px' }}
          >
            {showInstruments ? <EyeOff size={18} /> : <Eye size={18} />}
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
              {showInstruments ? 'Hide Instruments' : 'Show Instruments'}
            </span>
          </button>

          <button 
            onClick={() => setActiveView(activeView === 'schematic' ? 'breadboard' : 'schematic')}
            style={{ padding: '8px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Go to {activeView === 'schematic' ? 'Breadboard' : 'Schematic'}
          </button>

          <button 
            onClick={() => useEditorStore.getState().setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ padding: '8px', background: colors.toolbarBg, color: colors.text, border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ 
          width: '70px', 
          backgroundColor: colors.headerBg, 
          borderRight: `1px solid ${colors.border}`,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '10px 0', 
          gap: '15px',
          overflow: 'visible'
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
            <button 
              onClick={() => setMode('select')}
              style={{ padding: '8px', background: mode === 'select' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px' }}
              title="Select / Move"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 3 3 l 7.07 16.97 2.51-7.39 7.39-2.51 L 3 3 z" />
                <path d="M 13 13 l 6 6" />
              </svg>
            </button>
            <button 
              onClick={() => setMode('wire')}
              style={{ padding: '8px', background: mode === 'wire' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px' }}
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
              style={{ padding: '8px', background: mode === 'probe' ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px' }}
              title="Add Probe"
            >
              <ProbeMenuIcon size={20} color={colors.text} />
            </button>
          </div>

          <div style={{ width: '80%', height: '1px', backgroundColor: colors.border }} />

                    <div ref={componentsContainerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center', overflow: 'visible' }}>
            {Object.entries(ComponentLibrary).slice(0, maxVisibleComponents).map(([type, comp]) => (
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
                  background: mode === 'place' && componentToPlace === type ? 'var(--highlight)' : 'transparent',
                  border: 'none',
                  color: colors.text,
                  padding: '8px',
                  borderRadius: '5px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', display: 'flex' }}>
                  {activeView === 'breadboard' ? PhysicalComponentIcons[type] : ComponentIcons[type]}
                </div>
              </button>
            ))}

            {Object.keys(ComponentLibrary).length > maxVisibleComponents && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowMoreComponents(!showMoreComponents)}
                style={{ padding: '8px', background: showMoreComponents ? 'var(--highlight)' : 'transparent', border: 'none', color: colors.text, cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="More Components"
              >
                <MoreHorizontal size={20} />
              </button>

              {showMoreComponents && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '-150%',
                  marginLeft: '15px',
                  background: colors.panelBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '5px',
                  padding: '10px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  {Object.entries(ComponentLibrary).slice(maxVisibleComponents).map(([type, comp]) => (
                    <button 
                      key={type}
                      title={`Place ${comp.name || type}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('componentType', type);
                        e.dataTransfer.effectAllowed = 'copy';
                        setShowMoreComponents(false);
                      }}
                      onClick={() => {
                        setMode('place', type);
                        setShowMoreComponents(false);
                      }}
                      style={{
                        background: mode === 'place' && componentToPlace === type ? 'var(--highlight)' : 'transparent',
                        border: 'none',
                        color: colors.text,
                        padding: '8px',
                        borderRadius: '5px',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', display: 'flex' }}>
                        {activeView === 'breadboard' ? PhysicalComponentIcons[type] : ComponentIcons[type]}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
          
          </aside>

        <main style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden', backgroundColor: colors.bg }}>
        <Canvas nodeVoltages={activeAnalysis === 'op' ? nodeVoltages : undefined} theme={theme} />
        
        {/* Properties Popup */}
        <PropertyPopup theme={theme} />

        {/* Node Voltages Panel (Only in .op mode) */}
        {activeAnalysis === 'op' && (
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: colors.panelBg, padding: '10px', borderRadius: '5px', boxShadow: simFlash ? `0 0 0 2px #2ecc71, 0 4px 12px rgba(0,0,0,0.2)` : '0 2px 4px rgba(0,0,0,0.1)', transition: 'box-shadow 0.3s', pointerEvents: 'none', zIndex: 10 }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: colors.text }}>DC Operating Point</h4>
            {Object.keys(nodeVoltages).length === 0 ? (
              <div style={{ fontSize: '0.9rem', color: isDark ? 'var(--ink)' : '#7f8c8d' }}>No nodes available</div>
            ) : (
              Object.entries(nodeVoltages).map(([node, v]) => (
                <div key={node} style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: colors.text, display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--signal)' }}>Node {node}:</span>
                  <span>
                    {(() => {
                      const abs = Math.abs(v);
                      if (abs === 0) return '0 V';
                      if (abs >= 1e3) return `${parseFloat((v / 1e3).toFixed(3))} kV`;
                      if (abs >= 1) return `${parseFloat(v.toFixed(3))} V`;
                      if (abs >= 1e-3) return `${parseFloat((v * 1e3).toFixed(3))} mV`;
                      if (abs >= 1e-6) return `${parseFloat((v * 1e6).toFixed(3))} µV`;
                      return `${v.toExponential(2)} V`;
                    })()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      </div>
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
          style={{ padding: '6px 10px', background: 'var(--signal)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', alignSelf: 'flex-end', fontWeight: 'bold' }}
        >
          Apply
        </button>
      </div>
      
      {activeAnalysis === 'tran' && activeView !== 'breadboard' && (
        <WaveformViewer data={tranData} probes={probes} />
      )}
      {activeAnalysis === 'ac' && activeView !== 'breadboard' && (
        <BodePlot data={acData} />
      )}

      {activeScopeId && (
        (() => {
          const scopeComp = circuit.components.find(c => c.id === activeScopeId);
          if (!scopeComp) return null;
          const resolver = new NodeResolver();
          const { components } = resolver.resolve(circuit);
          const nodeMap = components.get(activeScopeId);
          if (!nodeMap) return null;
          
          return (
            <ScopeWindow
              oscilloscope={scopeComp}
              data={tranData}
              onClose={() => setActiveScopeId(null)}
              nodeMap={nodeMap}
            />
          );
        })()
      )}
    </div>
  );
}

export default App;
