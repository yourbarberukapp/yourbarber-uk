'use client';

export type OpeningHours = {
  mon: { open: string; close: string; closed: boolean };
  tue: { open: string; close: string; closed: boolean };
  wed: { open: string; close: string; closed: boolean };
  thu: { open: string; close: string; closed: boolean };
  fri: { open: string; close: string; closed: boolean };
  sat: { open: string; close: string; closed: boolean };
  sun: { open: string; close: string; closed: boolean };
};

export const DEFAULT_HOURS: OpeningHours = {
  mon: { open: '09:30', close: '18:00', closed: false },
  tue: { open: '09:30', close: '18:00', closed: false },
  wed: { open: '09:30', close: '18:00', closed: false },
  thu: { open: '09:30', close: '18:00', closed: false },
  fri: { open: '09:30', close: '18:00', closed: false },
  sat: { open: '09:00', close: '18:00', closed: false },
  sun: { open: '10:00', close: '16:00', closed: false },
};

const DAY_LABELS: Record<keyof OpeningHours, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

interface Props {
  value: OpeningHours;
  onChange: (next: OpeningHours) => void;
}

export function HoursEditor({ value, onChange }: Props) {
  function updateDay(day: keyof OpeningHours, field: 'open' | 'close' | 'closed', val: string | boolean) {
    onChange({ ...value, [day]: { ...value[day], [field]: val } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(Object.keys(DAY_LABELS) as (keyof OpeningHours)[]).map((day) => {
        const d = value[day];
        return (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ width: 80, fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {DAY_LABELS[day].slice(0, 3)}
            </span>
            <button
              type="button"
              onClick={() => updateDay(day, 'closed', !d.closed)}
              style={{
                width: 56, padding: '0.25rem 0', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.12s', border: 'none',
                background: d.closed ? 'rgba(255,255,255,0.08)' : 'rgba(200,241,53,0.15)',
                color: d.closed ? 'rgba(255,255,255,0.3)' : '#C8F135',
              }}
            >
              {d.closed ? 'Closed' : 'Open'}
            </button>
            {!d.closed && (
              <>
                <input
                  type="time"
                  value={d.open}
                  onChange={e => updateDay(day, 'open', e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem', outline: 'none', width: 90 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>–</span>
                <input
                  type="time"
                  value={d.close}
                  onChange={e => updateDay(day, 'close', e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.8rem', outline: 'none', width: 90 }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
