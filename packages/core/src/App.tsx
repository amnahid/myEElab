import React, { useEffect, useState, useRef } from 'react';
import { Canvas, getLastCanvasPointerPos } from './editor/Canvas';
import { useEditorStore } from './store/editorStore';
import { useSimulationStore } from './store/simulationStore';
import { Undo, Redo, RotateCw, FlipHorizontal, Trash2, Eye, EyeOff, MoreHorizontal, Cpu, BookOpen, Copy, Scissors, ClipboardPaste, ChevronUp, ChevronDown } from 'lucide-react';
import { NetlistGenerator, parseSpiceValue } from './engine/netlist';
import { WaveformViewer } from './editor/WaveformViewer';
import { PropertyPopup } from './components/PropertyPopup';
import { ProbeMenuIcon } from './editor/ProbeIcon';

import { ScopeWindow } from './components/ScopeWindow';
import { NodeResolver } from './engine/nodeResolver';
import { ComponentLibrary } from './engine/library';
import { parseProteusNetlist, parsePdsprjExperimental } from './importers/proteus';
import { ComponentBrowserModal } from './components/ComponentBrowserModal';
import { AnalysisModeSelector } from './components/AnalysisModeSelector';

const renderGenericIcon = (label: string) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4" width="14" height="16" rx="2" fill="currentColor" fillOpacity="0.1" />
    <line x1="2" y1="8" x2="5" y2="8" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="2" y1="16" x2="5" y2="16" />
    <line x1="19" y1="8" x2="22" y2="8" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="19" y1="16" x2="22" y2="16" />
    <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">
      {label}
    </text>
  </svg>
);

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
  transformer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 6 3 v 3 c 4 0 4 4 0 4 c 4 0 4 4 0 4 c 4 0 4 4 0 4 v 3" />
      <path d="M 18 3 v 3 c -4 0 -4 4 0 4 c -4 0 -4 4 0 4 c -4 0 -4 4 0 4 v 3" />
      <line x1="10" y1="3" x2="10" y2="21" />
      <line x1="14" y1="3" x2="14" y2="21" />
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
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
      <path d="M 12 2 v 3" />
      <path d="M 12 19 v 3" />
      <path d="M 8 13.5 h 2 v -3 h 4 v 3 h 2" />
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
  led: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 2 v 6" />
      <path d="M 8 8 l 8 0 l -4 8 z" fill="currentColor" />
      <path d="M 8 16 h 8" />
      <path d="M 12 16 v 6" />
      <path d="M 16 7 l 4 -4" />
      <path d="M 18 9 l 4 -4" />
    </svg>
  ),
  zener: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 12 2 v 6" />
      <path d="M 8 8 l 8 0 l -4 8 z" fill="currentColor" />
      <path d="M 8 14 l 0 2 h 8 l 0 2" />
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
  ne555: renderGenericIcon("555"),
  lm7805: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="2" width="14" height="6" fill="#bdc3c7" stroke="#7f8c8d" />
      <circle cx="12" cy="5" r="1.5" fill="#7f8c8d" />
      <rect x="5" y="8" width="14" height="10" rx="1" fill="currentColor" fillOpacity="0.2" />
      <line x1="8" y1="18" x2="8" y2="23" />
      <line x1="12" y1="18" x2="12" y2="23" />
      <line x1="16" y1="18" x2="16" y2="23" />
      <text x="12" y="15" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" fontWeight="bold">7805</text>
    </svg>
  ),
  tl072: renderGenericIcon("TL072"),
  "74hc00": renderGenericIcon("7400"),
  "74hc04": renderGenericIcon("7404"),
  "74hc08": renderGenericIcon("7408"),
  "74hc32": renderGenericIcon("7432"),
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
  ),
  switch: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="7" y2="12" />
      <circle cx="8.5" cy="12" r="1.5" />
      <line x1="9" y1="11" x2="15" y2="5" />
      <circle cx="15.5" cy="12" r="1.5" />
      <line x1="17" y1="12" x2="22" y2="12" />
    </svg>
  ),
  pushbutton: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="7" y2="12" />
      <circle cx="8.5" cy="12" r="1.5" />
      <circle cx="15.5" cy="12" r="1.5" />
      <line x1="17" y1="12" x2="22" y2="12" />
      <line x1="8" y1="8" x2="16" y2="8" strokeWidth="2.5" />
      <line x1="12" y1="8" x2="12" y2="3" strokeWidth="2" />
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
  transformer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Pins */}
      <line x1="6" y1="2" x2="6" y2="6" stroke="#f1c40f" strokeWidth="2" />
      <line x1="6" y1="18" x2="6" y2="22" stroke="#f1c40f" strokeWidth="2" />
      <line x1="18" y1="2" x2="18" y2="6" stroke="#f1c40f" strokeWidth="2" />
      <line x1="18" y1="18" x2="18" y2="22" stroke="#f1c40f" strokeWidth="2" />
      
      {/* Core Top/Bottom */}
      <rect x="2" y="4" width="20" height="4" fill="#bdc3c7" stroke="none" rx="1" />
      <rect x="2" y="16" width="20" height="4" fill="#bdc3c7" stroke="none" rx="1" />
      
      {/* Bobbins and Coils */}
      <rect x="2" y="8" width="8" height="2" fill="#f5eedc" stroke="none" />
      <rect x="2" y="14" width="8" height="2" fill="#f5eedc" stroke="none" />
      <rect x="4" y="10" width="4" height="4" fill="#b84e14" stroke="none" />
      
      <rect x="14" y="8" width="8" height="2" fill="#f5eedc" stroke="none" />
      <rect x="14" y="14" width="8" height="2" fill="#f5eedc" stroke="none" />
      <rect x="16" y="10" width="4" height="4" fill="#b84e14" stroke="none" />
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
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" fill="var(--foreground)" rx="2" />
      <rect x="6" y="6" width="12" height="6" fill="var(--ink)" rx="1" />
      <path d="M 8 10 h 2 v -3 h 4 v 3 h 2" stroke="var(--signal)" strokeWidth="1.2" />
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
  led: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="6" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="#e74c3c" stroke="var(--ink)" strokeWidth="1" />
      <line x1="16" y1="8" x2="16" y2="16" stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  ),
  zener: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="6" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="6" y="9" width="12" height="6" fill="#e67e22" rx="1" />
      <rect x="15" y="9" width="3" height="6" fill="var(--ink)" />
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
  ne555: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="16" rx="1" fill="#1e272e" stroke="#111" />
      <circle cx="12" cy="4" r="1.5" fill="#111" />
      <circle cx="8" cy="7" r="0.8" fill="#718093" />
      <line x1="2" y1="8" x2="5" y2="8" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="2" y1="12" x2="5" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="2" y1="16" x2="5" y2="16" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="19" y1="8" x2="22" y2="8" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="19" y1="12" x2="22" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="19" y1="16" x2="22" y2="16" stroke="#bdc3c7" strokeWidth="2" />
      <text x="12" y="14" textAnchor="middle" fontSize="5.5" fill="#d2dae2" stroke="none" fontWeight="bold">555</text>
    </svg>
  ),
  lm7805: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="2" width="14" height="6" fill="#bdc3c7" stroke="#7f8c8d" />
      <circle cx="12" cy="5" r="1.5" fill="#7f8c8d" />
      <rect x="5" y="8" width="14" height="10" rx="1" fill="#2c3e50" stroke="#1a252f" />
      <line x1="8" y1="18" x2="8" y2="23" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="12" y1="18" x2="12" y2="23" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="16" y1="18" x2="16" y2="23" stroke="#bdc3c7" strokeWidth="2" />
      <text x="12" y="15" textAnchor="middle" fontSize="5" fill="#ecf0f1" stroke="none" fontWeight="bold">7805</text>
    </svg>
  ),
  tl072: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="16" rx="1" fill="#1e272e" stroke="#111" />
      <circle cx="12" cy="4" r="1.5" fill="#111" />
      <circle cx="8" cy="7" r="0.8" fill="#718093" />
      <line x1="2" y1="8" x2="5" y2="8" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="2" y1="12" x2="5" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="2" y1="16" x2="5" y2="16" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="19" y1="8" x2="22" y2="8" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="19" y1="12" x2="22" y2="12" stroke="#bdc3c7" strokeWidth="2" />
      <line x1="19" y1="16" x2="22" y2="16" stroke="#bdc3c7" strokeWidth="2" />
      <text x="12" y="14" textAnchor="middle" fontSize="4.5" fill="#d2dae2" stroke="none" fontWeight="bold">TL072</text>
    </svg>
  ),
  "74hc00": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="1" fill="#1e272e" stroke="#111" />
      <circle cx="12" cy="2" r="1.5" fill="#111" />
      <line x1="2" y1="5" x2="5" y2="5" stroke="#bdc3c7" strokeWidth="1.5" />
      <line x1="2" y1="8" x2="5" y2="8" stroke="#bdc3c7" strokeWidth="1.5" />
      <line x1="2" y1="11" x2="5" y2="11" stroke="#bdc3c7" strokeWidth="1.5" />
      <line x1="2" y1="14" x2="5" y2="14" stroke="#bdc3c7" strokeWidth="1.5" />
      <line x1="19" y1="5" x2="22" y2="5" stroke="#bdc3c7" strokeWidth="1.5" />
      <line x1="19" y1="8" x2="22" y2="8" stroke="#bdc3c7" strokeWidth="1.5" />
      <line x1="19" y1="11" x2="22" y2="11" stroke="#bdc3c7" strokeWidth="1.5" />
      <line x1="19" y1="14" x2="22" y2="14" stroke="#bdc3c7" strokeWidth="1.5" />
      <text x="12" y="13" textAnchor="middle" fontSize="4.5" fill="#d2dae2" stroke="none" fontWeight="bold">7400</text>
    </svg>
  ),
  "74hc04": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="1" fill="#1e272e" stroke="#111" />
      <circle cx="12" cy="2" r="1.5" fill="#111" />
      <text x="12" y="13" textAnchor="middle" fontSize="4.5" fill="#d2dae2" stroke="none" fontWeight="bold">7404</text>
    </svg>
  ),
  "74hc08": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="1" fill="#1e272e" stroke="#111" />
      <circle cx="12" cy="2" r="1.5" fill="#111" />
      <text x="12" y="13" textAnchor="middle" fontSize="4.5" fill="#d2dae2" stroke="none" fontWeight="bold">7408</text>
    </svg>
  ),
  "74hc32": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="1" fill="#1e272e" stroke="#111" />
      <circle cx="12" cy="2" r="1.5" fill="#111" />
      <text x="12" y="13" textAnchor="middle" fontSize="4.5" fill="#d2dae2" stroke="none" fontWeight="bold">7432</text>
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
  ),
  switch: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="12" x2="4" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="20" y1="12" x2="23" y2="12" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="4" y="7" width="16" height="10" rx="2" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="1" />
      <rect x="7" y="9" width="10" height="6" rx="1" fill="var(--ink)" />
      <rect x="7" y="8" width="5" height="8" rx="1" fill="#22c55e" stroke="var(--ink)" strokeWidth="0.5" />
    </svg>
  ),
  pushbutton: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="14" height="14" rx="2" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="1" />
      <circle cx="12" cy="12" r="4.5" fill="#e74c3c" />
    </svg>
  )
};

interface DCOperatingPointPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  colors: any;
  isDark: boolean;
  simFlash: boolean;
}

const DCOperatingPointPanel: React.FC<DCOperatingPointPanelProps> = React.memo(({
  isOpen,
  onToggle,
  colors,
  isDark,
  simFlash
}) => {
  const nodeVoltages = useSimulationStore(state => 
    Object.keys(state.operatingPointVoltages).length > 0 ? state.operatingPointVoltages : state.nodeVoltages
  );

  return (
    <div style={{ 
      position: 'absolute', 
      bottom: '20px', 
      left: '20px', 
      background: colors.panelBg, 
      padding: isOpen ? '10px' : '6px 12px', 
      borderRadius: '5px', 
      boxShadow: simFlash ? `0 0 0 2px #2ecc71, 0 4px 12px rgba(0,0,0,0.2)` : '0 2px 4px rgba(0,0,0,0.1)', 
      transition: 'box-shadow 0.3s', 
      zIndex: 10,
      border: `1px solid ${colors.border}`,
      maxHeight: isOpen ? '250px' : 'auto',
      overflowY: isOpen ? 'auto' : 'visible'
    }}>
      <div 
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '8px', userSelect: 'none' }}
      >
        <h4 style={{ margin: 0, fontSize: '0.85rem', color: colors.text }}>DC Operating Point</h4>
        <div style={{ color: colors.text, opacity: 0.7, display: 'flex', alignItems: 'center' }}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>
      {isOpen && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Object.keys(nodeVoltages).length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: isDark ? 'var(--ink)' : '#7f8c8d' }}>No nodes available</div>
          ) : (
            Object.entries(nodeVoltages)
              .filter(([node]) => !node.toLowerCase().includes('.'))
              .map(([node, v]) => (
              <div key={node} style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: colors.text, display: 'flex', gap: '8px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--signal)' }}>Node {node}:</span>
                <span>
                  {(() => {
                    const isCurrent = node.toLowerCase().startsWith('i(');
                    const unit = isCurrent ? 'A' : 'V';
                    const abs = Math.abs(v);
                    if (abs === 0) return `0 ${unit}`;
                    if (abs >= 1e3) return `${parseFloat((v / 1e3).toFixed(3))} k${unit}`;
                    if (abs >= 1) return `${parseFloat(v.toFixed(3))} ${unit}`;
                    if (abs >= 1e-3) return `${parseFloat((v * 1e3).toFixed(3))} m${unit}`;
                    if (abs >= 1e-6) return `${parseFloat((v * 1e6).toFixed(3))} µ${unit}`;
                    return `${v.toExponential(2)} ${unit}`;
                  })()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

function App() {
  const [importWarnings, setImportWarnings] = useState<string[] | null>(null);
  const [importComponentsOnly, setImportComponentsOnly] = useState(false);
  const [isComponentBrowserOpen, setIsComponentBrowserOpen] = useState(false);
  const { mode, setMode, deleteSelected, circuit, rotateSelected, mirrorSelected, componentToPlace, activeAnalysis, setActiveAnalysis, updateAnalysis,
    setCustomModels,
    autoSimulate,
    setAutoSimulate, probes, clearAll, editingComponentId, activeView, setActiveView,
    showInstruments, setShowInstruments,
    copySelected, cutSelected, paste, duplicateSelected, selectedIds,
    selectAll, moveSelected
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
  const moreComponentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoreComponents) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreComponentsRef.current && !moreComponentsRef.current.contains(e.target as Node)) {
        setShowMoreComponents(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreComponents]);

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
  const [tranData, setTranData] = useState<{ time: number[], vectors: Record<string, number[]> }>({ time: [], vectors: {} });
  const [acData, setAcData] = useState<{ freq: number[], magnitudes: Record<string, number[]>, phases: Record<string, number[]> }>({ freq: [], magnitudes: {}, phases: {} });
  const [simError, setSimError] = useState<string | null>(null);
  const [simFlash, setSimFlash] = useState(false);
  const [customModelsInput, setCustomModelsInput] = useState(circuit.customModels || '');
  const [isCustomModelsOpen, setIsCustomModelsOpen] = useState(Boolean(circuit.customModels && circuit.customModels.trim().length > 0));
  const [isDcPanelOpen, setIsDcPanelOpen] = useState(false);

  const lastNodeVoltagesRef = useRef<Record<string, number>>({});
  const lastStructureSigRef = useRef<string>('');
  const isSimulatingRef = useRef(false);
  const runSimulationRef = useRef<(options?: { resetState?: boolean }) => void>(() => {});

  const getStructureSig = (c: typeof circuit) => {
    const compStr = c.components.map(comp => `${comp.id}:${comp.type}`).sort().join(';');
    const wireStr = c.wires.map(w => `${w.id}:${w.points.map(p => `${p.x},${p.y}`).join('-')}`).sort().join(';');
    return `${compStr}|${wireStr}`;
  };

  useEffect(() => {
    setCustomModelsInput(circuit.customModels || '');
  }, [circuit.customModels]);

  const initWorker = () => {
    if (workerRef.current) workerRef.current.terminate();
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      isSimulatingRef.current = false;
      if (e.data.type === 'results') {
        setSimError(null);
        const results = e.data.results;
        const acResults = e.data.acResults;
        
        if (activeAnalysis === 'op') {
          const voltages: Record<string, number> = {};
          if (results && results.data) {
            results.data.forEach((d: any) => {
              const isVoltage = (d.name.startsWith('v(') && !d.name.includes('#branch')) || d.type === 'voltage' || d.type === 'current';
              if (isVoltage && d.values && d.values.length > 0) {
                const val = d.values[0];
                voltages[d.name] = typeof val === 'object' ? val.real : Number(val);
              }
            });
          }
          useSimulationStore.getState().setOperatingPointVoltages(voltages);
          useSimulationStore.getState().setNodeVoltages(voltages);
          lastNodeVoltagesRef.current = voltages;
        } else if (activeAnalysis === 'tran' || activeAnalysis === 'interactive') {
          let time: number[] = [];
          const vectors: Record<string, number[]> = {};
          const voltages: Record<string, number> = {};
          if (results && results.data) {
            results.data.forEach((d: any) => {
              if (d.name === 'time') {
                time = d.values;
              } else {
                vectors[d.name] = d.values;
              }
              const isVoltageOrCurrent = (d.name.startsWith('v(') && !d.name.includes('#branch')) || d.type === 'voltage' || d.type === 'current';
              if (isVoltageOrCurrent && d.values && d.values.length > 0) {
                const val = d.values[d.values.length - 1]; // Settled / final operating point
                voltages[d.name] = typeof val === 'object' ? val.real : Number(val);
              }
            });
          }
          setTranData({ time, vectors });
          useSimulationStore.getState().setOperatingPointVoltages(voltages);
          useSimulationStore.getState().setNodeVoltages(voltages);
          lastNodeVoltagesRef.current = voltages;

          if (acResults && acResults.data) {
            let freq: number[] = [];
            const magnitudes: Record<string, number[]> = {};
            const phases: Record<string, number[]> = {};
            
            acResults.data.forEach((d: any) => {
              if (d.name === 'frequency') {
                freq = d.values.map((v: any) => v.real !== undefined ? v.real : Number(v));
              } else {
                const mag = d.values.map((v: any) => 20 * Math.log10(Math.max(1e-15, Math.hypot(v.real, v.img))));
                const phase = d.values.map((v: any) => Math.atan2(v.img, v.real) * 180 / Math.PI);
                magnitudes[d.name] = mag;
                phases[d.name] = phase;
              }
            });
            setAcData({ freq, magnitudes, phases });
          }
        } else if (activeAnalysis === 'ac') {
          let freq: number[] = [];
          const magnitudes: Record<string, number[]> = {};
          const phases: Record<string, number[]> = {};
          
          if (results && results.data) {
            results.data.forEach((d: any) => {
              if (d.name === 'frequency') {
                freq = d.values.map((v: any) => v.real);
              } else {
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
        setTranData({ time: [], vectors: {} });
        setAcData({ freq: [], magnitudes: {}, phases: {} });
        useSimulationStore.getState().resetSimulation();
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

  // Real-time animated playback of transient simulation on the schematic canvas
  useEffect(() => {
    if (!tranData || !tranData.time || tranData.time.length < 2) return;
    if (activeAnalysis !== 'tran' && activeAnalysis !== 'interactive') return;

    let animId: number;
    const startWallTime = performance.now();
    const t0 = tranData.time[0];
    const tEnd = tranData.time[tranData.time.length - 1];
    const totalSimDuration = tEnd - t0;
    if (totalSimDuration <= 0) return;

    // Access latest circuit state without binding useEffect to every circuit reference mutation
    const currentCircuit = useEditorStore.getState().circuit;

    // Check if circuit is driven by continuous periodic clocks/oscillators vs interactive manual switches
    const hasPeriodicSource = currentCircuit.components.some(c => 
      c.type === 'clock' || 
      (c.type === 'function_generator' && c.params?.frequency && parseFloat(String(c.params.frequency)) > 0)
    );

    // Determine visual playback duration:
    // If continuous periodic source: pace playback (1.5s - 3.0s) so human eyes can observe transitions.
    // If interactive manual switches/buttons without clocks: play at 1:1 real-time speed (up to 0.3s) so it feels instantaneous and responsive!
    const visualDuration = hasPeriodicSource 
      ? Math.max(1.5, Math.min(3.0, totalSimDuration))
      : Math.min(0.3, totalSimDuration);
    const speedRatio = hasPeriodicSource 
      ? totalSimDuration / visualDuration
      : (totalSimDuration <= 0.3 ? 1.0 : totalSimDuration / 0.3);

    // Pre-calculate LED pin connections once per tranData change
    const resolver = new NodeResolver();
    const resolved = resolver.resolve(currentCircuit);
    const ledPinNodes: { id: string; anodeNode: string; cathodeNode: string }[] = [];
    for (const comp of currentCircuit.components) {
      if (comp.type === 'led') {
        const pinMap = resolved.components.get(comp.id);
        if (pinMap) {
          const n1 = pinMap.get('1') || '0';
          const n2 = pinMap.get('2') || '0';
          ledPinNodes.push({
            id: comp.id,
            anodeNode: n1 === '0' ? '' : `v(${n1})`,
            cathodeNode: n2 === '0' ? '' : `v(${n2})`
          });
        }
      }
    }

    // In interactive workbench, if the circuit has interactive controls or sequential logic,
    // settle and hold steady state when totalSimDuration is reached rather than abruptly rewinding to t=0!
    const hasInteractiveParts = currentCircuit.components.some(c => 
      c.type === 'switch' || c.type === 'pushbutton' || c.type === 'potentiometer'
    );
    const hasSequentialParts = currentCircuit.components.some(c => 
      c.type.startsWith('74') || c.type === 'd_flip_flop' || c.type === 'jk_flip_flop' || c.type === 'sr_latch'
    );
    const isLooping = activeAnalysis === 'tran' || 
      (activeAnalysis === 'interactive' && !hasInteractiveParts && !hasSequentialParts && hasPeriodicSource);

    let lastIdx = -1;

    const tick = () => {
      const wallElapsed = (performance.now() - startWallTime) / 1000;
      const rawElapsed = wallElapsed * speedRatio;

      const simElapsed = isLooping 
        ? (rawElapsed % totalSimDuration) 
        : Math.min(totalSimDuration, rawElapsed);

      const targetTime = t0 + simElapsed;

      // Binary search for nearest time index
      let low = 0;
      let high = tranData.time.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (tranData.time[mid] < targetTime) low = mid + 1;
        else high = mid - 1;
      }
      const idx = Math.min(tranData.time.length - 1, Math.max(0, low));

      if (idx !== lastIdx) {
        lastIdx = idx;

        // Extract voltages at this instant
        const voltages: Record<string, number> = {};
        for (const [key, values] of Object.entries(tranData.vectors)) {
          if (values && values.length > idx) {
            voltages[key] = values[idx];
          }
        }

        // Compute LED states
        const ledStates: Record<string, { isOn: boolean; intensity: number }> = {};
        for (const led of ledPinNodes) {
          const vAnode = led.anodeNode ? (voltages[led.anodeNode] || 0) : 0;
          const vCathode = led.cathodeNode ? (voltages[led.cathodeNode] || 0) : 0;
          const vDrop = vAnode - vCathode;
          if (vDrop > 1.4) {
            const intensity = Math.min(1, Math.max(0, (vDrop - 1.4) / 0.8));
            ledStates[led.id] = { isOn: true, intensity };
          } else {
            ledStates[led.id] = { isOn: false, intensity: 0 };
          }
        }

        useSimulationStore.getState().setNodeVoltages(voltages, ledStates);
        lastNodeVoltagesRef.current = voltages;
      }

      if (!isLooping && rawElapsed >= totalSimDuration) {
        if (activeAnalysis === 'interactive' && hasPeriodicSource && autoSimulate) {
          if (!isSimulatingRef.current) {
            runSimulationRef.current?.();
          }
        }
        return; // Settle and hold steady state
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [tranData, activeAnalysis]);

  // Debounced Simulation Trigger (faster 40ms debounce for snappy switch response)
  useEffect(() => {
    if (autoSimulate) {
      const timer = setTimeout(() => runSimulation(), 40);
      return () => clearTimeout(timer);
    }
  }, [circuit, autoSimulate, activeAnalysis]);

  const runSimulation = (options?: { resetState?: boolean }) => {
    runSimulationRef.current = runSimulation;
    if (circuit.components.length === 0) return;
    setSimError(null);

    if (options?.resetState) {
      lastNodeVoltagesRef.current = {};
    }

    const currentSig = getStructureSig(circuit);
    if (currentSig !== lastStructureSigRef.current) {
      lastStructureSigRef.current = currentSig;
      lastNodeVoltagesRef.current = {};
    }

    // Deep clone circuit to avoid mutating state directly
    const activeCircuit = JSON.parse(JSON.stringify(circuit));
    activeCircuit.customModels = customModelsInput;
    
    // Ensure analyses array exists and has the active analysis (vital for imported circuits)
    if (!activeCircuit.analyses) activeCircuit.analyses = [];
    if (!activeCircuit.analyses.find((a: any) => a.kind === activeAnalysis)) {
      activeCircuit.analyses.push({ kind: activeAnalysis, params: {} });
    }

    const generator = new NetlistGenerator();
    
    // Ensure default params exist on activeCircuit (without mutating global editorStore)
    if (activeAnalysis === 'interactive') {
      let tranSettings = activeCircuit.analyses.find((a: any) => a.kind === 'tran');
      if (!tranSettings) {
        tranSettings = { kind: 'tran', params: {} };
        activeCircuit.analyses.push(tranSettings);
      }
      
      let minFreq = Infinity;
      for (const c of activeCircuit.components) {
        if (c.type === "clock") {
          const f = parseFloat(c.params.frequency?.toString() || "1000");
          if (f > 0 && f < minFreq) minFreq = f;
        } else if (c.type === "function_generator" && c.params?.frequency) {
          const f = parseFloat(c.params.frequency?.toString() || "1000");
          if (f > 0 && f < minFreq) minFreq = f;
        }
      }

      const isDefaultStop = !tranSettings.params.stop || tranSettings.params.stop === '10m';
      const isDefaultStep = !tranSettings.params.step || tranSettings.params.step === '100u' || tranSettings.params.step === '1m';

      if (isDefaultStop || isDefaultStep) {
        if (minFreq < Infinity && minFreq > 0) {
          const period = 1 / minFreq;
          // In interactive mode, simulate 10 to 20 clock cycles (enough for sequential ICs to transition)
          // Kept between 20ms and 200ms so ngspice WASM computes in <100ms for instant real-time responsiveness!
          const interactiveDuration = Math.min(0.25, Math.max(0.02, 10 * period));
          if (isDefaultStop) {
            tranSettings.params.stop = `${parseFloat(interactiveDuration.toFixed(4))}s`;
          }
          const stepSize = Math.max(1e-5, period / 20);
          if (isDefaultStep) {
            tranSettings.params.step = `${stepSize.toExponential(2)}`;
          }
        } else {
          let maxC = 0;
          for (const c of activeCircuit.components) {
            if (c.type === "capacitor") {
              const capStr = c.params.capacitance?.toString() || "1u";
              const capVal = parseSpiceValue(capStr) || 1e-6;
              if (capVal > maxC) maxC = capVal;
            }
          }
          const tSettle = maxC > 0 ? Math.min(0.2, Math.max(0.02, 4 * 10000 * maxC)) : 0.01;
          if (isDefaultStop) {
            tranSettings.params.stop = `${parseFloat(tSettle.toFixed(4))}s`;
          }
          if (isDefaultStep) {
            tranSettings.params.step = `${Math.max(1e-4, tSettle / 100).toExponential(2)}`;
          }
        }
      }
    } else if (activeAnalysis === 'tran') {
      let tranSettings = activeCircuit.analyses.find((a: any) => a.kind === 'tran');
      if (!tranSettings) {
        tranSettings = { kind: 'tran', params: {} };
        activeCircuit.analyses.push(tranSettings);
      }
      
      let minFreq = Infinity;
      for (const c of activeCircuit.components) {
        if (c.type === "clock") {
          const f = parseFloat(c.params.frequency?.toString() || "1000");
          if (f > 0 && f < minFreq) minFreq = f;
        } else if (c.type === "function_generator" && c.params?.frequency) {
          const f = parseFloat(c.params.frequency?.toString() || "1000");
          if (f > 0 && f < minFreq) minFreq = f;
        }
      }
      let defaultStop = '10m';
      let defaultStep = '100u';
      if (minFreq < Infinity && minFreq > 0) {
        const period = 1 / minFreq;
        const totalTime = Math.min(2.0, Math.max(10 * period, 0.01));
        defaultStop = `${parseFloat(totalTime.toFixed(4))}s`;
        defaultStep = `${Math.max(1e-5, period / 100).toExponential(2)}`;
      } else {
        let maxC = 0;
        for (const c of activeCircuit.components) {
          if (c.type === "capacitor") {
            const capStr = c.params.capacitance?.toString() || "1u";
            const capVal = parseSpiceValue(capStr) || 1e-6;
            if (capVal > maxC) maxC = capVal;
          }
        }
        if (maxC > 0) {
          const tSettle = Math.min(1.0, Math.max(0.05, 4 * 10000 * maxC));
          defaultStop = `${parseFloat(tSettle.toFixed(4))}s`;
          defaultStep = `${Math.max(1e-4, tSettle / 200).toExponential(2)}`;
        }
      }

      if (!tranSettings.params.step) {
        tranSettings.params.step = defaultStep;
      }
      if (!tranSettings.params.stop) {
        tranSettings.params.stop = defaultStop;
      }
    }
    if (activeAnalysis === 'ac' || activeAnalysis === 'interactive') {
      let acSettings = activeCircuit.analyses.find((a: any) => a.kind === 'ac');
      if (!acSettings) {
        acSettings = { kind: 'ac', params: {} };
        activeCircuit.analyses.push(acSettings);
      }
      if (!acSettings.params.variation) {
        acSettings.params = { variation: 'dec', points: '10', fstart: '1', fstop: '1Meg' };
      }
    }

    try {
      const hasAcSource = activeCircuit.components.some((c: any) => 
        c.type === 'function_generator' || 
        c.params?.type === 'ac' || 
        c.params?.type === 'sin' ||
        (c.params?.ac_mag && parseFloat(c.params.ac_mag) > 0)
      );
      const shouldRunAc = activeAnalysis === 'ac' || (activeAnalysis === 'interactive' && hasAcSource);

      const initialConditions = !options?.resetState 
        ? (Object.keys(lastNodeVoltagesRef.current).length > 0 
            ? lastNodeVoltagesRef.current 
            : useSimulationStore.getState().nodeVoltages)
        : undefined;

      const netlist = generator.generate(activeCircuit, activeAnalysis, initialConditions);
      const acNetlist = shouldRunAc ? generator.generate(activeCircuit, 'ac') : undefined;

      // @ts-ignore
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.groupCollapsed(`🛠️ Generated Netlist (${activeAnalysis})`);
        console.log(netlist);
        if (acNetlist) {
          console.log("AC Netlist:\n", acNetlist);
        }
        console.groupEnd();
      }
      if (isSimulatingRef.current && workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (!workerRef.current) {
        initWorker();
      }
      isSimulatingRef.current = true;
      workerRef.current?.postMessage({ type: 'start', netlist, acNetlist, activeAnalysis });
    } catch (err: any) {
      setSimError(err.message);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key === 'Escape') {
        setMode('select');
      } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        rotateSelected();
      } else if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
        mirrorSelected();
      } else if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
        copySelected();
      } else if ((e.key === 'x' || e.key === 'X') && (e.ctrlKey || e.metaKey)) {
        cutSelected();
      } else if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
        paste(getLastCanvasPointerPos() || undefined);
      } else if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveSelected({ x: e.shiftKey ? -20 : -10, y: 0 });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveSelected({ x: e.shiftKey ? 20 : 10, y: 0 });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelected({ x: 0, y: e.shiftKey ? -20 : -10 });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelected({ x: 0, y: e.shiftKey ? 20 : 10 });
      } else if ((e.key === 'p' || e.key === 'a') && !e.ctrlKey && !e.metaKey) {
        setIsComponentBrowserOpen(true);
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
  }, [deleteSelected, setMode, rotateSelected, mirrorSelected, copySelected, cutSelected, paste, duplicateSelected, selectAll, moveSelected]);



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
            onClick={() => runSimulation({ resetState: true })}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ padding: '6px 12px', background: 'var(--panel)', color: 'var(--text)', border: `1px solid var(--border)`, borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
              Import Circuit
              <input 
                type="file" 
                accept=".net,.cir,.pdsprj" 
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  if (file.name.endsWith('.pdsprj')) {
                    alert(`Deep Analysis mode active: Extracting raw binary coordinates for components${importComponentsOnly ? ' only' : ' and wires'}.`);
                    const buffer = await file.arrayBuffer();
                    try {
                      const importedCircuit = await parsePdsprjExperimental(buffer, file.name, { componentsOnly: importComponentsOnly });
                      useEditorStore.setState({ circuit: importedCircuit });
                      useEditorStore.temporal.getState().clear();
                      if (importedCircuit.warnings && importedCircuit.warnings.length > 0) {
                          setImportWarnings(importedCircuit.warnings);
                      }
                    } catch (err) {
                      alert("Failed to parse .pdsprj file.");
                    }
                  } else {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        const importedCircuit = parseProteusNetlist(ev.target.result as string, file.name);
                        useEditorStore.setState({ circuit: importedCircuit });
                        useEditorStore.temporal.getState().clear();
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
            <label style={{ fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={importComponentsOnly} 
                onChange={(e) => setImportComponentsOnly(e.target.checked)} 
              />
              Components Only
            </label>
            <button
              onClick={() => setIsComponentBrowserOpen(true)}
              style={{
                padding: '6px 14px',
                background: 'var(--panel)',
                color: 'var(--text)',
                border: `1px solid var(--border)`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Browse Component Library & Footprints (Press P or A)"
            >
              <Cpu size={16} color="var(--signal)" />
              Component Library (P)
            </button>
          </div>
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
            <button 
              style={{ padding: '8px', background: 'transparent', color: colors.text, border: 'none', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => mirrorSelected()} title="Flip (M)"
            >
              <FlipHorizontal size={18} />
            </button>
            <div style={{ width: '1px', background: colors.border, margin: '0 5px' }} />
            <button 
              style={{
                padding: '8px',
                background: 'transparent',
                color: selectedIds.length > 0 ? colors.text : (isDark ? '#585b70' : '#bdc3c7'),
                border: 'none',
                cursor: selectedIds.length > 0 ? 'pointer' : 'default',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => cutSelected()}
              disabled={selectedIds.length === 0}
              title="Cut (Ctrl+X)"
            >
              <Scissors size={18} />
            </button>
            <button 
              style={{
                padding: '8px',
                background: 'transparent',
                color: selectedIds.length > 0 ? colors.text : (isDark ? '#585b70' : '#bdc3c7'),
                border: 'none',
                cursor: selectedIds.length > 0 ? 'pointer' : 'default',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => copySelected()}
              disabled={selectedIds.length === 0}
              title="Copy (Ctrl+C)"
            >
              <Copy size={18} />
            </button>
            <button 
              style={{
                padding: '8px',
                background: 'transparent',
                color: colors.text,
                border: 'none',
                cursor: 'pointer',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => paste(getLastCanvasPointerPos() || undefined)}
              title="Paste (Ctrl+V)"
            >
              <ClipboardPaste size={18} />
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
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', position: 'relative' }}>
            <AnalysisModeSelector
              activeAnalysis={activeAnalysis}
              onSelectMode={(mode) => {
                setActiveAnalysis(mode);
                setShowAnalysisSettings(false);
              }}
              showSettings={showAnalysisSettings}
              onToggleSettings={() => setShowAnalysisSettings(!showAnalysisSettings)}
              theme={theme}
            />

            {showAnalysisSettings && activeAnalysis !== 'op' && (
              <div style={{ 
                position: 'absolute', 
                top: 'calc(100% + 6px)', 
                right: 0, 
                background: colors.panelBg, 
                padding: '15px', 
                borderRadius: '6px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '240px',
                border: `1px solid ${colors.border}`
              }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: colors.text, borderBottom: `1px solid ${colors.border}`, paddingBottom: '5px' }}>
                  {activeAnalysis === 'interactive' ? 'Interactive Simulation Settings' : (activeAnalysis === 'tran' ? 'Transient Settings' : 'AC Sweep Settings')}
                </h4>
                
                {(activeAnalysis === 'tran' || activeAnalysis === 'interactive') && (
                  <>
                    {activeAnalysis === 'interactive' && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--signal)', textTransform: 'uppercase' }}>
                        Time-Domain / Transient
                      </div>
                    )}
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
                
                {(activeAnalysis === 'ac' || activeAnalysis === 'interactive') && (
                  <>
                    {activeAnalysis === 'interactive' && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--signal)', textTransform: 'uppercase', marginTop: '6px', borderTop: `1px solid ${colors.border}`, paddingTop: '6px' }}>
                        Frequency-Domain / AC Sweep
                      </div>
                    )}
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

          <button 
            onClick={() => setIsComponentBrowserOpen(true)}
            style={{ 
              padding: '8px', 
              background: isComponentBrowserOpen ? 'var(--highlight)' : 'transparent', 
              border: `1px solid var(--border)`, 
              color: colors.text, 
              cursor: 'pointer', 
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px'
            }}
            title="Browse Component Library (P / A)"
          >
            <BookOpen size={18} color="var(--signal)" />
          </button>

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
                  {activeView === 'breadboard' ? (PhysicalComponentIcons[type] || ComponentIcons[type] || renderGenericIcon(type.slice(0, 4).toUpperCase())) : (ComponentIcons[type] || renderGenericIcon(type.slice(0, 4).toUpperCase()))}
                </div>
              </button>
            ))}

            {Object.keys(ComponentLibrary).length > maxVisibleComponents && (
            <div ref={moreComponentsRef} style={{ position: 'relative' }}>
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
                  bottom: '0',
                  marginLeft: '15px',
                  background: colors.panelBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '12px',
                  width: '260px',
                  maxHeight: 'min(520px, calc(100vh - 120px))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  zIndex: 1000,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  boxSizing: 'border-box'
                }}>
                  {/* Popover Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, paddingBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.text, opacity: 0.8, letterSpacing: '0.5px' }}>
                      COMPONENTS ({Object.keys(ComponentLibrary).length - maxVisibleComponents})
                    </span>
                    <button
                      onClick={() => {
                        setShowMoreComponents(false);
                        setIsComponentBrowserOpen(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--highlight)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '3px'
                      }}
                      title="Open Full Component Library Browser"
                    >
                      <BookOpen size={13} />
                      <span>Catalog</span>
                    </button>
                  </div>

                  {/* Scrollable Component Grid */}
                  <div style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                    paddingRight: '4px',
                    maxHeight: '440px'
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
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                          padding: '6px 4px',
                          borderRadius: '5px',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          minHeight: '46px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ transform: 'scale(1.1)', transformOrigin: 'center', display: 'flex' }}>
                          {activeView === 'breadboard' ? (PhysicalComponentIcons[type] || ComponentIcons[type] || renderGenericIcon(type.slice(0, 4).toUpperCase())) : (ComponentIcons[type] || renderGenericIcon(type.slice(0, 4).toUpperCase()))}
                        </div>
                        <span style={{ fontSize: '0.62rem', color: colors.text, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '64px', textAlign: 'center' }}>
                          {comp.name || type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
          
          </aside>

        <main style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden', backgroundColor: colors.bg }}>
        <Canvas tranData={(activeAnalysis === 'tran' || activeAnalysis === 'interactive') ? tranData : undefined} theme={theme} simError={simError} />
        
        {/* Properties Popup */}
        <PropertyPopup theme={theme} />

        {/* Node Voltages Panel (In .op or interactive mode) */}
        {(activeAnalysis === 'op' || activeAnalysis === 'interactive') && (
          <DCOperatingPointPanel
            isOpen={isDcPanelOpen}
            onToggle={() => setIsDcPanelOpen(!isDcPanelOpen)}
            colors={colors}
            isDark={isDark}
            simFlash={simFlash}
          />
        )}

        {/* Custom Models Panel */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          right: '20px', 
          background: colors.panelBg, 
          padding: isCustomModelsOpen ? '10px' : '6px 12px', 
          borderRadius: '5px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', 
          zIndex: 10, 
          width: isCustomModelsOpen ? '300px' : 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div 
            onClick={() => setIsCustomModelsOpen(!isCustomModelsOpen)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer',
              userSelect: 'none',
              gap: '8px'
            }}
          >
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: colors.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Custom SPICE Directives</span>
              {customModelsInput.trim().length > 0 && !isCustomModelsOpen && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--signal)' }} />
              )}
            </h4>
            <div style={{ color: colors.text, opacity: 0.7, display: 'flex', alignItems: 'center' }}>
              {isCustomModelsOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </div>

          {isCustomModelsOpen && (
            <>
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
            </>
          )}
        </div>
      </main>
      </div>
            {/* Context Menu for Node */}
      
      {activeView !== 'breadboard' && (
        <WaveformViewer 
          data={tranData} 
          acData={acData}
          probes={probes} 
          activeAnalysis={activeAnalysis}
          hasAcSource={circuit.components.some((c: any) => 
            c.type === 'function_generator' || 
            c.params?.type === 'ac' || 
            c.params?.type === 'sin' ||
            (c.params?.ac_mag && parseFloat(c.params.ac_mag) > 0)
          )}
        />
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

      {/* Import Warnings Dialog */}
      {importWarnings && importWarnings.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#fff',
            color: theme === 'dark' ? '#eee' : '#333',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '60vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#e67e22' }}>⚠️ Import Warnings</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.8 }}>
              The following items from the imported design file could not be mapped:
            </p>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
              {Array.from(new Set(importWarnings)).map((w, i) => (
                <li key={i} style={{ fontFamily: 'monospace' }}>{w}</li>
              ))}
            </ul>
            <button
              onClick={() => setImportWarnings(null)}
              style={{
                padding: '8px 20px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Component Library Browser (EasyEDA & KiCad Style) */}
      <ComponentBrowserModal
        isOpen={isComponentBrowserOpen}
        onClose={() => setIsComponentBrowserOpen(false)}
        onSelectComponent={(type) => setMode('place', type)}
        theme={theme}
      />
    </div>
  );
}

export default App;
