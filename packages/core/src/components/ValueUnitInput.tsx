import React, { useState, useEffect } from 'react';

const SPICE_UNITS = [
  { label: 'T (Tera)', value: 'T' },
  { label: 'G (Giga)', value: 'G' },
  { label: 'Meg (Mega)', value: 'Meg' },
  { label: 'k (Kilo)', value: 'k' },
  { label: '—', value: '' },
  { label: 'm (Milli)', value: 'm' },
  { label: 'u (Micro)', value: 'u' },
  { label: 'n (Nano)', value: 'n' },
  { label: 'p (Pico)', value: 'p' },
  { label: 'f (Femto)', value: 'f' },
];

interface ValueUnitInputProps {
  value: string | number;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
  colors?: { border: string; inputBg: string; text: string };
}

export const ValueUnitInput: React.FC<ValueUnitInputProps> = ({ value, onChange, style, colors }) => {
  const defaultColors = { border: '#ccc', inputBg: '#fff', text: '#000' };
  const themeColors = colors || defaultColors;
  
  // Parse incoming SPICE string (e.g. "10k", "4.7Meg", "100")
  const parseSpiceValue = (str: string) => {
    const match = str.match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s*([a-zA-Z]*)$/);
    if (match) {
      return { num: match[1], unit: match[2] };
    }
    return { num: str, unit: '' };
  };

  const [numVal, setNumVal] = useState('');
  const [unitVal, setUnitVal] = useState('');

  useEffect(() => {
    const parsed = parseSpiceValue(String(value ?? ''));
    setNumVal(parsed.num);
    
    // Normalize unit if they typed it directly previously
    let normalizedUnit = parsed.unit;
    if (normalizedUnit.toLowerCase() === 'meg') normalizedUnit = 'Meg';
    else if (normalizedUnit === 'M') normalizedUnit = 'm'; // M in spice is milli, enforce 'm' for clarity
    
    // Check if it's in our known list, otherwise leave it empty or as is
    const knownUnit = SPICE_UNITS.find(u => u.value.toLowerCase() === normalizedUnit.toLowerCase())?.value;
    setUnitVal(knownUnit !== undefined ? knownUnit : normalizedUnit);
  }, [value]);

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNum = e.target.value;
    setNumVal(newNum);
    onChange(`${newNum}${unitVal}`);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setUnitVal(newUnit);
    onChange(`${numVal}${newUnit}`);
  };

  return (
    <div style={{ display: 'flex', gap: '4px', ...style }}>
      <input 
        type="text" 
        value={numVal} 
        onChange={handleNumChange}
        style={{ 
          flex: 1, 
          padding: '6px', 
          border: `1px solid ${themeColors.border}`, 
          borderRadius: '4px', 
          backgroundColor: themeColors.inputBg, 
          color: themeColors.text,
          minWidth: '0'
        }} 
      />
      <select
        value={unitVal}
        onChange={handleUnitChange}
        style={{
          width: '100px',
          padding: '6px',
          border: `1px solid ${themeColors.border}`,
          borderRadius: '4px',
          backgroundColor: themeColors.inputBg,
          color: themeColors.text,
          cursor: 'pointer'
        }}
      >
        {SPICE_UNITS.map(u => (
          <option key={u.value} value={u.value}>{u.label}</option>
        ))}
        {/* Fallback if somehow there's an unknown unit string */}
        {!SPICE_UNITS.find(u => u.value === unitVal) && unitVal !== '' && (
          <option value={unitVal}>{unitVal}</option>
        )}
      </select>
    </div>
  );
};
