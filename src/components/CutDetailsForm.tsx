'use client';

export type CutDetails = {
  style: string[];
  sidesGrade: string;
  topLength: string;
  beard: string;
  products: string[];
  techniques: string[];
};

export const EMPTY_CUT_DETAILS: CutDetails = {
  style: [],
  sidesGrade: '',
  topLength: '',
  beard: '',
  products: [],
  techniques: [],
};

export const STYLES = [
  'Skin Fade', 'Low Fade', 'Mid Fade', 'High Fade', 'Taper Fade', 'Drop Fade',
  'Scissor Cut', 'Crop', 'Textured Crop', 'Slick Back', 'Pompadour', 'Quiff',
  'Buzz Cut', 'Crew Cut', 'Classic Cut', 'Undercut',
  'Shape Up', 'Waves', 'Curls', 'Afro', 'Head Shave',
];

export const SIDES_GRADES =['0 (Bald)', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', 'Scissors', 'Razor'];

export const TOP_LENGTHS =['Scissors', '3', '4', '5', '6', '7', '8', 'Left long', 'Very short'];

export const BEARD_OPTIONS =['Not done', 'Shape up', 'Fade into beard', 'Trim', 'Full shave', 'Hot towel shave'];

export const PRODUCTS =['None', 'Pomade', 'Clay', 'Wax', 'Sea Salt Spray', 'Mousse', 'Fibre', 'Gel', 'Oil', 'Conditioner'];

export const TECHNIQUES =['Line up', 'Hot towel', 'Razor fade', 'Blending', 'Texturising', 'Thinning shears', 'Skin fade', 'Scissor over comb'];

interface Props {
  value: CutDetails;
  onChange: (next: CutDetails) => void;
}

export const label: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem',
  fontFamily: 'var(--font-barlow, sans-serif)',
};

export function ChipGroup({
  title, options, selected, multi, onToggle,
}: {
  title: string;
  options: string[];
  selected: string | string[];
  multi: boolean;
  onToggle: (val: string) => void;
}) {
  const isSelected = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <span style={label}>{title}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => {
          const active = isSelected(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 4,
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'var(--font-barlow, sans-serif)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.12s',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
                background: active ? '#C8F135' : '#1a1a1a',
                color: active ? '#0A0A0A' : 'rgba(255,255,255,0.55)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CutDetailsForm({ value, onChange }: Props) {
  function toggleMulti(field: 'style' | 'products' | 'techniques', val: string) {
    const current = value[field];
    const next = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    onChange({ ...value, [field]: next });
  }

  function setSingle(field: 'sidesGrade' | 'topLength' | 'beard', val: string) {
    onChange({ ...value, [field]: value[field] === val ? '' : val });
  }

  return (
    <div>
      <ChipGroup
        title="Style"
        options={STYLES}
        selected={value.style}
        multi={true}
        onToggle={(v) => toggleMulti('style', v)}
      />
      <ChipGroup
        title="Sides & back grade"
        options={SIDES_GRADES}
        selected={value.sidesGrade}
        multi={false}
        onToggle={(v) => setSingle('sidesGrade', v)}
      />
      <ChipGroup
        title="Top length"
        options={TOP_LENGTHS}
        selected={value.topLength}
        multi={false}
        onToggle={(v) => setSingle('topLength', v)}
      />
      <ChipGroup
        title="Beard"
        options={BEARD_OPTIONS}
        selected={value.beard}
        multi={false}
        onToggle={(v) => setSingle('beard', v)}
      />
      <ChipGroup
        title="Products used"
        options={PRODUCTS}
        selected={value.products}
        multi={true}
        onToggle={(v) => toggleMulti('products', v)}
      />
      <ChipGroup
        title="Techniques"
        options={TECHNIQUES}
        selected={value.techniques}
        multi={true}
        onToggle={(v) => toggleMulti('techniques', v)}
      />
    </div>
  );
}
