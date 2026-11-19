import React, { useState, useMemo } from 'react';
import { 
  X, Search, Cpu, Box, CheckCircle2, Layers, 
  Code, Plus, Sliders, Zap, Clock, 
  Activity, FileCode, ToggleLeft
} from 'lucide-react';
import { ComponentDefinition } from '../models/circuit';
import { ComponentLibrary } from '../engine/library';
import { useEditorStore } from '../store/editorStore';
import { ImportModelModal } from './ImportModelModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (type: string) => void;
  theme: 'light' | 'dark';
}

type CategoryKey = 'all' | 'digital_logic' | 'analog_ic' | 'power' | 'semiconductors' | 'passives' | 'instruments' | 'inputs' | 'custom';

export const ComponentBrowserModal: React.FC<Props> = ({ isOpen, onClose, onSelectComponent, theme }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'import'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('ne555');
  const [previewTab, setPreviewTab] = useState<'both' | 'symbol' | 'package'>('both');
  const [showSpiceCode, setShowSpiceCode] = useState(false);

  const circuit = useEditorStore(state => state.circuit);
  const customComponents = circuit.customComponents || {};

  // Combine standard library with any custom-imported components
  const allComponents = useMemo(() => {
    return {
      ...ComponentLibrary,
      ...customComponents
    };
  }, [customComponents]);

  // Ensure an initial selection if selectedType is invalid
  const activeDef: ComponentDefinition | undefined = allComponents[selectedType] || allComponents['ne555'] || Object.values(allComponents)[0];

  const categories: { key: CategoryKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All Components', icon: <Layers size={16} /> },
    { key: 'digital_logic', label: 'Digital Logic (74xx)', icon: <Zap size={16} /> },
    { key: 'analog_ic', label: 'Analog ICs & Op-Amps', icon: <Activity size={16} /> },
    { key: 'power', label: 'Power & Regulators', icon: <Sliders size={16} /> },
    { key: 'semiconductors', label: 'Semiconductors & Diodes', icon: <Cpu size={16} /> },
    { key: 'passives', label: 'Passives (R, L, C)', icon: <Box size={16} /> },
    { key: 'inputs', label: 'Inputs & Switches', icon: <ToggleLeft size={16} /> },
    { key: 'instruments', label: 'Virtual Instruments', icon: <Clock size={16} /> },
    { key: 'custom', label: 'User / Custom Parts', icon: <FileCode size={16} /> },
  ];

  const packagesList = ['all', 'dip8', 'dip14', 'dip16', 'to220', 'to92', 'discrete', 'custom'];

  // Filtered list based on search, category, and package
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return Object.entries(allComponents).filter(([type, def]) => {
      // Category match
      if (selectedCategory === 'custom') {
        if (!customComponents[type]) return false;
      } else if (selectedCategory !== 'all') {
        if (def.category !== selectedCategory) return false;
      }

      // Package match
      if (selectedPackage !== 'all') {
        if (def.package !== selectedPackage) return false;
      }

      // Query match
      if (q) {
        const cleanQ = q.replace(/[\s\-_]/g, '');
        const cleanName = (def.name || type).toLowerCase().replace(/[\s\-_]/g, '');
        const cleanType = type.toLowerCase().replace(/[\s\-_]/g, '');
        const cleanSpice = (def.spice?.subcircuitName || '').toLowerCase().replace(/[\s\-_]/g, '');

        const nameMatch = cleanName.includes(cleanQ) || (def.name || type).toLowerCase().includes(q);
        const typeMatch = cleanType.includes(cleanQ) || type.toLowerCase().includes(q);
        const descMatch = (def.description || '').toLowerCase().includes(q);
        const mfrMatch = (def.manufacturer || '').toLowerCase().includes(q);
        const kwMatch = (def.keywords || []).some(k => {
          const cleanK = k.toLowerCase().replace(/[\s\-_]/g, '');
          return cleanK.includes(cleanQ) || k.toLowerCase().includes(q);
        });
        const spiceMatch = cleanSpice.includes(cleanQ) || (def.spice?.subcircuitName || '').toLowerCase().includes(q);
        if (!nameMatch && !typeMatch && !descMatch && !mfrMatch && !kwMatch && !spiceMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allComponents, customComponents, selectedCategory, selectedPackage, searchQuery]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#1C2127' : '#F6F8FA',
    modalBg: isDark ? '#232931' : '#FFFFFF',
    headerBg: isDark ? '#1E232B' : '#FFFFFF',
    text: isDark ? '#E6EDF3' : '#1F2328',
    subText: isDark ? '#8D96A0' : '#656D76',
    border: isDark ? '#373E47' : '#D0D7DE',
    inputBg: isDark ? '#161B22' : '#FFFFFF',
    tableHeaderBg: isDark ? '#1A1E24' : '#F6F8FA',
    tableRowHover: isDark ? '#2A313C' : '#F2F4F7',
    selectedRow: isDark ? '#1F3A52' : '#DDF4FF',
    accent: '#2EA043',
    primary: isDark ? '#2F81F7' : '#0969DA',
    symbolBg: isDark ? '#1A212A' : '#FFFDF5',
    chipBody: isDark ? '#151719' : '#22252A',
    pinColor: isDark ? '#C0C5CC' : '#A0A6AD',
  };

  const handlePlace = (type: string) => {
    onSelectComponent(type);
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '95vw',
          maxWidth: '1280px',
          height: '88vh',
          backgroundColor: colors.modalBg,
          color: colors.text,
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: `1px solid ${colors.border}`,
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Cpu size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                Component Library Browser
                <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '2px 8px', borderRadius: '12px', background: isDark ? '#2E3842' : '#EAEFF5', color: colors.primary }}>
                  EasyEDA & KiCad Compatible
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.subText }}>
                Browse symbols, physical packages, pinouts, and SPICE models
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              backgroundColor: isDark ? '#161B22' : '#EAEFF5',
              borderRadius: '6px',
              padding: '3px'
            }}>
              <button
                onClick={() => setActiveTab('catalog')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'catalog' ? colors.modalBg : 'transparent',
                  color: activeTab === 'catalog' ? colors.primary : colors.subText,
                  boxShadow: activeTab === 'catalog' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                Catalog Browser
              </button>
              <button
                onClick={() => setActiveTab('import')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'import' ? colors.modalBg : 'transparent',
                  color: activeTab === 'import' ? colors.primary : colors.subText,
                  boxShadow: activeTab === 'import' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                Import Custom / SPICE
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.subText,
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {activeTab === 'import' ? (
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            <ImportModelModal 
              isOpen={true} 
              onClose={() => setActiveTab('catalog')} 
              theme={theme} 
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Column: Category Navigation */}
            <div style={{
              width: '240px',
              borderRight: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 8px',
              gap: '4px',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.subText, textTransform: 'uppercase', padding: '4px 10px 8px' }}>
                Categories
              </div>
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.key;
                const count = Object.values(allComponents).filter(c => {
                  if (cat.key === 'all') return true;
                  if (cat.key === 'custom') return !!customComponents[c.type];
                  return c.category === cat.key;
                }).length;

                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isSelected ? (isDark ? '#2D3540' : '#E8EFF8') : 'transparent',
                      color: isSelected ? colors.primary : colors.text,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: isSelected ? colors.primary : colors.subText }}>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: isDark ? '#1C2127' : '#E1E4E8',
                      color: colors.subText,
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}

              <div style={{ borderTop: `1px solid ${colors.border}`, margin: '12px 4px 8px', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.subText, textTransform: 'uppercase', padding: '4px 8px' }}>
                  Quick Packages
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px' }}>
                  {packagesList.map(pkg => (
                    <button
                      key={pkg}
                      onClick={() => setSelectedPackage(pkg)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${selectedPackage === pkg ? colors.primary : colors.border}`,
                        backgroundColor: selectedPackage === pkg ? (isDark ? '#253545' : '#E1F0FF') : 'transparent',
                        color: selectedPackage === pkg ? colors.primary : colors.subText,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: selectedPackage === pkg ? 600 : 400
                      }}
                    >
                      {pkg.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column: Search and Component Table */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRight: `1px solid ${colors.border}`,
              backgroundColor: colors.modalBg,
              overflow: 'hidden'
            }}>
              {/* Search Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  padding: '6px 12px'
                }}>
                  <Search size={16} color={colors.subText} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search part number, description, keywords (e.g. 555, 74HC, Op-Amp, Regulator)..."
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      color: colors.text,
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ border: 'none', background: 'transparent', color: colors.subText, cursor: 'pointer', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: colors.subText, whiteSpace: 'nowrap' }}>
                  {filteredList.length} component{filteredList.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Components Table */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: colors.tableHeaderBg, zIndex: 10, borderBottom: `1px solid ${colors.border}` }}>
                    <tr>
                      <th style={{ padding: '10px 14px', color: colors.subText, fontWeight: 600 }}>Part / Symbol</th>
                      <th style={{ padding: '10px 14px', color: colors.subText, fontWeight: 600 }}>Package</th>
                      <th style={{ padding: '10px 14px', color: colors.subText, fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '10px 14px', color: colors.subText, fontWeight: 600 }}>SPICE</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', color: colors.subText, fontWeight: 600 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: colors.subText }}>
                          No components match the filter. Try searching for "555", "74", "regulator", or "opamp".
                        </td>
                      </tr>
                    ) : (
                      filteredList.map(([type, comp]) => {
                        const isSelected = selectedType === type;
                        const hasSpice = !!comp.spice || ['resistor', 'capacitor', 'inductor', 'vsource', 'isource', 'diode', 'npn', 'pnp', 'nmos', 'pmos'].includes(type);

                        return (
                          <tr
                            key={type}
                            onClick={() => setSelectedType(type)}
                            onDoubleClick={() => handlePlace(type)}
                            style={{
                              borderBottom: `1px solid ${colors.border}`,
                              backgroundColor: isSelected ? colors.selectedRow : 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.1s'
                            }}
                          >
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: isSelected ? colors.primary : colors.text }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Cpu size={15} color={isSelected ? colors.primary : colors.subText} />
                                <div>
                                  <div>{comp.name || type}</div>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 400, color: colors.subText }}>{type}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', color: colors.subText }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${colors.border}`,
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                fontWeight: 500
                              }}>
                                {comp.package || 'discrete'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', color: colors.subText, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comp.description}>
                              {comp.description || comp.manufacturer || `${comp.pins.length} pins`}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {hasSpice ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: colors.accent,
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  <CheckCircle2 size={13} />
                                  Ready
                                </span>
                              ) : (
                                <span style={{ color: colors.subText, fontSize: '0.75rem' }}>Basic</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlace(type);
                                }}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: colors.primary,
                                  color: '#FFFFFF',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Place
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Dual Live Preview & Pinout Specs (KiCad style!) */}
            <div style={{
              width: '380px',
              backgroundColor: colors.headerBg,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}>
              {activeDef ? (
                <>
                  {/* Preview Selector Header */}
                  <div style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.text }}>
                      Live Previews
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['both', 'symbol', 'package'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setPreviewTab(tab)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: previewTab === tab ? 600 : 400,
                            cursor: 'pointer',
                            backgroundColor: previewTab === tab ? colors.primary : 'transparent',
                            color: previewTab === tab ? '#FFFFFF' : colors.subText
                          }}
                        >
                          {tab.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Previews Canvas Container */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Schematic Symbol Preview */}
                    {(previewTab === 'both' || previewTab === 'symbol') && (
                      <div style={{
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.symbolBg,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '6px 12px',
                          borderBottom: `1px solid ${colors.border}`,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: colors.subText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>SCHEMATIC SYMBOL</span>
                          <span>U?</span>
                        </div>
                        <div style={{ height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <SymbolPreview definition={activeDef} isDark={isDark} />
                        </div>
                      </div>
                    )}

                    {/* Physical Package / Footprint Preview */}
                    {(previewTab === 'both' || previewTab === 'package') && (
                      <div style={{
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: isDark ? '#14171A' : '#E9ECEF',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          padding: '6px 12px',
                          borderBottom: `1px solid ${colors.border}`,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: colors.subText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>PHYSICAL PACKAGE / FOOTPRINT</span>
                          <span style={{ textTransform: 'uppercase' }}>{activeDef.package || 'discrete'}</span>
                        </div>
                        <div style={{ height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PhysicalPackagePreview definition={activeDef} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Component Details & Pinout Table */}
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.text }}>
                        {activeDef.name || activeDef.type}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: colors.subText, marginTop: '2px' }}>
                        {activeDef.description || 'Standard electronic component'}
                      </div>
                      {activeDef.manufacturer && (
                        <div style={{ fontSize: '0.75rem', color: colors.primary, marginTop: '4px' }}>
                          Mfr: {activeDef.manufacturer}
                        </div>
                      )}
                    </div>

                    {/* Pinout Section */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.subText, marginBottom: '6px' }}>
                        Pin Configuration ({activeDef.pins.length} Pins)
                      </div>
                      <div style={{
                        maxHeight: '130px',
                        overflowY: 'auto',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        backgroundColor: colors.inputBg
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                          <tbody>
                            {activeDef.pins.map((pin, i) => (
                              <tr key={pin.id || i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <td style={{ padding: '4px 8px', fontWeight: 600, color: colors.primary, width: '40px' }}>
                                  #{pin.id}
                                </td>
                                <td style={{ padding: '4px 8px', fontWeight: 500, color: colors.text }}>
                                  {pin.label || `Pin ${pin.id}`}
                                </td>
                                <td style={{ padding: '4px 8px', color: colors.subText, textAlign: 'right' }}>
                                  x:{pin.offset.x}, y:{pin.offset.y}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SPICE Macromodel Details */}
                    {activeDef.spice && (
                      <div>
                        <button
                          onClick={() => setShowSpiceCode(!showSpiceCode)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: 'transparent',
                            color: colors.text,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Code size={14} color={colors.accent} />
                            SPICE Subcircuit Model: {activeDef.spice.subcircuitName}
                          </span>
                          <span>{showSpiceCode ? 'Hide' : 'View'}</span>
                        </button>
                        {showSpiceCode && (
                          <pre style={{
                            margin: '6px 0 0',
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#14171A' : '#F1F3F5',
                            color: colors.text,
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            overflowX: 'auto',
                            maxHeight: '120px',
                            border: `1px solid ${colors.border}`
                          }}>
                            {activeDef.spice.subcircuitBody}
                          </pre>
                        )}
                      </div>
                    )}

                    {/* Primary Action Button */}
                    <button
                      onClick={() => handlePlace(activeDef.type)}
                      style={{
                        marginTop: '8px',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: colors.primary,
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Plus size={18} />
                      Place Component on Canvas
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: colors.subText }}>
                  Select a component to inspect
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SVG LIVE SCHEMATIC SYMBOL PREVIEW COMPONENT
// ==========================================
const SymbolPreview: React.FC<{ definition: ComponentDefinition; isDark: boolean }> = ({ definition, isDark }) => {
  const pins = definition.pins;
  const numPins = pins.length;
  const isIC = definition.package?.startsWith('dip') || numPins > 4;

  const strokeColor = isDark ? '#E6EDF3' : '#1A202C';
  const boxFill = isDark ? '#232931' : '#FFFDF5';
  const pinNumColor = '#E53E3E';
  const pinNameColor = isDark ? '#81E6D9' : '#2B6CB0';

  if (!isIC) {
    if (definition.type === 'switch') {
      return (
        <svg width="220" height="150" viewBox="-70 -60 140 120">
          <line x1="-50" y1="0" x2="-22" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="22" y1="0" x2="50" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="-22" cy="0" r="5" stroke={strokeColor} strokeWidth="2" fill={boxFill} />
          <circle cx="22" cy="0" r="5" stroke={strokeColor} strokeWidth="2" fill={boxFill} />
          <line x1="-22" y1="0" x2="18" y2="-22" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="-50" cy="0" r="3" fill={pinNumColor} />
          <circle cx="50" cy="0" r="3" fill={pinNumColor} />
          <text x="-50" y="-10" textAnchor="middle" fill={pinNumColor} fontSize="10" fontWeight="bold">1</text>
          <text x="50" y="-10" textAnchor="middle" fill={pinNumColor} fontSize="10" fontWeight="bold">2</text>
          <text x="0" y="32" textAnchor="middle" fill={strokeColor} fontSize="11" fontWeight="bold">SPST Switch</text>
        </svg>
      );
    }
    if (definition.type === 'pushbutton') {
      return (
        <svg width="220" height="150" viewBox="-70 -60 140 120">
          {/* Left Pins: L1 (-20,-20), L2 (-20, 20) */}
          <line x1="-50" y1="-20" x2="-20" y2="-20" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="-50" y1="20" x2="-20" y2="20" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="-20" y1="-20" x2="-20" y2="20" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="-20" cy="0" r="4" stroke={strokeColor} strokeWidth="2" fill={boxFill} />
          
          {/* Right Pins: R1 (20, -20), R2 (20, 20) */}
          <line x1="20" y1="-20" x2="50" y2="-20" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="20" y1="20" x2="50" y2="20" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="20" y1="-20" x2="20" y2="20" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="20" cy="0" r="4" stroke={strokeColor} strokeWidth="2" fill={boxFill} />

          {/* Movable Contact Bar & Push Actuator */}
          <line x1="-20" y1="-8" x2="20" y2="-8" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="0" y1="-8" x2="0" y2="-22" stroke={strokeColor} strokeWidth="2" />
          <rect x="-8" y="-26" width="16" height="5" fill={strokeColor} rx="1" />

          {/* Pin Terminal Dots */}
          <circle cx="-50" cy="-20" r="3" fill={pinNumColor} />
          <circle cx="-50" cy="20" r="3" fill={pinNumColor} />
          <circle cx="50" cy="-20" r="3" fill={pinNumColor} />
          <circle cx="50" cy="20" r="3" fill={pinNumColor} />
          
          <text x="-50" y="-28" textAnchor="middle" fill={pinNumColor} fontSize="9" fontWeight="bold">1</text>
          <text x="-50" y="34" textAnchor="middle" fill={pinNumColor} fontSize="9" fontWeight="bold">2</text>
          <text x="50" y="-28" textAnchor="middle" fill={pinNumColor} fontSize="9" fontWeight="bold">3</text>
          <text x="50" y="34" textAnchor="middle" fill={pinNumColor} fontSize="9" fontWeight="bold">4</text>
          <text x="0" y="44" textAnchor="middle" fill={strokeColor} fontSize="11" fontWeight="bold">Push Button</text>
        </svg>
      );
    }
    if (definition.type === 'clock') {
      return (
        <svg width="220" height="150" viewBox="-70 -60 140 120">
          <line x1="0" y1="-50" x2="0" y2="-25" stroke={strokeColor} strokeWidth="2" />
          <circle cx="0" cy="0" r="25" stroke={strokeColor} strokeWidth="2" fill={boxFill} />
          <path d="M -12 6 L -5 6 L -5 -6 L 5 -6 L 5 6 L 12 6" stroke={strokeColor} strokeWidth="2" fill="none" />
          <line x1="0" y1="25" x2="0" y2="50" stroke={strokeColor} strokeWidth="2" />
          <circle cx="0" cy="-50" r="3" fill={strokeColor} />
          <circle cx="0" cy="50" r="3" fill={strokeColor} />
          <text x="32" y="-15" fill="#E53E3E" fontSize="10" fontWeight="bold">CLK (+)</text>
          <text x="32" y="30" fill="#3182CE" fontSize="10" fontWeight="bold">GND (-)</text>
        </svg>
      );
    }
    // Discrete symbol preview (Resistor, Diode, Transistor, etc.)
    return (
      <svg width="220" height="150" viewBox="-60 -60 120 120">
        <rect x="-40" y="-20" width="80" height="40" fill={boxFill} stroke={strokeColor} strokeWidth="2" rx="4" />
        <line x1="-60" y1="0" x2="-40" y2="0" stroke={strokeColor} strokeWidth="2" />
        <line x1="40" y1="0" x2="60" y2="0" stroke={strokeColor} strokeWidth="2" />
        <circle cx="-60" cy="0" r="3" fill={strokeColor} />
        <circle cx="60" cy="0" r="3" fill={strokeColor} />
        <text x="0" y="5" textAnchor="middle" fill={strokeColor} fontSize="11" fontWeight="bold">
          {definition.name || definition.type}
        </text>
      </svg>
    );
  }

  // IC Symbol Preview: rectangular block with left & right pins, plus top/bottom power pins
  const isVccPin = (p: typeof pins[0]) => {
    const lbl = (p.label || '').toUpperCase();
    return lbl.includes('VCC') || lbl.includes('VDD') || lbl === 'V+' || (p.offset && p.offset.x === 0 && p.offset.y < 0);
  };
  const isGndPin = (p: typeof pins[0]) => {
    const lbl = (p.label || '').toUpperCase();
    return lbl.includes('GND') || lbl.includes('VSS') || lbl === 'V-' || (p.offset && p.offset.x === 0 && p.offset.y > 0);
  };

  const topPins = pins.filter(p => isVccPin(p));
  const bottomPins = pins.filter(p => isGndPin(p));
  const sidePins = pins.filter(p => !isVccPin(p) && !isGndPin(p));

  const leftPins = sidePins.filter(p => (p.offset ? p.offset.x < 0 : false));
  const rightPins = sidePins.filter(p => (p.offset ? p.offset.x >= 0 : true));

  // If pins do not have offsets or are unbalanced, fallback to splitting half/half
  const finalLeftPins = leftPins.length > 0 ? leftPins : sidePins.slice(0, Math.ceil(sidePins.length / 2));
  const finalRightPins = rightPins.length > 0 ? rightPins : sidePins.slice(Math.ceil(sidePins.length / 2));

  const maxRows = Math.max(finalLeftPins.length, finalRightPins.length, 1);
  const height = Math.max(90, maxRows * 20 + 36);
  const width = 110;

  return (
    <svg width="240" height="160" viewBox={`-110 -${height / 2 + 25} 220 ${height + 50}`}>
      {/* IC Body Box */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={boxFill}
        stroke={strokeColor}
        strokeWidth="2"
        rx="3"
      />
      {/* Orientation Notch at top */}
      <path
        d={`M -10 -${height / 2} A 10 10 0 0 0 10 -${height / 2}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />
      {/* Part Title */}
      <text
        x="0"
        y={topPins.length > 0 ? 4 : -height / 2 + 22}
        textAnchor="middle"
        fill={strokeColor}
        fontSize="11"
        fontWeight="bold"
      >
        {definition.defaultParams?.model || (definition.name ? definition.name.split(' ')[0] : definition.type.toUpperCase())}
      </text>

      {/* Top Pins (VCC / VDD) */}
      {topPins.map((pin) => (
        <g key={pin.id}>
          <line x1={0} y1={-height / 2 - 20} x2={0} y2={-height / 2} stroke={strokeColor} strokeWidth="1.5" />
          <circle cx={0} cy={-height / 2 - 20} r="2.5" fill={strokeColor} />
          <text x={6} y={-height / 2 - 8} fill={pinNumColor} fontSize="8" fontWeight="bold">
            {pin.id}
          </text>
          <text x={0} y={-height / 2 + 12} textAnchor="middle" fill={pinNameColor} fontSize="8" fontWeight="600">
            {pin.label || pin.id}
          </text>
        </g>
      ))}

      {/* Bottom Pins (GND / VSS) */}
      {bottomPins.map((pin) => (
        <g key={pin.id}>
          <line x1={0} y1={height / 2} x2={0} y2={height / 2 + 20} stroke={strokeColor} strokeWidth="1.5" />
          <circle cx={0} cy={height / 2 + 20} r="2.5" fill={strokeColor} />
          <text x={6} y={height / 2 + 14} fill={pinNumColor} fontSize="8" fontWeight="bold">
            {pin.id}
          </text>
          <text x={0} y={height / 2 - 4} textAnchor="middle" fill={pinNameColor} fontSize="8" fontWeight="600">
            {pin.label || pin.id}
          </text>
        </g>
      ))}

      {/* Left Pins */}
      {finalLeftPins.map((pin, index) => {
        const py = -height / 2 + 28 + index * 20;
        return (
          <g key={pin.id || index}>
            <line x1={-width / 2 - 25} y1={py} x2={-width / 2} y2={py} stroke={strokeColor} strokeWidth="1.5" />
            <circle cx={-width / 2 - 25} cy={py} r="2.5" fill={strokeColor} />
            {/* Pin Number */}
            <text x={-width / 2 - 12} y={py - 3} textAnchor="middle" fill={pinNumColor} fontSize="8" fontWeight="bold">
              {pin.id}
            </text>
            {/* Pin Name */}
            <text x={-width / 2 + 6} y={py + 3} textAnchor="start" fill={pinNameColor} fontSize="8" fontWeight="600">
              {pin.label || pin.id}
            </text>
          </g>
        );
      })}

      {/* Right Pins */}
      {finalRightPins.map((pin, index) => {
        const py = -height / 2 + 28 + index * 20;
        return (
          <g key={pin.id || index}>
            <line x1={width / 2} y1={py} x2={width / 2 + 25} y2={py} stroke={strokeColor} strokeWidth="1.5" />
            <circle cx={width / 2 + 25} cy={py} r="2.5" fill={strokeColor} />
            {/* Pin Number */}
            <text x={width / 2 + 12} y={py - 3} textAnchor="middle" fill={pinNumColor} fontSize="8" fontWeight="bold">
              {pin.id}
            </text>
            {/* Pin Name */}
            <text x={width / 2 - 6} y={py + 3} textAnchor="end" fill={pinNameColor} fontSize="8" fontWeight="600">
              {pin.label || pin.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ==========================================
// SVG LIVE PHYSICAL PACKAGE / FOOTPRINT PREVIEW
// ==========================================
const PhysicalPackagePreview: React.FC<{ definition: ComponentDefinition }> = ({ definition }) => {
  const pkg = definition.package || 'discrete';

  if (pkg === 'to220') {
    return (
      <svg width="200" height="160" viewBox="-70 -60 140 130">
        {/* Metal Backing Tab */}
        <path d="M -35 -45 L 35 -45 L 35 -10 L -35 -10 Z" fill="#B0B5B9" stroke="#71767B" strokeWidth="1.5" />
        <circle cx="0" cy="-28" r="9" fill="#E2E5E8" stroke="#71767B" strokeWidth="1.5" />
        {/* Plastic Molded Body */}
        <rect x="-38" y="-10" width="76" height="45" fill="#1C1F22" rx="3" stroke="#3A3F45" strokeWidth="1" />
        <text x="0" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
          {definition.type.toUpperCase()}
        </text>
        {/* 3 Lead Pins */}
        <rect x="-24" y="35" width="8" height="30" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="1" />
        <rect x="-4" y="35" width="8" height="30" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="1" />
        <rect x="16" y="35" width="8" height="30" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="1" />
        {/* Pin labels */}
        <text x="-20" y="60" textAnchor="middle" fill="#50555A" fontSize="7" fontWeight="bold">IN</text>
        <text x="0" y="60" textAnchor="middle" fill="#50555A" fontSize="7" fontWeight="bold">GND</text>
        <text x="20" y="60" textAnchor="middle" fill="#50555A" fontSize="7" fontWeight="bold">OUT</text>
      </svg>
    );
  }

  if (pkg === 'to92') {
    return (
      <svg width="200" height="160" viewBox="-60 -50 120 120">
        {/* D-Shape curved body */}
        <path d="M -25 -10 C -25 -35 25 -35 25 -10 L 25 15 L -25 15 Z" fill="#1C1F22" stroke="#3A3F45" strokeWidth="1.5" />
        <text x="0" y="5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
          {definition.type.toUpperCase()}
        </text>
        {/* 3 Leads */}
        <rect x="-18" y="15" width="6" height="35" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="1" />
        <rect x="-3" y="15" width="6" height="35" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="1" />
        <rect x="12" y="15" width="6" height="35" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="1" />
      </svg>
    );
  }

  if (definition.type === 'switch') {
    return (
      <svg width="220" height="150" viewBox="-80 -50 160 100">
        <line x1="-70" y1="0" x2="-35" y2="0" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="0" x2="70" y2="0" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        <rect x="-35" y="-18" width="70" height="36" fill="#27272A" stroke="#3F3F46" strokeWidth="1.5" rx="4" />
        <rect x="-30" y="-14" width="60" height="28" fill="#52525B" rx="2" />
        <rect x="-22" y="-6" width="44" height="12" fill="#18181B" rx="2" />
        <rect x="-20" y="-10" width="18" height="20" fill="#E4E4E7" stroke="#09090B" strokeWidth="1" rx="2" />
        <line x1="-14" y1="-5" x2="-14" y2="5" stroke="#71717A" strokeWidth="1.5" />
        <line x1="-8" y1="-5" x2="-8" y2="5" stroke="#71717A" strokeWidth="1.5" />
      </svg>
    );
  }

  if (definition.type === 'pushbutton') {
    return (
      <svg width="220" height="150" viewBox="-80 -50 160 100">
        {/* Metal Leads (Tactile 6x6mm button) */}
        <line x1="-40" y1="-20" x2="-22" y2="-20" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        <line x1="-40" y1="20" x2="-22" y2="20" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="-20" x2="40" y2="-20" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="20" x2="40" y2="20" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        {/* Square Body */}
        <rect x="-24" y="-24" width="48" height="48" fill="#2C3E50" stroke="#1A252F" strokeWidth="1.5" rx="4" />
        {/* Metal Top Bracket */}
        <rect x="-18" y="-18" width="36" height="36" fill="#7F8C8D" rx="2" />
        <circle cx="-13" cy="-13" r="2" fill="#52525B" />
        <circle cx="13" cy="-13" r="2" fill="#52525B" />
        <circle cx="-13" cy="13" r="2" fill="#52525B" />
        <circle cx="13" cy="13" r="2" fill="#52525B" />
        {/* Round Actuator Button */}
        <circle cx="0" cy="0" r="11" fill="#E74C3C" stroke="#C0392B" strokeWidth="1" />
      </svg>
    );
  }

  if (pkg === 'discrete') {
    return (
      <svg width="220" height="150" viewBox="-80 -50 160 100">
        <line x1="-70" y1="0" x2="-35" y2="0" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="0" x2="70" y2="0" stroke="#CBD0D4" strokeWidth="3" strokeLinecap="round" />
        <rect x="-35" y="-12" width="70" height="24" fill="#E2A66D" stroke="#5C4033" strokeWidth="1.5" rx="5" />
        {/* Color Bands */}
        <rect x="-24" y="-12" width="5" height="24" fill="#8B4513" />
        <rect x="-12" y="-12" width="5" height="24" fill="#000000" />
        <rect x="0" y="-12" width="5" height="24" fill="#FF0000" />
        <rect x="15" y="-12" width="5" height="24" fill="#FFD700" />
      </svg>
    );
  }

  // DIP IC Packages (DIP-8, DIP-14, DIP-16)
  const pinCount = pkg === 'dip14' ? 14 : (pkg === 'dip16' ? 16 : 8);
  const pinsPerSide = pinCount / 2;
  const chipHeight = pinsPerSide * 16 + 18;
  const chipWidth = 52;

  const leftPins = Array.from({ length: pinsPerSide }, (_, i) => i + 1);
  const rightPins = Array.from({ length: pinsPerSide }, (_, i) => pinCount - i);

  return (
    <svg width="220" height="160" viewBox={`-65 -${chipHeight / 2 + 10} 130 ${chipHeight + 20}`}>
      {/* Metallic Lead Pins on Left */}
      {leftPins.map((num, i) => {
        const y = -chipHeight / 2 + 16 + i * 16;
        return (
          <g key={num}>
            <rect x="-40" y={y - 3} width="16" height="6" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="0.8" rx="1" />
            <text x="-46" y={y + 2.5} fill="#7A8086" fontSize="6" fontWeight="bold" textAnchor="end">{num}</text>
          </g>
        );
      })}

      {/* Metallic Lead Pins on Right */}
      {rightPins.map((num, i) => {
        const y = -chipHeight / 2 + 16 + i * 16;
        return (
          <g key={num}>
            <rect x="24" y={y - 3} width="16" height="6" fill="#CBD0D4" stroke="#8A8F94" strokeWidth="0.8" rx="1" />
            <text x="46" y={y + 2.5} fill="#7A8086" fontSize="6" fontWeight="bold" textAnchor="start">{num}</text>
          </g>
        );
      })}

      {/* Main Molded Epoxy IC Body */}
      <rect
        x={-chipWidth / 2}
        y={-chipHeight / 2}
        width={chipWidth}
        height={chipHeight}
        fill="#1C1F22"
        stroke="#3A3F45"
        strokeWidth="1.2"
        rx="2"
      />

      {/* Orientation Notch at top */}
      <path
        d={`M -8 -${chipHeight / 2} A 8 8 0 0 0 8 -${chipHeight / 2}`}
        fill="#141618"
        stroke="#3A3F45"
        strokeWidth="1"
      />

      {/* Pin 1 Orientation Dot */}
      <circle cx="-16" cy={-chipHeight / 2 + 14} r="3" fill="#141618" stroke="#2B2F35" strokeWidth="0.8" />

      {/* Laser Engraved Part Text */}
      <text
        x="0"
        y="-4"
        textAnchor="middle"
        fill="#E2E6EA"
        fontSize="8"
        fontWeight="bold"
        letterSpacing="0.5"
      >
        {definition.type.toUpperCase()}
      </text>
      <text
        x="0"
        y="8"
        textAnchor="middle"
        fill="#8A929A"
        fontSize="6"
        letterSpacing="0.2"
      >
        {pkg.toUpperCase()}
      </text>
    </svg>
  );
};
