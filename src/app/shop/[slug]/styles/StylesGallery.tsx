'use client';
import { useState } from 'react';

type Style = { id: string; name: string; category: string; imageUrl?: string | null };

const CATEGORIES = [
  { value: 'all',     label: 'All' },
  { value: 'fade',    label: 'Fade' },
  { value: 'taper',   label: 'Taper' },
  { value: 'classic', label: 'Classic' },
  { value: 'natural', label: 'Natural' },
  { value: 'beard',   label: 'Beard' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  fade:    'text-[#C8F135]',
  taper:   'text-blue-400',
  classic: 'text-pink-400',
  natural: 'text-orange-400',
  beard:   'text-purple-400',
};

const CATEGORY_BG_COLORS: Record<string, string> = {
  fade:    'bg-[#C8F135]/20',
  taper:   'bg-blue-400/20',
  classic: 'bg-pink-400/20',
  natural: 'bg-orange-400/20',
  beard:   'bg-purple-400/20',
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  fade:    'border-[#C8F135]',
  taper:   'border-blue-400',
  classic: 'border-pink-400',
  natural: 'border-orange-400',
  beard:   'border-purple-400',
};

const CATEGORY_CHECK_COLORS: Record<string, string> = {
  fade:    'bg-[#C8F135]',
  taper:   'bg-blue-400',
  classic: 'bg-pink-400',
  natural: 'bg-orange-400',
  beard:   'bg-purple-400',
};

interface Props {
  styles: Style[];
}

export function StylesGallery({ styles }: Props) {
  const [filter, setFilter] = useState('all');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const availableCats = CATEGORIES.filter(c =>
    c.value === 'all' || styles.some(s => s.category === c.value)
  );

  const filtered = filter === 'all' ? styles : styles.filter(s => s.category === filter);

  function markError(name: string) {
    setImgErrors(prev => ({ ...prev, [name]: true }));
  }

  return (
    <>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {availableCats.map(cat => {
          const active = filter === cat.value;
          
          let btnClass = "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide font-barlow cursor-pointer transition-all border ";
          
          if (active) {
            if (cat.value === 'all') {
               btnClass += "border-transparent bg-white/10 text-white/90";
            } else {
               btnClass += `border-transparent ${CATEGORY_BG_COLORS[cat.value]} ${CATEGORY_COLORS[cat.value]}`;
            }
          } else {
            btnClass += "border-white/10 bg-transparent text-white/30";
          }
          
          return (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={btnClass}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(style => {
          const isSelected = selected === style.name;
          const hasImg = !imgErrors[style.name];
          
          const catColorClass = CATEGORY_COLORS[style.category] ?? 'text-white/50';
          const catBorderClass = CATEGORY_BORDER_COLORS[style.category] ?? 'border-white/50';
          const catBgClass = CATEGORY_BG_COLORS[style.category] ?? 'bg-white/10';
          const checkBgClass = CATEGORY_CHECK_COLORS[style.category] ?? 'bg-white/50';

          return (
            <button
              key={style.id}
              onClick={() => setSelected(isSelected ? null : style.name)}
              className={`relative flex flex-col items-center border-2 rounded-xl overflow-hidden cursor-pointer p-0 transition-all text-left w-full
                ${isSelected ? `${catBorderClass} ${catBgClass}` : 'border-white/5 bg-[#0d0d0d]'}
              `}
            >
              {hasImg ? (
                <img
                  src={style.imageUrl ?? `/styles/${style.name}.png`}
                  alt={style.name}
                  onError={() => markError(style.name)}
                  className={`w-full aspect-square object-cover block transition-all ${isSelected ? 'brightness-100' : 'brightness-75 saturate-75'}`}
                />
              ) : (
                <div className={`w-full aspect-square flex items-center justify-center p-2 ${catBgClass}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-center font-barlow ${catColorClass}`}>
                    {style.name}
                  </span>
                </div>
              )}
              <div className="w-full px-2 py-2 bg-[#0a0a0a] border-t border-white/5">
                <span className={`block text-[11px] font-bold uppercase tracking-widest font-barlow leading-tight transition-colors ${isSelected ? catColorClass : 'text-white/60'}`}>
                  {style.name}
                </span>
                <span className={`block text-[9px] uppercase tracking-wider font-barlow mt-0.5 opacity-70 ${catColorClass}`}>
                  {style.category}
                </span>
              </div>

              {isSelected && (
                <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-black font-black ${checkBgClass}`}>
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Show this to your barber prompt */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 bg-[#0A0A0A]/95 border-t border-white/10 backdrop-blur-md z-20">
          <p className="text-[11px] text-white/35 uppercase tracking-widest font-bold font-barlow mb-1">
            Selected
          </p>
          <p className="font-barlow font-black text-2xl uppercase text-[#C8F135] tracking-tight">
            {selected}
          </p>
          <p className="text-sm text-white/40 mt-1 font-inter">
            Show this screen to your barber when you arrive.
          </p>
        </div>
      )}
    </>
  );
}
