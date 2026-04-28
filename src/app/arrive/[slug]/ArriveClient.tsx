'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scissors, ChevronRight, Check, Loader2, Home } from 'lucide-react';

type Step = 'phone' | 'name' | 'welcome_back' | 'who' | 'style' | 'done';

interface ShopStyle {
  name: string;
  category: string;
}

interface FamilyMember {
  id: string;
  name: string;
}

interface Props {
  shopSlug: string;
  shopName: string;
  shopStyles: ShopStyle[];
}

const CATEGORY_ORDER = ['fade', 'taper', 'classic', 'natural', 'beard'];

function ordinal(n: number) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

export default function ArriveClient({ shopSlug, shopName, shopStyles }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ customerName: string | null; position: number; waitMinutes?: number; alreadyWaiting?: boolean; groupSize?: number } | null>(null);
  const [returningUser, setReturningUser] = useState<{ name: string; familyMembers: FamilyMember[] } | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]); // empty means "Me"

  // Styles sorted by category order
  const sortedStyles = [...shopStyles].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  function toggleStyle(name: string) {
    setSelectedStyles(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  }

  async function submitPhone() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug, phone, final: false }),
      });
      const data = await res.json();
      if (data.needsName) {
        setStep('name');
      } else if (data.customerName && data.alreadyWaiting) {
        setResult(data);
        setStep('done');
      } else if (data.proceedToStyle) {
        setReturningUser({ 
          name: data.customerName || 'Friend',
          familyMembers: data.familyMembers || []
        });
        if (data.familyMembers?.length > 0) {
          setSelectedMemberIds(['ME']); // Default to self
          setStep('who');
        } else {
          setStep('welcome_back');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function skipToStyle() {
    setStep('style');
  }

  function submitName() {
    setStep('style');
  }

  async function submitFinal() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug,
          phone,
          name: name || undefined,
          note: note || undefined,
          preferredStyle: selectedStyles.length > 0 ? JSON.stringify(selectedStyles) : undefined,
          familyMemberIds: selectedMemberIds,
          final: true,
        }),
      });
      const data = await res.json();
      if (data.customerName !== undefined) {
        setResult(data);
        setStep('done');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '1rem 1.125rem', color: 'white', fontSize: '1.1rem',
    fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
  };

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: 8, fontSize: '0.9rem', fontWeight: 800,
    textTransform: 'uppercase' as const, letterSpacing: '0.1em', cursor: 'pointer',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-barlow, sans-serif)',
    background: '#C8F135', color: '#0a0a0a',
    transition: 'opacity 0.15s',
  };

  return (
    <div style={{
      minHeight: '100svh', background: '#0a0a0a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      position: 'relative',
    }}>
      {/* Demo Home Navigation */}
      <Link 
        href="/"
        className="home-nav-link"
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-barlow, sans-serif)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 700,
          transition: 'all 0.2s ease',
          zIndex: 50,
        }}
      >
        <Home size={18} />
        <span>Home</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.25)',
            marginBottom: '1rem',
          }}>
            <Scissors size={22} color="#C8F135" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.75rem',
            textTransform: 'uppercase', color: 'white', letterSpacing: '0.02em', margin: 0,
          }}>
            {shopName}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.375rem', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {step === 'style' ? 'What are you after?' : 'Check in'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
          padding: '2rem',
        }}>

          {/* Step: phone */}
          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.625rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Your mobile number
                </label>
                <input
                  style={inputStyle}
                  type="tel"
                  inputMode="tel"
                  placeholder="07700 900 000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && phone.length >= 7 && submitPhone()}
                  autoFocus
                />
              </div>
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button
                style={{ ...btnStyle, opacity: phone.length < 7 || loading ? 0.5 : 1 }}
                disabled={phone.length < 7 || loading}
                onClick={submitPhone}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><ChevronRight size={16} /> Check in</>}
              </button>
            </div>
          )}

          {/* Step: welcome_back (returning customer) */}
          {step === 'welcome_back' && returningUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                Welcome back, <span className="text-[#C8F135]">{returningUser.name}</span>!
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>
                Good to see you again. Tap below to check in instantly, or tell us if you want something new today.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button style={btnStyle} onClick={submitFinal} disabled={loading}>
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={16} /> Quick Check-in</>}
                </button>
                <button 
                  style={{ ...btnStyle, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} 
                  onClick={skipToStyle}
                >
                  I want a new style
                </button>
              </div>
            </div>
          )}

          {/* Step: who (family selection) */}
          {step === 'who' && returningUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  Who&apos;s getting cut?
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', margin: '0.25rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Select everyone having a hair cut today.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Option for "Me" */}
                <button
                  onClick={() => {
                    if (selectedMemberIds.includes('ME')) {
                      setSelectedMemberIds(selectedMemberIds.filter(id => id !== 'ME'));
                    } else {
                      setSelectedMemberIds([...selectedMemberIds, 'ME']);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                    background: selectedMemberIds.includes('ME') ? 'rgba(200,241,53,0.1)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: selectedMemberIds.includes('ME') ? '#C8F135' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  <span style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                    {returningUser.name} (Me)
                  </span>
                  {selectedMemberIds.includes('ME') && <Check size={18} color="#C8F135" />}
                </button>

                {/* Options for Family Members */}
                {returningUser.familyMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      if (selectedMemberIds.includes(member.id)) {
                        setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                      } else {
                        setSelectedMemberIds([...selectedMemberIds, member.id]);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                      background: selectedMemberIds.includes(member.id) ? 'rgba(200,241,53,0.1)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer', transition: 'all 0.2s',
                      borderColor: selectedMemberIds.includes(member.id) ? '#C8F135' : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <span style={{ color: 'white', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                      {member.name}
                    </span>
                    {selectedMemberIds.includes(member.id) && <Check size={18} color="#C8F135" />}
                  </button>
                ))}
              </div>

              <button
                style={{ ...btnStyle, opacity: selectedMemberIds.length === 0 ? 0.5 : 1, marginTop: '0.5rem' }}
                disabled={selectedMemberIds.length === 0}
                onClick={() => setStep('welcome_back')}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step: name (new customer) */}
          {step === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  Welcome!
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', margin: '0.25rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  First time here? We just need your name to start.
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.625rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Your name
                </label>
                <input
                  style={{ ...inputStyle, fontFamily: 'var(--font-inter, sans-serif)' }}
                  type="text"
                  placeholder="First name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim().length >= 1 && submitName()}
                  autoFocus
                />
              </div>
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button
                style={{ ...btnStyle, opacity: name.trim().length < 1 ? 0.5 : 1 }}
                disabled={name.trim().length < 1}
                onClick={submitName}
              >
                <ChevronRight size={16} /> Next
              </button>
            </div>
          )}

          {/* Step: style picker */}
          {step === 'style' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {sortedStyles.length > 0 ? (
                <>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Take a seat & grab a drink.
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', margin: '0.25rem 0 0', lineHeight: 1.4, fontFamily: 'var(--font-inter, sans-serif)' }}>
                    While you wait, want to let us know what you&apos;re after today?
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                    {sortedStyles.map(style => {
                      const active = selectedStyles.includes(style.name);
                      return (
                        <button
                          key={style.name}
                          onClick={() => toggleStyle(style.name)}
                          style={{
                            padding: '0.625rem 1rem', borderRadius: 8, border: 'none',
                            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700,
                            fontFamily: 'var(--font-barlow, sans-serif)',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            transition: 'all 0.15s',
                            background: active ? '#C8F135' : 'rgba(255,255,255,0.07)',
                            color: active ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                            boxShadow: active ? '0 0 12px rgba(200,241,53,0.2)' : 'none',
                          }}
                        >
                          {style.name}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Anything specific today? <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional)</span>
                </p>
              )}

              {/* Optional note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Anything else? <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <textarea
                  style={{
                    ...inputStyle, fontFamily: 'var(--font-inter, sans-serif)', fontSize: '0.9rem',
                    resize: 'none', height: 72,
                  }}
                  placeholder="e.g. keep it longer on top, take a bit off the beard…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

              <button
                style={{ ...btnStyle, opacity: loading ? 0.5 : 1 }}
                disabled={loading}
                onClick={submitFinal}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={16} /> Check in</>}
              </button>

              <button
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem' }}
                onClick={submitFinal}
              >
                Skip
              </button>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && result && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(200,241,53,0.12)', border: '2px solid rgba(200,241,53,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(200,241,53,0.1)',
              }}>
                <Check size={28} color="#C8F135" />
              </div>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900, fontSize: '1.75rem',
                  textTransform: 'uppercase', color: 'white', margin: 0, lineHeight: 1.1
                }}>
                  {result.alreadyWaiting ? 'Still waiting?' : "You're all set."}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)', marginTop: '0.5rem' }}>
                  {result.customerName || 'Friend'}, {result.groupSize && result.groupSize > 1 ? `your group is` : `you are`}
                </p>
              </div>

              <div style={{
                background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.15)',
                borderRadius: 16, padding: '1.5rem', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#C8F135', fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow, sans-serif)', margin: 0, lineHeight: 1 }}>
                    {ordinal(result.position)}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-barlow, sans-serif)', marginTop: '0.4rem' }}>
                    In the queue
                  </p>
                </div>
                {result.waitMinutes !== undefined && (
                  <>
                    <div style={{ width: 1, height: 48, background: 'rgba(200,241,53,0.15)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#C8F135', fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow, sans-serif)', margin: 0, lineHeight: 1 }}>
                        {result.waitMinutes === 0 ? "Now" : `~${result.waitMinutes}`}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-barlow, sans-serif)', marginTop: '0.4rem' }}>
                        {result.waitMinutes === 0 ? "You're up next" : 'Min wait'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-5 w-full text-left">
                <p className="text-white font-barlow font-black text-sm uppercase tracking-tight mb-2">Next steps:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-xs text-white/50 font-inter">
                    <div className="w-4 h-4 rounded-full bg-[#C8F135] text-[#0A0A0A] flex-shrink-0 flex items-center justify-center font-bold text-[10px]">1</div>
                    <span>Grab a complimentary drink from the bar.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-white/50 font-inter">
                    <div className="w-4 h-4 rounded-full bg-[#C8F135] text-[#0A0A0A] flex-shrink-0 flex items-center justify-center font-bold text-[10px]">2</div>
                    <span>Take a seat — we&apos;ll call you when it&apos;s time.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-white/50 font-inter">
                    <div className="w-4 h-4 rounded-full bg-[#C8F135] text-[#0A0A0A] flex-shrink-0 flex items-center justify-center font-bold text-[10px]">3</div>
                    <span className="text-[#C8F135]/80 font-bold">Browse hair ideas & trend reports while you wait.</span>
                  </li>
                </ul>
              </div>

              <button 
                style={{ ...btnStyle, background: 'white', color: '#0A0A0A' }}
                onClick={() => window.open(`/trends?shop=${shopSlug}`, '_blank')}
              >
                Browse Hair Ideas
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Powered by <Link href="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>YourBarber</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus { border-color: rgba(200,241,53,0.4) !important; }
        .home-nav-link:hover { color: #C8F135 !important; transform: translateX(2px); }
      `}</style>
    </div>
  );
}
