'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoCapture } from '@/components/PhotoCapture';
import { CutDetails, EMPTY_CUT_DETAILS, ChipGroup, label, SIDES_GRADES, TOP_LENGTHS } from '@/components/CutDetailsForm';
import { StyleImageGrid, StyleOption } from '@/components/StyleImageGrid';
import { FeedbackScreen } from '@/components/FeedbackScreen';

interface Props {
  customer: { id: string; name: string | null; phone: string; smsOptIn: string };
  shopName: string;
}

type OuterTab = 'style' | 'grade' | 'beard' | 'notes' | 'photos';
type ShopStyle = { id: string; name: string; category: string; imageUrl?: string | null };
type SmsOptIn = 'yes' | 'no' | 'not_asked';

const OUTER_TABS: { id: OuterTab; label: string }[] = [
  { id: 'style', label: 'Style' },
  { id: 'grade', label: 'Grade' },
  { id: 'beard', label: 'Beard' },
  { id: 'notes', label: 'Notes' },
  { id: 'photos', label: 'Photos' },
];

const STYLE_CATS = [
  { value: 'fade',    label: 'Fade' },
  { value: 'taper',   label: 'Taper' },
  { value: 'classic', label: 'Classic' },
  { value: 'natural', label: 'Natural' },
] as const;

export function VisitRecordClient({ customer, shopName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'photos' | 'feedback'>('details');
  const [visitId, setVisitId] = useState<string | null>(null);
  const [outerTab, setOuterTab] = useState<OuterTab>('style');
  const [styleCat, setStyleCat] = useState<string>('fade');
  const [shopStyles, setShopStyles] = useState<ShopStyle[]>([]);
  const [stylesLoaded, setStylesLoaded] = useState(false);
  const [cutDetails, setCutDetails] = useState<CutDetails>(EMPTY_CUT_DETAILS);
  const [recommendation, setRecommendation] = useState('');
  const [notes, setNotes] = useState('');
  const [smsOptIn, setSmsOptIn] = useState<SmsOptIn>(
    customer.smsOptIn === 'yes' || customer.smsOptIn === 'no' || customer.smsOptIn === 'not_asked'
      ? customer.smsOptIn
      : 'not_asked'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/shop/styles')
      .then(r => r.json())
      .then(d => {
        const styles: ShopStyle[] = d.styles ?? [];
        setShopStyles(styles);
        // Default to first available category
        const firstCat = STYLE_CATS.find(c => styles.some(s => s.category === c.value));
        if (firstCat) setStyleCat(firstCat.value);
        setStylesLoaded(true);
      });
  }, []);

  function toggleStyle(name: string) {
    const current = cutDetails.style;
    setCutDetails({
      ...cutDetails,
      style: current.includes(name) ? current.filter(v => v !== name) : [...current, name],
    });
  }

  function setBeard(name: string) {
    setCutDetails({ ...cutDetails, beard: cutDetails.beard === name ? '' : name });
  }

  function setSingle(field: 'sidesGrade' | 'topLength', val: string) {
    setCutDetails({ ...cutDetails, [field]: cutDetails[field] === val ? '' : val });
  }

  async function handleSave(thenGoToPhotos = false) {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/customers/${customer.id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, cutDetails, recommendation, smsOptIn }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.formErrors?.[0] ?? data?.error ?? 'Failed to save. Try again.');
      setSaving(false);
      return;
    }
    setVisitId(data.id);
    if (thenGoToPhotos) setOuterTab('photos');
    else setStep('photos');
    setSaving(false);
  }

  if (step === 'feedback') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <FeedbackScreen
          customerId={customer.id}
          visitId={visitId!}
          onDone={() => router.push(`/customers/${customer.id}`)}
        />
      </div>
    );
  }

  const stylesByCurrentCat: StyleOption[] = shopStyles.filter(s => s.category === styleCat).map(s => ({ name: s.name, imageUrl: s.imageUrl }));
  const beardStyles: StyleOption[] = shopStyles.filter(s => s.category === 'beard').map(s => ({ name: s.name, imageUrl: s.imageUrl }));
  const availableStyleCats = STYLE_CATS.filter(c => shopStyles.some(s => s.category === c.value));

  // Dot indicators for outer tabs
  const hasFade = cutDetails.style.length > 0;
  const hasGrade = !!(cutDetails.sidesGrade || cutDetails.topLength);
  const hasBeard = !!cutDetails.beard;
  const hasNotes = !!(recommendation || notes || smsOptIn !== 'not_asked');

  const outerTabFilled: Record<OuterTab, boolean> = {
    style: hasFade,
    grade: hasGrade,
    beard: hasBeard,
    notes: hasNotes,
    photos: !!visitId,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      {/* Outer tab bar */}
      <div style={{
        display: 'flex', gap: 4,
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: 4,
      }}>
        {OUTER_TABS.map(t => {
          const active = outerTab === t.id;
          const filled = outerTabFilled[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setOuterTab(t.id)}
              style={{
                flex: 1, padding: '0.5rem 0.25rem', borderRadius: 5, border: 'none',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                fontFamily: 'var(--font-barlow, sans-serif)', transition: 'all 0.15s',
                background: active ? '#C8F135' : 'transparent',
                color: active ? '#0A0A0A' : filled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                position: 'relative',
              }}
            >
              {t.label}
              {filled && !active && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 5, height: 5, borderRadius: '50%', background: '#C8F135',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '1rem 1.25rem',
        flex: 1, overflowY: 'auto',
      }}>

        {/* STYLE tab */}
        {outerTab === 'style' && (
          <>
            {!stylesLoaded ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>Loading styles…</p>
            ) : shopStyles.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                No styles configured. Go to <strong style={{ color: '#C8F135' }}>Settings → Cut Styles</strong> to set up your shop type.
              </p>
            ) : (
              <>
                {/* Style sub-category tabs */}
                {availableStyleCats.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {availableStyleCats.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setStyleCat(cat.value)}
                        style={{
                          padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.7rem',
                          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                          fontFamily: 'var(--font-barlow, sans-serif)', cursor: 'pointer',
                          transition: 'all 0.12s',
                          border: styleCat === cat.value ? 'none' : '1px solid rgba(255,255,255,0.12)',
                          background: styleCat === cat.value ? 'rgba(200,241,53,0.15)' : 'transparent',
                          color: styleCat === cat.value ? '#C8F135' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
                <StyleImageGrid
                  options={stylesByCurrentCat}
                  selected={cutDetails.style}
                  multi={true}
                  onToggle={toggleStyle}
                />
              </>
            )}
          </>
        )}

        {/* GRADE tab */}
        {outerTab === 'grade' && (
          <>
            <ChipGroup
              title="Sides & back grade"
              options={SIDES_GRADES}
              selected={cutDetails.sidesGrade}
              multi={false}
              onToggle={v => setSingle('sidesGrade', v)}
            />
            <ChipGroup
              title="Top length"
              options={TOP_LENGTHS}
              selected={cutDetails.topLength}
              multi={false}
              onToggle={v => setSingle('topLength', v)}
            />
          </>
        )}

        {/* BEARD tab */}
        {outerTab === 'beard' && (
          <>
            {beardStyles.length > 0 ? (
              <StyleImageGrid
                options={beardStyles}
                selected={cutDetails.beard}
                multi={false}
                onToggle={setBeard}
              />
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                No beard styles configured. Add some in <strong style={{ color: '#C8F135' }}>Settings → Cut Styles</strong>.
              </p>
            )}
          </>
        )}

        {/* NOTES tab */}
        {outerTab === 'notes' && (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={label}>SMS reminders</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not_asked', label: 'Not asked' },
                ].map(option => {
                  const active = smsOptIn === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSmsOptIn(option.value as SmsOptIn)}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: 8,
                        border: active ? '1px solid rgba(200,241,53,0.45)' : '1px solid rgba(255,255,255,0.1)',
                        background: active ? 'rgba(200,241,53,0.14)' : '#0A0A0A',
                        color: active ? '#C8F135' : 'rgba(255,255,255,0.7)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--font-barlow, sans-serif)',
                        cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={label}>Recommendation to client</label>
              <textarea
                rows={2}
                placeholder="e.g. Book in 4 weeks, try using clay on top…"
                value={recommendation}
                onChange={e => setRecommendation(e.target.value)}
                style={{
                  width: '100%', background: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
                  resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  fontFamily: 'var(--font-inter, sans-serif)',
                }}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={label}>Internal notes (barber only)</label>
              <textarea
                rows={3}
                placeholder="Anything else to remember about this cut…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  width: '100%', background: '#0A0A0A',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
                  resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  fontFamily: 'var(--font-inter, sans-serif)',
                }}
              />
            </div>
          </>
        )}
        {/* PHOTOS tab */}
        {outerTab === 'photos' && (
          visitId ? (
            <PhotoCapture
              visitId={visitId}
              shopName={shopName}
              onDone={() => setStep('feedback')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: 0 }}>
                Save cut details first, then add photos.
              </p>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="btn-lime"
                style={{ padding: '0.75rem 1.5rem', borderRadius: 4, fontSize: '0.875rem', border: 'none' }}
              >
                {saving ? 'Saving…' : 'Save details & go to photos'}
              </button>
            </div>
          )
        )}
      </div>

      {error && <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

      {outerTab !== 'photos' && (
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="btn-lime"
          style={{ padding: '0.875rem', borderRadius: 4, fontSize: '1rem', border: 'none', width: '100%' }}
        >
          {saving ? 'Saving…' : 'Save & add photos →'}
        </button>
      )}
    </div>
  );
}
