'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, ChevronRight, Home, Loader2, Scissors } from 'lucide-react';

type Step = 'queue_info' | 'name' | 'barber_choice' | 'queue_confirm' | 'phone' | 'who' | 'service' | 'notify_standby' | 'done';

interface ShopService {
  id: string;
  name: string;
  price: string | null;
  duration: number | null;
}

interface ShopBarber {
  id: string;
  name: string;
}

interface FamilyMember {
  id: string;
  name: string;
}

interface StyleOption {
  id: string;
  name: string;
}

interface Props {
  shopSlug: string;
  shopName: string;
  services: ShopService[];
  /** Cut Styles shown as quick-pick chips when the shop has no bookable Services configured. */
  styleOptions?: StyleOption[];
  barbers: ShopBarber[];
  initialWaitingCount: number;
  initialWaitMinutes: number;
  isDemoShop?: boolean;
  demoWalkIn?: boolean;
  /** Set when the client scanned a specific barber's own shareable QR/link (e.g. "See Jamie") — pre-selects that barber and skips the barber_choice step. */
  presetBarberId?: string | null;
}

function ordinal(n: number) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function saveArrivalStatus(
  shopSlug: string,
  status: { position: number; waitMinutes?: number; customerName: string | null; groupSize?: number }
) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`yourbarber-arrival-${shopSlug}`, JSON.stringify({
    ...status,
    savedAt: Date.now(),
  }));
}

const MAX_SERVICES_SHOWN = 5;

export default function ArriveClient({
  shopSlug, shopName, services, styleOptions = [], barbers,
  initialWaitingCount, initialWaitMinutes,
  isDemoShop = false, demoWalkIn = false,
  presetBarberId = null,
}: Props) {
  const [step, setStep] = useState<Step>('queue_info');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [preferredBarberId, setPreferredBarberId] = useState<string>(presetBarberId || 'any');
  const presetBarberName = presetBarberId ? barbers.find((b) => b.id === presetBarberId)?.name : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    customerName: string | null;
    position: number;
    waitMinutes?: number;
    alreadyWaiting?: boolean;
    groupSize?: number;
    holdPlace?: boolean;
  } | null>(null);
  const [holdingPlace, setHoldingPlace] = useState(false);
  const [holdRequested, setHoldRequested] = useState(false);
  const [leftQueue, setLeftQueue] = useState(false);
  const [leavingQueue, setLeavingQueue] = useState(false);
  const [walletPlatform, setWalletPlatform] = useState<'ios' | 'android' | 'other' | null>(null);
  const [googleWalletLoading, setGoogleWalletLoading] = useState(false);
  const [googleWalletDone, setGoogleWalletDone] = useState(false);
  const [returningUser, setReturningUser] = useState<{ name: string; familyMembers: FamilyMember[] } | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const waitingCount = initialWaitingCount;
  const waitMinutes = initialWaitMinutes;

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setWalletPlatform('ios');
    else if (/Android/.test(ua)) setWalletPlatform('android');
    else setWalletPlatform('other');
  }, []);

  // Poll live position on done screen — the real "you're nearly up" alert is
  // the Wallet pass push (server-side, via notifyCustomer whenever the queue
  // moves), not a browser notification; this just keeps the on-screen number
  // fresh for anyone who left the tab open.
  useEffect(() => {
    if (step !== 'done' || !result || phone.length < 7) return;
    const refreshStatus = async () => {
      try {
        const res = await fetch('/api/arrive/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopSlug, phone }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.active) return;
        setResult(prev => prev ? {
          ...prev,
          customerName: data.customerName ?? prev.customerName,
          position: data.position,
          waitMinutes: data.waitMinutes,
          holdPlace: data.holdPlace,
        } : prev);
      } catch { /* ignore */ }
    };
    const id = window.setInterval(refreshStatus, 10_000);
    refreshStatus();
    return () => window.clearInterval(id);
  }, [phone, result, shopSlug, step]);

  async function addToGoogleWallet() {
    if (googleWalletLoading || googleWalletDone) return;
    setGoogleWalletLoading(true);
    try {
      const res = await fetch('/api/wallet/client/google');
      if (!res.ok) throw new Error('failed');
      const { saveUrl } = await res.json();
      window.open(saveUrl, '_blank', 'noopener');
      setGoogleWalletDone(true);
    } catch {
      // silently fail — user can retry
    } finally {
      setGoogleWalletLoading(false);
    }
  }

  async function leaveQueue() {
    if (leavingQueue || !phone) return;
    setLeavingQueue(true);
    try {
      await fetch('/api/arrive/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug, phone }),
      });
      setLeftQueue(true);
    } catch { /* ignore */ } finally {
      setLeavingQueue(false);
    }
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
        // New customer — name already captured, go to service
        setStep('service');
      } else if (data.customerName && data.alreadyWaiting) {
        saveArrivalStatus(shopSlug, data);
        setResult(data);
        setStep('done');
      } else if (data.proceedToStyle) {
        setReturningUser({
          name: data.customerName || name || 'Friend',
          familyMembers: data.familyMembers || [],
        });
        if (data.familyMembers?.length > 0) {
          setSelectedMemberIds(['ME']);
          setStep('who');
        } else {
          setStep('service');
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

  async function submitFinal() {
    setError('');
    setLoading(true);
    const selectedService = services.find(s => s.id === selectedServiceId);
    const selectedStyleNames = styleOptions.filter(s => selectedStyleIds.includes(s.id)).map(s => s.name);
    const preferredBarber = barbers.find(b => b.id === preferredBarberId);
    const noteParts: string[] = [];
    if (preferredBarber) noteParts.push(`See: ${preferredBarber.name}`);
    if (selectedService) noteParts.push(selectedService.name);
    if (selectedStyleNames.length > 0) noteParts.push(selectedStyleNames.join(', '));
    if (note.trim()) noteParts.push(note.trim());
    const noteText = noteParts.join(' · ') || undefined;
    try {
      const res = await fetch('/api/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug,
          phone,
          name: name || undefined,
          demoName: demoWalkIn ? 'Test Barber' : undefined,
          note: noteText,
          preferredStyle: selectedService?.name || selectedStyleNames.join(', ') || undefined,
          familyMemberIds: selectedMemberIds,
          final: true,
        }),
      });
      const data = await res.json();
      if (data.customerName !== undefined) {
        saveArrivalStatus(shopSlug, data);
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

  async function requestHoldPlace() {
    if (!result || holdRequested) return;
    setHoldingPlace(true);
    setError('');
    try {
      const res = await fetch('/api/arrive/hold-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopSlug, phone }),
      });
      if (!res.ok) {
        setError('Could not hold your place. Please ask the barber.');
        return;
      }
      const updated = { ...result, holdPlace: true };
      saveArrivalStatus(shopSlug, updated);
      setResult(updated);
      setHoldRequested(true);
    } catch {
      setError('Connection error. Please ask the barber.');
    } finally {
      setHoldingPlace(false);
    }
  }

  const preferredBarberName = barbers.find(b => b.id === preferredBarberId)?.name;
  const visibleServices = services.slice(0, MAX_SERVICES_SHOWN);
  const hiddenServiceCount = Math.max(0, services.length - MAX_SERVICES_SHOWN);

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '1rem 1.125rem', color: 'white', fontSize: '1.1rem',
    fontFamily: 'var(--font-inter, sans-serif)', outline: 'none', boxSizing: 'border-box',
  };

  const btnLime: React.CSSProperties = {
    width: '100%', padding: '1rem', borderRadius: 8, fontSize: '0.9rem', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-barlow, sans-serif)',
    background: '#C8F135', color: '#0a0a0a',
    transition: 'opacity 0.15s',
  };

  const btnGhost: React.CSSProperties = {
    ...btnLime,
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const cardBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.875rem 1rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
    border: `1px solid ${active ? '#C8F135' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(200,241,53,0.08)' : 'rgba(255,255,255,0.03)',
    transition: 'all 0.15s',
  });

  const stepLabel = (s: Step) => {
    const map: Partial<Record<Step, string>> = {
      queue_info: 'Live queue',
      name: 'Check in',
      barber_choice: 'Your preference',
      queue_confirm: 'Queue update',
      phone: 'Check in',
      who: 'Who\'s getting cut?',
      service: 'What are you after?',
      notify_standby: 'Queue watch',
      done: 'You\'re on the list',
    };
    return map[s] ?? 'Check in';
  };

  return (
    <div style={{
      minHeight: '100svh', background: '#0a0a0a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      position: 'relative',
    }}>
      <Link
        href="/"
        className="home-nav-link"
        style={{
          position: 'absolute', top: '2rem', left: '2rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          textDecoration: 'none', color: 'rgba(255,255,255,0.2)',
          fontSize: '0.75rem', fontFamily: 'var(--font-barlow, sans-serif)',
          textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700,
          transition: 'all 0.2s ease', zIndex: 50,
        }}
      >
        <Home size={18} />
        <span>Home</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
          <p style={{
            color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: '0.375rem',
            fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {stepLabel(step)}
          </p>
          {isDemoShop && (
            <div style={{
              display: 'inline-block', marginTop: '0.5rem',
              background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)',
              borderRadius: 100, padding: '0.2rem 0.75rem',
              color: 'rgba(200,241,53,0.6)', fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              fontFamily: 'var(--font-barlow, sans-serif)',
            }}>
              Demo shop
            </div>
          )}
          {presetBarberName && (
            <div style={{
              display: 'inline-block', marginTop: '0.5rem',
              background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)',
              borderRadius: 100, padding: '0.2rem 0.75rem',
              color: '#C8F135', fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              fontFamily: 'var(--font-barlow, sans-serif)',
            }}>
              You&apos;ll be seeing {presetBarberName}
            </div>
          )}
        </div>

        {/* Card */}
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
          padding: '2rem',
        }}>

          {/* ── Step: queue_info ── */}
          {step === 'queue_info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.15)',
                  borderRadius: 100, padding: '0.4rem 1rem', marginBottom: '1.25rem',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C8F135', animation: 'pulse 2s infinite' }} />
                  <span style={{ color: '#C8F135', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                    Live Queue
                  </span>
                </div>

                {waitingCount === 0 ? (
                  <div>
                    <p style={{ color: '#C8F135', fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-barlow, sans-serif)', margin: 0, lineHeight: 1 }}>
                      No wait
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginTop: '0.625rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                      Walk straight in right now.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                    <div>
                      <p style={{ color: 'white', fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow, sans-serif)', margin: 0, lineHeight: 1 }}>
                        {waitingCount}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-barlow, sans-serif)', marginTop: '0.4rem' }}>
                        {waitingCount === 1 ? 'Person' : 'People'} waiting
                      </p>
                    </div>
                    <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                      <p style={{ color: 'white', fontSize: '3.5rem', fontWeight: 900, fontFamily: 'var(--font-barlow, sans-serif)', margin: 0, lineHeight: 1 }}>
                        ~{waitMinutes}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-barlow, sans-serif)', marginTop: '0.4rem' }}>
                        Min wait
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button style={btnLime} onClick={() => setStep('name')}>
                  <ChevronRight size={16} /> {waitingCount === 0 ? "I'm here — check me in" : 'Join the queue'}
                </button>
                {waitingCount > 0 && (
                  <button style={btnGhost} onClick={() => setStep('notify_standby')}>
                    Notify me instead of waiting here
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step: name ── */}
          {step === 'name' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  What&apos;s your name?
                </p>
              </div>
              <input
                style={{ ...inputStyle, fontSize: '1.1rem' }}
                type="text"
                placeholder="First name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && name.trim().length >= 1) {
                    setStep(presetBarberId ? 'queue_confirm' : (barbers.length > 0 ? 'barber_choice' : 'queue_confirm'));
                  }
                }}
                autoFocus
              />
              <button
                style={{ ...btnLime, opacity: name.trim().length < 1 ? 0.5 : 1 }}
                disabled={name.trim().length < 1}
                onClick={() => setStep(presetBarberId ? 'queue_confirm' : (barbers.length > 0 ? 'barber_choice' : 'queue_confirm'))}
              >
                <ChevronRight size={16} /> Next
              </button>
            </div>
          )}

          {/* ── Step: barber_choice ── */}
          {step === 'barber_choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  Who would you like?
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.375rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Choose a preference or go with whoever is free first.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {/* Next available — always first */}
                <button
                  onClick={() => setPreferredBarberId('any')}
                  style={cardBtn(preferredBarberId === 'any')}
                >
                  <div>
                    <p style={{ color: preferredBarberId === 'any' ? '#C8F135' : 'white', fontSize: '0.9rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                      Next available
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', margin: '0.2rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
                      Shortest wait
                    </p>
                  </div>
                  {preferredBarberId === 'any' && <Check size={16} color="#C8F135" />}
                </button>

                {barbers.map(barber => (
                  <button
                    key={barber.id}
                    onClick={() => setPreferredBarberId(barber.id)}
                    style={cardBtn(preferredBarberId === barber.id)}
                  >
                    <p style={{ color: preferredBarberId === barber.id ? '#C8F135' : 'white', fontSize: '0.9rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                      {barber.name}
                    </p>
                    {preferredBarberId === barber.id && <Check size={16} color="#C8F135" />}
                  </button>
                ))}
              </div>

              <button style={btnLime} onClick={() => setStep('queue_confirm')}>
                <ChevronRight size={16} /> Next
              </button>
            </div>
          )}

          {/* ── Step: queue_confirm ── */}
          {step === 'queue_confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  Hey, {name || 'there'}!
                </p>

                {waitingCount === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginTop: '0.625rem', lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>
                    No one ahead of you — you can walk straight in.
                  </p>
                ) : preferredBarberId !== 'any' ? (
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginTop: '0.625rem', lineHeight: 1.6, fontFamily: 'var(--font-inter, sans-serif)' }}>
                    You&apos;d like to see <strong style={{ color: 'white' }}>{preferredBarberName}</strong>. There{' '}
                    {waitingCount === 1 ? 'is' : 'are'}{' '}
                    <strong style={{ color: 'white' }}>{waitingCount} {waitingCount === 1 ? 'person' : 'people'}</strong>{' '}
                    in the queue — about <strong style={{ color: 'white' }}>{waitMinutes} minutes</strong>.
                  </p>
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginTop: '0.625rem', lineHeight: 1.6, fontFamily: 'var(--font-inter, sans-serif)' }}>
                    There {waitingCount === 1 ? 'is' : 'are'}{' '}
                    <strong style={{ color: 'white' }}>{waitingCount} {waitingCount === 1 ? 'person' : 'people'}</strong>{' '}
                    ahead of you — about <strong style={{ color: 'white' }}>{waitMinutes} minutes</strong>.
                  </p>
                )}

                {preferredBarberId !== 'any' && waitingCount > 0 && (
                  <button
                    onClick={() => setPreferredBarberId('any')}
                    style={{
                      marginTop: '0.75rem', background: 'none', border: 'none',
                      color: '#C8F135', fontSize: '0.8rem', cursor: 'pointer',
                      fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase',
                      letterSpacing: '0.08em', textDecoration: 'underline', padding: 0,
                    }}
                  >
                    See next available instead
                  </button>
                )}
              </div>

              {waitingCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '1rem', borderRadius: 12,
                  border: '1px solid rgba(200,241,53,0.2)',
                  background: 'rgba(200,241,53,0.06)',
                }}>
                  <Bell size={20} color="#C8F135" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                      We&apos;ll tell you when it&apos;s your turn
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: '0.25rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
                      Add your Wallet card at the end — no app, no tab to keep open.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button style={btnLime} onClick={() => setStep('phone')}>
                  <Check size={16} /> {waitingCount === 0 ? "Let's go" : "Sounds good, I'll wait"}
                </button>
                <button style={btnGhost} onClick={() => setStep('notify_standby')}>
                  Not for me
                </button>
              </div>
            </div>
          )}

          {/* ── Step: phone ── */}
          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  What&apos;s your number?
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.375rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  So we can find your details next time — your grade, taper, and photos. We don&apos;t text or call you.
                </p>
              </div>
              <input
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '1.1rem' }}
                type="tel"
                inputMode="tel"
                placeholder="07700 900 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && phone.length >= 7 && submitPhone()}
                autoFocus
              />
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button
                style={{ ...btnLime, opacity: phone.length < 7 || loading ? 0.5 : 1 }}
                disabled={phone.length < 7 || loading}
                onClick={submitPhone}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><ChevronRight size={16} /> Continue</>}
              </button>
            </div>
          )}

          {/* ── Step: who (family selection) ── */}
          {step === 'who' && returningUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  Who&apos;s getting cut?
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', margin: '0.25rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Select everyone having a cut today.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setSelectedMemberIds(prev =>
                      prev.includes('ME') ? prev.filter(id => id !== 'ME') : [...prev, 'ME']
                    );
                  }}
                  style={cardBtn(selectedMemberIds.includes('ME'))}
                >
                  <span style={{ color: selectedMemberIds.includes('ME') ? '#C8F135' : 'white', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                    {returningUser.name} (Me)
                  </span>
                  {selectedMemberIds.includes('ME') && <Check size={18} color="#C8F135" />}
                </button>
                {returningUser.familyMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedMemberIds(prev =>
                        prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]
                      );
                    }}
                    style={cardBtn(selectedMemberIds.includes(member.id))}
                  >
                    <span style={{ color: selectedMemberIds.includes(member.id) ? '#C8F135' : 'white', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                      {member.name}
                    </span>
                    {selectedMemberIds.includes(member.id) && <Check size={18} color="#C8F135" />}
                  </button>
                ))}
              </div>
              <button
                style={{ ...btnLime, opacity: selectedMemberIds.length === 0 ? 0.5 : 1, marginTop: '0.5rem' }}
                disabled={selectedMemberIds.length === 0}
                onClick={() => setStep('service')}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step: service ── */}
          {step === 'service' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  What are you after?
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.375rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Optional — helps the barber prepare.
                </p>
              </div>

              {visibleServices.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {visibleServices.map(service => {
                    const active = selectedServiceId === service.id;
                    return (
                      <button
                        key={service.id}
                        onClick={() => setSelectedServiceId(active ? null : service.id)}
                        style={cardBtn(active)}
                      >
                        <div>
                          <p style={{ color: active ? '#C8F135' : 'white', fontSize: '0.9rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                            {service.name}
                          </p>
                          {service.duration && (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', margin: '0.2rem 0 0', fontFamily: 'var(--font-inter, sans-serif)' }}>
                              {service.duration} min
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {service.price && (
                            <span style={{ color: active ? '#C8F135' : 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)' }}>
                              £{parseFloat(service.price).toFixed(0)}
                            </span>
                          )}
                          {active && <Check size={16} color="#C8F135" />}
                        </div>
                      </button>
                    );
                  })}

                  {hiddenServiceCount > 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textAlign: 'center', margin: '0.25rem 0 0', fontFamily: 'var(--font-inter, sans-serif)', fontStyle: 'italic' }}>
                      +{hiddenServiceCount} more service{hiddenServiceCount > 1 ? 's' : ''} available — just ask at the chair
                    </p>
                  )}
                </div>
              )}

              {visibleServices.length === 0 && styleOptions.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                    What are you after? <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional, pick any)</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {styleOptions.map(style => {
                      const active = selectedStyleIds.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyleIds(ids => active ? ids.filter(id => id !== style.id) : [...ids, style.id])}
                          style={{
                            padding: '0.5rem 0.875rem', borderRadius: 100, cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-barlow, sans-serif)',
                            border: active ? '1px solid #C8F135' : '1px solid rgba(255,255,255,0.15)',
                            background: active ? 'rgba(200,241,53,0.1)' : 'transparent',
                            color: active ? '#C8F135' : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {style.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  Anything else? <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <textarea
                  style={{
                    ...inputStyle, resize: 'none', height: 72,
                    fontFamily: 'var(--font-inter, sans-serif)', fontSize: '0.9rem',
                  }}
                  placeholder="e.g. keep it longer on top, take a bit off the beard…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

              <button
                style={{ ...btnLime, opacity: loading ? 0.5 : 1 }}
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

          {/* ── Step: notify_standby ── */}
          {step === 'notify_standby' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
              <button
                onClick={() => setStep('queue_info')}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← Back
              </button>
              <div>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase' }}>
                  No worries.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5, fontFamily: 'var(--font-inter, sans-serif)' }}>
                  Join the queue now and step away — your spot is held. Add your Wallet card at the end and
                  we&apos;ll push an update to your phone when you&apos;re nearly up, no need to keep this open.
                </p>
              </div>

              <button style={btnLime} onClick={() => setStep('name')}>
                <ChevronRight size={16} /> Join the queue
              </button>
            </div>
          )}

          {/* ── Step: done ── */}
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
                  textTransform: 'uppercase', color: 'white', margin: 0, lineHeight: 1.1,
                }}>
                  {result.alreadyWaiting ? "Already on the list" : "You're all set."}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.85rem', fontFamily: 'var(--font-inter, sans-serif)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  {result.customerName || name || 'Friend'},{' '}
                  {result.groupSize && result.groupSize > 1 ? 'your group is' : 'you are'} in the queue.
                  {preferredBarberName && ` Preference for ${preferredBarberName} noted.`}
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

              {/* ── Wallet download ── */}
              {walletPlatform && (
                <div style={{
                  width: '100%', borderRadius: 14,
                  border: '1px solid rgba(200,241,53,0.18)',
                  background: 'rgba(200,241,53,0.04)',
                  padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.875rem',
                }}>
                  <div>
                    <p style={{
                      color: 'white', fontSize: '0.8rem', fontWeight: 800, margin: 0,
                      fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      Save your loyalty card
                    </p>
                    <p style={{
                      color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: '0.3rem 0 0',
                      fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.5,
                    }}>
                      Get a push to your lock screen when you&apos;re nearly up — no app, no tab to keep open. Also
                      skips the phone number next time.
                    </p>
                  </div>

                  {(walletPlatform === 'ios' || walletPlatform === 'other') && (
                    <a
                      href="/api/wallet/client/apple"
                      style={{ display: 'block', lineHeight: 0 }}
                      aria-label="Add to Apple Wallet"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/apple-wallet-badge.svg"
                        alt="Add to Apple Wallet"
                        style={{ height: 44, width: 'auto' }}
                      />
                    </a>
                  )}

                  {(walletPlatform === 'android' || walletPlatform === 'other') && (
                    <button
                      onClick={addToGoogleWallet}
                      disabled={googleWalletLoading || googleWalletDone}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        padding: '0.75rem 1.25rem', borderRadius: 8, cursor: googleWalletDone ? 'default' : 'pointer',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: googleWalletDone ? 'rgba(200,241,53,0.08)' : 'rgba(255,255,255,0.06)',
                        color: googleWalletDone ? '#C8F135' : 'white',
                        fontSize: '0.8rem', fontWeight: 700,
                        fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.06em',
                        opacity: googleWalletLoading ? 0.6 : 1, transition: 'all 0.2s',
                      }}
                    >
                      {googleWalletDone ? (
                        <><Check size={15} color="#C8F135" /> Saved to Google Wallet</>
                      ) : googleWalletLoading ? (
                        <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Opening…</>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4"/>
                            <path d="M12 6.5c1.47 0 2.79.55 3.79 1.44l2.83-2.83C16.9 3.4 14.6 2.5 12 2.5 8.24 2.5 4.96 4.64 3.27 7.77l3.3 2.56C7.35 8.2 9.5 6.5 12 6.5z" fill="#EA4335"/>
                            <path d="M5.64 14.09A6.5 6.5 0 0 1 5.5 12c0-.71.12-1.4.33-2.05L2.53 7.39A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l2.57-2.4z" fill="#FBBC05"/>
                            <path d="M12 17.5c-2.5 0-4.65-1.5-5.64-3.67l-3.3 2.56C4.96 19.36 8.24 21.5 12 21.5c2.5 0 4.76-.94 6.48-2.48l-3.07-2.38A5.96 5.96 0 0 1 12 17.5z" fill="#34A853"/>
                            <path d="M21.5 12c0-.69-.07-1.35-.19-2H12v3.77h5.35a4.56 4.56 0 0 1-1.97 2.97l3.07 2.38C20.7 17.18 21.5 14.74 21.5 12z" fill="#4285F4"/>
                          </svg>
                          Add to Google Wallet
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {!walletPlatform && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 1rem', borderRadius: 12, width: '100%',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)', textAlign: 'left',
                }}>
                  <Bell size={18} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: 0, fontFamily: 'var(--font-inter, sans-serif)' }}>
                    Keep an eye on your position above — refresh any time.
                  </p>
                </div>
              )}

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

              {result.waitMinutes !== undefined && result.waitMinutes > 30 && !result.holdPlace && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 w-full text-left">
                  <p className="text-white font-barlow font-black text-sm uppercase tracking-tight mb-2">Need to step out?</p>
                  <p className="text-white/45 text-xs font-inter leading-relaxed mb-4">
                    Your wait is over 30 minutes. We can hold your place if you&apos;re back around 20 minutes before your turn.
                  </p>
                  <button
                    type="button"
                    onClick={requestHoldPlace}
                    disabled={holdingPlace}
                    className="w-full bg-[#C8F135] text-[#0A0A0A] rounded-lg py-3 font-barlow font-black uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                    {holdingPlace ? 'Holding...' : 'Hold my place'}
                  </button>
                </div>
              )}

              {result.holdPlace && (
                <div className="bg-[#C8F135]/8 border border-[#C8F135]/20 rounded-xl p-5 w-full text-left">
                  <p className="text-[#C8F135] font-barlow font-black text-sm uppercase tracking-tight mb-2">Place held</p>
                  <p className="text-white/50 text-xs font-inter leading-relaxed">
                    You can leave the shop for now. The barber can see you&apos;re away and can text you when you&apos;re close to the chair.
                  </p>
                </div>
              )}

              <button 
                style={{ ...btnLime, background: 'white', color: '#0A0A0A' }}
                onClick={() => {
                  const params = new URLSearchParams({
                    shop: shopSlug,
                    checkedIn: '1',
                    position: String(result.position),
                  });
                  if (result.waitMinutes !== undefined) params.set('wait', String(result.waitMinutes));
                  window.location.href = `/trends?${params.toString()}`;
                }}
              >
                Browse Hair Ideas
              </button>

              {leftQueue ? (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontFamily: 'var(--font-inter, sans-serif)' }}>
                  You&apos;ve left the queue. See you next time.
                </p>
              ) : (
                <button
                  onClick={leaveQueue}
                  disabled={leavingQueue}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem', opacity: leavingQueue ? 0.5 : 1 }}
                >
                  Leave the queue
                </button>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', fontFamily: 'var(--font-barlow, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Powered by{' '}
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
            YourBarber
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, textarea:focus { border-color: rgba(200,241,53,0.4) !important; }
        .home-nav-link:hover { color: #C8F135 !important; transform: translateX(2px); }
      `}</style>
    </div>
  );
}
