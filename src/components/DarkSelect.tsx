'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string };

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export function DarkSelect({ value, onChange, options, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }} className={className}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          height: 44,
          padding: '0 2.25rem 0 0.875rem',
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${open ? 'rgba(200,241,53,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 12,
          color: 'white',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-inter, sans-serif)',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color 0.15s',
          outline: 'none',
        }}
      >
        <span>{selected?.label ?? ''}</span>
        <ChevronDown
          size={14}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: 'transform 0.15s',
            color: 'rgba(255,255,255,0.35)',
            pointerEvents: 'none',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: '#111',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
          zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          {options.map((opt, i) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.875rem',
                  background: isActive ? 'rgba(200,241,53,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  color: isActive ? '#C8F135' : 'rgba(255,255,255,0.75)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-inter, sans-serif)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {opt.label}
                {isActive && <span style={{ fontSize: '0.7rem', color: '#C8F135' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
