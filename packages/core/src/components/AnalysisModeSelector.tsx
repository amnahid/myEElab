import React, { useState, useRef, useEffect } from 'react';
import { Zap, TrendingUp, Gauge, Radio, ChevronDown, Check, Settings } from 'lucide-react';

export type AnalysisKind = 'interactive' | 'op' | 'tran' | 'ac' | 'dc';

interface AnalysisModeConfig {
  id: AnalysisKind;
  label: string;
  badge?: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
}

const MODES: AnalysisModeConfig[] = [
  {
    id: 'interactive',
    label: 'Interactive Workbench',
    badge: 'LIVE',
    description: 'Unified DC bias, waveforms & live meters',
    icon: <Zap size={16} />,
    iconColor: '#2ecc71'
  },
  {
    id: 'tran',
    label: 'Transient Analysis',
    description: 'Time-domain waveform simulation (.tran)',
    icon: <TrendingUp size={16} />,
    iconColor: '#3498db'
  },
  {
    id: 'op',
    label: 'DC Operating Point',
    description: 'Static nodal voltages & bias currents (.op)',
    icon: <Gauge size={16} />,
    iconColor: '#f39c12'
  },
  {
    id: 'ac',
    label: 'Frequency Sweep',
    description: 'Small-signal AC transfer & Bode plot (.ac)',
    icon: <Radio size={16} />,
    iconColor: '#9b59b6'
  }
];

interface AnalysisModeSelectorProps {
  activeAnalysis: AnalysisKind;
  onSelectMode: (mode: AnalysisKind) => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  theme: 'light' | 'dark';
}

export const AnalysisModeSelector: React.FC<AnalysisModeSelectorProps> = ({
  activeAnalysis,
  onSelectMode,
  showSettings,
  onToggleSettings,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeMode = MODES.find((m) => m.id === activeAnalysis) || MODES[0];

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#20252A' : '#F5F2EB',
    panelBg: isDark ? '#262C33' : '#FFFFFF',
    border: isDark ? '#38424B' : '#D0C8B8',
    text: isDark ? '#EEEAE4' : '#2C3E50',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    activeBg: isDark ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.12)',
    muted: isDark ? '#8A99A8' : '#7F8C8D',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* Pill Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: colors.panelBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          height: '32px'
        }}
      >
        {/* Mode Selector Trigger */}
        <button
          type="button"
          onClick={() => {
            if (!isOpen && showSettings) {
              onToggleSettings();
            }
            setIsOpen(!isOpen);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            background: 'transparent',
            border: 'none',
            color: colors.text,
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 500,
            outline: 'none',
            userSelect: 'none'
          }}
          title="Select Simulation Mode"
        >
          <span style={{ display: 'flex', alignItems: 'center', color: activeMode.iconColor }}>
            {activeMode.icon}
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{activeMode.label}</span>
          {activeMode.badge && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#fff',
                background: '#2ecc71',
                padding: '1px 5px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}
            >
              {activeMode.badge}
            </span>
          )}
          <ChevronDown
            size={14}
            style={{
              marginLeft: '2px',
              color: colors.muted,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.18s ease'
            }}
          />
        </button>

        {/* Divider */}
        {activeAnalysis !== 'op' && (
          <div
            style={{
              width: '1px',
              height: '18px',
              background: colors.border
            }}
          />
        )}

        {/* Settings Button */}
        {activeAnalysis !== 'op' && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onToggleSettings();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 8px',
              background: showSettings ? colors.hoverBg : 'transparent',
              border: 'none',
              color: showSettings ? 'var(--highlight)' : colors.muted,
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '0 5px 5px 0',
              transition: 'color 0.15s'
            }}
            title="Analysis Settings"
          >
            <Settings size={15} />
          </button>
        )}
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '290px',
            background: colors.panelBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.25)',
            padding: '6px',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          <div
            style={{
              padding: '6px 8px 4px 8px',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: colors.muted
            }}
          >
            Simulation Engine Mode
          </div>

          {MODES.map((mode) => {
            const isSelected = mode.id === activeAnalysis;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  onSelectMode(mode.id);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${mode.iconColor}44` : '1px solid transparent',
                  background: isSelected ? colors.activeBg : 'transparent',
                  color: colors.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: 'none',
                  transition: 'background 0.12s',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = colors.hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '5px',
                    background: `${mode.iconColor}18`,
                    color: mode.iconColor,
                    flexShrink: 0
                  }}
                >
                  {mode.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{mode.label}</span>
                    {mode.badge && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: '#fff',
                          background: '#2ecc71',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          letterSpacing: '0.4px'
                        }}
                      >
                        {mode.badge}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: colors.muted,
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {mode.description}
                  </div>
                </div>

                {isSelected && (
                  <Check size={16} style={{ color: mode.iconColor, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
