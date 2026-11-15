import React, { useState } from 'react';
import { X, Cpu, FileCode, CheckCircle, AlertCircle } from 'lucide-react';
import { ComponentDefinition, Pin, PackageType } from '../models/circuit';
import { useEditorStore } from '../store/editorStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export const ImportModelModal: React.FC<Props> = ({ isOpen, onClose, theme }) => {
  const [activeTab, setActiveTab] = useState<'spice' | 'easyeda'>('spice');
  
  // SPICE Form State
  const [spiceCode, setSpiceCode] = useState('');
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [category, setCategory] = useState<ComponentDefinition['category']>('analog_ic');
  const [pkg, setPkg] = useState<PackageType>('dip8');
  const [parsedPins, setParsedPins] = useState<string[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // EasyEDA Form State
  const [easyEdaJson, setEasyEdaJson] = useState('');

  const addCustomComponent = useEditorStore(state => state.addCustomComponent);
  const setMode = useEditorStore(state => state.setMode);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#20252A' : '#ffffff',
    text: isDark ? '#EEEAE4' : '#2c3e50',
    subText: isDark ? '#A0AAB2' : '#7f8c8d',
    border: isDark ? '#3E474F' : '#dcdde1',
    inputBg: isDark ? '#191C20' : '#f5f6fa',
    highlight: isDark ? '#3498db' : '#2980b9',
    cardBg: isDark ? '#2B323A' : '#f8f9fa'
  };

  const parseSpiceSubcircuit = (code: string) => {
    setStatusMsg(null);
    const lines = code.split(/\r?\n/);
    let subcktLine = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\.subckt\s+/i.test(trimmed)) {
        subcktLine = trimmed;
        break;
      }
    }

    if (!subcktLine) {
      setStatusMsg({ type: 'error', text: 'No valid .subckt line found in text.' });
      return;
    }

    const tokens = subcktLine.split(/\s+/).slice(1);
    if (tokens.length < 2) {
      setStatusMsg({ type: 'error', text: 'Invalid .subckt line: requires a subcircuit name and at least one port.' });
      return;
    }

    const subName = tokens[0];
    const ports = tokens.slice(1);

    setName(subName);
    setTypeId(subName.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    setParsedPins(ports);
    
    // Auto-detect package based on pin count
    if (ports.length <= 3) setPkg('to92');
    else if (ports.length <= 8) setPkg('dip8');
    else if (ports.length <= 14) setPkg('dip14');
    else setPkg('dip16');

    setStatusMsg({ type: 'success', text: `Parsed subcircuit "${subName}" with ${ports.length} ports.` });
  };

  const handleSpiceExample = () => {
    const example = `* OPA2134 High Performance Audio Operational Amplifier
* Texas Instruments / Burr-Brown Model
.subckt OPA2134 1 2 3 4 5
* 1=IN+ 2=IN- 3=V+ 4=V- 5=OUT
Rin 1 2 10Meg
E1 5 0 1 2 100k
Rout 5 0 50
.ends OPA2134`;
    setSpiceCode(example);
    parseSpiceSubcircuit(example);
    setCategory('analog_ic');
    setPkg('dip8');
  };

  const handleEasyEdaExample = () => {
    const example = JSON.stringify({
      head: {
        docType: "2",
        name: "NE555P_DIP8",
        c_para: {
          package: "DIP-8",
          pre: "U?"
        }
      },
      package_detail: {
        package: "DIP-8"
      },
      pins: [
        { num: "1", name: "GND", x: -30, y: 30 },
        { num: "2", name: "TRIG", x: -30, y: 10 },
        { num: "3", name: "OUT", x: 30, y: -10 },
        { num: "4", name: "RESET", x: -30, y: -30 },
        { num: "5", name: "CTRL", x: 30, y: 30 },
        { num: "6", name: "THRES", x: -30, y: -10 },
        { num: "7", name: "DISCH", x: 30, y: 10 },
        { num: "8", name: "VCC", x: 30, y: -30 }
      ],
      spice_model: ".subckt NE555 1 2 3 4 5 6 7 8\\nRa 8 5 5k\\nRb 5 11 5k\\nRc 11 1 5k\\nBcomp1 12 1 V = (V(6,5) > 0 ? 1 : 0)\\nBcomp2 13 1 V = (V(11,2) > 0 ? 1 : 0)\\nR_latch 14 1 10k\\nC_latch 14 1 10n\\nB_latch 14 1 I = (V(4,1) < 0.7 ? 1m : (V(12,1) > 0.5 ? 1m : (V(13,1) > 0.5 ? -1m : 0)))\\nB_out 3 1 V = (V(4,1) < 0.7 ? 0 : (V(14,1) > 0.5 ? 0.1 : V(8,1) - 0.5))\\nS_disch 7 1 14 1 S_SW\\n.model S_SW SW(RON=5 ROFF=1Meg VT=0.5 VH=0.1)\\n.ends NE555"
    }, null, 2);
    setEasyEdaJson(example);
  };

  const handleImportSpice = () => {
    if (!name || !typeId || parsedPins.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please provide valid component details and at least one port.' });
      return;
    }

    // Build pins geometry
    const half = Math.ceil(parsedPins.length / 2);
    const pins: Pin[] = parsedPins.map((portName, idx) => {
      const isLeft = idx < half;
      const rowIdx = isLeft ? idx : idx - half;
      const yOffset = -((half - 1) * 15) / 2 + rowIdx * 15;
      return {
        id: String(idx + 1),
        label: portName,
        offset: { x: isLeft ? -30 : 30, y: Math.round(yOffset) }
      };
    });

    const newDef: ComponentDefinition = {
      type: typeId,
      name,
      category,
      package: pkg,
      pins,
      defaultParams: { model: name },
      spice: {
        prefix: 'X',
        modelType: 'subcircuit',
        subcircuitName: name,
        subcircuitBody: spiceCode.trim(),
        pinOrder: parsedPins
      }
    };

    addCustomComponent(newDef);
    setMode('place', typeId);
    onClose();
  };

  const handleImportEasyEda = () => {
    try {
      const data = JSON.parse(easyEdaJson);
      const partName = data.head?.name || data.title || "Custom_Part";
      const partType = partName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      const pinList: Pin[] = [];
      const pinOrder: string[] = [];

      if (Array.isArray(data.pins)) {
        data.pins.forEach((p: any, idx: number) => {
          const pid = String(p.num || idx + 1);
          pinList.push({
            id: pid,
            label: String(p.name || pid),
            offset: { x: p.x || (idx % 2 === 0 ? -30 : 30), y: p.y || (Math.floor(idx / 2) * 15 - 30) }
          });
          pinOrder.push(pid);
        });
      } else {
        throw new Error("Missing 'pins' array in EasyEDA JSON.");
      }

      let spiceBody = data.spice_model || data.spice;
      if (spiceBody && typeof spiceBody === 'string') {
        spiceBody = spiceBody.replace(/\\n/g, '\n');
      }

      const detectedPkg = (data.head?.c_para?.package || data.package_detail?.package || "").toLowerCase();
      let assignedPkg: PackageType = 'custom';
      if (detectedPkg.includes('dip-8') || detectedPkg.includes('dip8')) assignedPkg = 'dip8';
      else if (detectedPkg.includes('dip-14') || detectedPkg.includes('dip14')) assignedPkg = 'dip14';
      else if (detectedPkg.includes('dip-16') || detectedPkg.includes('dip16')) assignedPkg = 'dip16';
      else if (detectedPkg.includes('to-92')) assignedPkg = 'to92';
      else if (detectedPkg.includes('to-220')) assignedPkg = 'to220';
      else if (pinList.length <= 8) assignedPkg = 'dip8';
      else assignedPkg = 'dip14';

      const newDef: ComponentDefinition = {
        type: partType,
        name: partName,
        category: 'custom',
        package: assignedPkg,
        pins: pinList,
        defaultParams: { model: partName },
        spice: {
          prefix: 'X',
          modelType: 'subcircuit',
          subcircuitName: partName,
          subcircuitBody: spiceBody,
          pinOrder: pinOrder
        }
      };

      addCustomComponent(newDef);
      setMode('place', partType);
      onClose();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Failed to parse EasyEDA JSON: ${err.message}` });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        width: '640px',
        maxWidth: '92vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        color: colors.text,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={22} color={colors.highlight} />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Import Component / SPICE Library</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: colors.subText, cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, background: colors.cardBg }}>
          <button
            onClick={() => { setActiveTab('spice'); setStatusMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'spice' ? colors.bg : 'transparent',
              color: activeTab === 'spice' ? colors.highlight : colors.subText,
              fontWeight: activeTab === 'spice' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'spice' ? `2px solid ${colors.highlight}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FileCode size={18} />
            SPICE Subcircuit (.subckt)
          </button>
          <button
            onClick={() => { setActiveTab('easyeda'); setStatusMsg(null); }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === 'easyeda' ? colors.bg : 'transparent',
              color: activeTab === 'easyeda' ? colors.highlight : colors.subText,
              fontWeight: activeTab === 'easyeda' ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === 'easyeda' ? `2px solid ${colors.highlight}` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Cpu size={18} />
            EasyEDA JSON Part
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {statusMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.9rem',
              background: statusMsg.type === 'success' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
              color: statusMsg.type === 'success' ? '#2ecc71' : '#e74c3c',
              border: `1px solid ${statusMsg.type === 'success' ? '#2ecc71' : '#e74c3c'}`
            }}>
              {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {statusMsg.text}
            </div>
          )}

          {activeTab === 'spice' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Paste SPICE Subcircuit Definition:</label>
                <button
                  onClick={handleSpiceExample}
                  style={{
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.highlight,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Load Example: OPA2134
                </button>
              </div>

              <textarea
                value={spiceCode}
                onChange={(e) => {
                  setSpiceCode(e.target.value);
                  parseSpiceSubcircuit(e.target.value);
                }}
                placeholder={`.subckt LM741 1 2 3 4 5\n* 1=IN+ 2=IN- 3=V+ 4=V- 5=OUT\n...\n.ends LM741`}
                rows={6}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '5px',
                  padding: '10px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: colors.subText, display: 'block', marginBottom: '4px' }}>Component Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '4px', color: colors.text, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: colors.subText, display: 'block', marginBottom: '4px' }}>Unique Type ID</label>
                  <input
                    type="text"
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '4px', color: colors.text, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: colors.subText, display: 'block', marginBottom: '4px' }}>Library Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '4px', color: colors.text, boxSizing: 'border-box' }}
                  >
                    <option value="analog_ic">Analog IC / Op-Amp</option>
                    <option value="digital_logic">Digital Logic</option>
                    <option value="power">Power / Regulators</option>
                    <option value="semiconductors">Semiconductors</option>
                    <option value="passives">Passives</option>
                    <option value="custom">Custom / Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: colors.subText, display: 'block', marginBottom: '4px' }}>Breadboard Physical Package</label>
                  <select
                    value={pkg}
                    onChange={(e) => setPkg(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '4px', color: colors.text, boxSizing: 'border-box' }}
                  >
                    <option value="dip8">DIP-8 (Dual In-line 8-pin)</option>
                    <option value="dip14">DIP-14 (Dual In-line 14-pin)</option>
                    <option value="dip16">DIP-16 (Dual In-line 16-pin)</option>
                    <option value="to92">TO-92 (3-pin Transistor)</option>
                    <option value="to220">TO-220 (3-pin Power Tab)</option>
                    <option value="discrete">Discrete / 2-pin</option>
                  </select>
                </div>
              </div>

              {parsedPins.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: colors.subText, display: 'block', marginBottom: '4px' }}>Detected Port Order ({parsedPins.length} pins):</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {parsedPins.map((p, i) => (
                      <span key={i} style={{ padding: '4px 8px', background: colors.cardBg, borderRadius: '4px', border: `1px solid ${colors.border}`, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        Pin {i + 1}: {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'easyeda' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Paste EasyEDA Component JSON:</label>
                <button
                  onClick={handleEasyEdaExample}
                  style={{
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.highlight,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Load Example: EasyEDA 555 Part
                </button>
              </div>

              <textarea
                value={easyEdaJson}
                onChange={(e) => setEasyEdaJson(e.target.value)}
                placeholder={`{\n  "head": { "name": "NE555P" },\n  "pins": [{ "num": "1", "name": "GND" }, ...]\n}`}
                rows={10}
                style={{
                  width: '100%',
                  background: colors.inputBg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '5px',
                  padding: '10px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: 0, fontSize: '0.8rem', color: colors.subText }}>
                Supports standard exported EasyEDA JSON symbols, pin definitions, and embedded SPICE macromodels.
              </p>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.text,
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={activeTab === 'spice' ? handleImportSpice : handleImportEasyEda}
            style={{
              padding: '8px 18px',
              background: colors.highlight,
              border: 'none',
              color: '#ffffff',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Add to Component Library
          </button>
        </div>
      </div>
    </div>
  );
};
