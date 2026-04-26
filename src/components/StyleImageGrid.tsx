'use client';
import { useState } from 'react';

export type StyleOption = { name: string; imageUrl?: string | null };

interface Props {
  options: StyleOption[];
  selected: string | string[];
  multi?: boolean;
  onToggle: (name: string) => void;
}

function resolveImage(opt: StyleOption): string {
  return opt.imageUrl ?? `/styles/${opt.name}.png`;
}

function isSelected(selected: string | string[], name: string) {
  return Array.isArray(selected) ? selected.includes(name) : selected === name;
}

export function StyleImageGrid({ options, selected, multi = false, onToggle }: Props) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  function markError(name: string) {
    setImgErrors(prev => ({ ...prev, [name]: true }));
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0.5rem',
    }}>
      {options.map(opt => {
        const { name } = opt;
        const active = isSelected(selected, name);
        const src = resolveImage(opt);
        const hasImg = !imgErrors[name];
        return (
          <button
            key={name}
            type="button"
            onClick={() => onToggle(name)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: active ? '2px solid #C8F135' : '2px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              overflow: 'hidden',
              background: active ? 'rgba(200,241,53,0.06)' : '#0d0d0d',
              cursor: 'pointer',
              padding: 0,
              transition: 'border-color 0.12s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {hasImg ? (
              <img
                src={src}
                alt={name}
                onError={() => markError(name)}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  display: 'block',
                  filter: active ? 'none' : 'brightness(0.75) saturate(0.9)',
                  transition: 'filter 0.12s',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#111',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                padding: '0.25rem',
                fontFamily: 'var(--font-barlow, sans-serif)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {name}
              </div>
            )}
            <span style={{
              display: 'block',
              width: '100%',
              padding: '0.3rem 0.25rem 0.35rem',
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textAlign: 'center',
              fontFamily: 'var(--font-barlow, sans-serif)',
              color: active ? '#C8F135' : 'rgba(255,255,255,0.55)',
              lineHeight: 1.2,
              transition: 'color 0.12s',
            }}>
              {name}
            </span>
            {active && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#C8F135',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#000',
                fontWeight: 900,
                lineHeight: 1,
              }}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
