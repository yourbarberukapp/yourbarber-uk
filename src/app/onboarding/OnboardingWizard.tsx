'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowRight, ArrowLeft, Loader2, Upload, Check, Link as LinkIcon, Pipette } from 'lucide-react';
import { OnboardingLayout, inputStyle, cardStyle, type WizardState } from './OnboardingLayout';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((m) => m.QRCodeSVG), { ssr: false });

const PRESET_COLORS = ['#111111', '#1A1D20', '#1C2541', '#2B1B17', '#1E3A2B', '#3A1E2B'];

function computeLabelColour(hex: string): string {
  const safe = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '111111';
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r + (255 - r) * 0.65)}${toHex(g + (255 - g) * 0.65)}${toHex(b + (255 - b) * 0.65)}`;
}

interface Props {
  shopName: string;
  shopSlug: string;
  initialAccentColor: string;
  initialLabelColor: string;
  initialLoyaltyTarget: number;
  initialLoyaltyReward: string;
  initialLogoUrl: string;
  initialStripUrl: string;
}

export default function OnboardingWizard({
  shopName,
  shopSlug,
  initialAccentColor,
  initialLabelColor,
  initialLoyaltyTarget,
  initialLoyaltyReward,
  initialLogoUrl,
  initialStripUrl,
}: Props) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(initialLogoUrl ? 1 : 0);
  const [state, setState] = useState<WizardState>({
    shopName,
    logoUrl: initialLogoUrl,
    accentColor: initialAccentColor,
    labelColor: initialLabelColor,
    stripUrl: initialStripUrl,
    loyaltyTarget: initialLoyaltyTarget,
    loyaltyReward: initialLoyaltyReward,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [scrapedImages, setScrapedImages] = useState<string[] | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imageRef = useRef<HTMLImageElement>(null);

  const steps = ['logo', 'colour', 'banner', 'loyalty', 'review'] as const;
  const step = steps[stepIndex];

  function initCrop(file: File | Blob | string) {
    if (typeof file === 'string') {
      setCropSrc(file);
    } else {
      setCropSrc(URL.createObjectURL(file));
    }
  }

  useEffect(() => {
    if (step !== 'logo') return;
    function handlePaste(e: ClipboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) initCrop(file);
    }
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [step]);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function persist(patch: Record<string, unknown>) {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }

  async function handleScrapeUrl(url: string) {
    if (!url) return;
    setUploadingLogo(true);
    try {
      // First try website scraper
      const res = await fetch(`/api/settings/scrape-website?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const { images } = await res.json();
        if (images && images.length > 0) {
          setScrapedImages(images);
          setUploadingLogo(false);
          return;
        }
      }
      
      // Fallback: direct image scraper
      const imgRes = await fetch(`/api/settings/scrape-image?url=${encodeURIComponent(url)}`);
      if (!imgRes.ok) throw new Error('Could not fetch image from URL');
      const blob = await imgRes.blob();
      initCrop(blob);
    } catch (err: any) {
      alert(err.message || 'Failed to grab images from URL.');
    } finally {
      setUploadingLogo(false);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, naturalWidth, naturalHeight),
      naturalWidth,
      naturalHeight
    );
    setCrop(initialCrop);
  }

  async function applyCrop() {
    if (!completedCrop || !imageRef.current) return;
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setCropSrc(null);
      const file = new File([blob], 'logo-cropped.jpg', { type: 'image/jpeg' });
      await uploadLogoFile(file);
    }, 'image/jpeg', 0.95);
  }

  async function uploadLogoFile(file: File) {
    setUploadingLogo(true);
    try {
      const presign = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!presign.ok) throw new Error('presign failed');
      const { uploadUrl, publicUrl } = await presign.json();
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      update('logoUrl', publicUrl);
      await persist({ logoUrl: publicUrl });

      const extract = await fetch('/api/onboarding/extract-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });
      if (extract.ok) {
        const { accentColour } = await extract.json();
        if (accentColour) {
          update('accentColor', accentColour);
          update('labelColor', computeLabelColour(accentColour));
        }
      }
    } catch {
      alert('Failed to upload logo - you can try again or skip this step.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true);
    try {
      const presign = await fetch('/api/settings/strip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!presign.ok) throw new Error('presign failed');
      const { uploadUrl, publicUrl } = await presign.json();
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      update('stripUrl', publicUrl);
      await persist({ passStripUrl: publicUrl });
    } catch {
      alert('Failed to upload banner - you can try again or skip this step.');
    } finally {
      setUploadingBanner(false);
    }
  }

  async function goNext() {
    if (step === 'colour') {
      await persist({ passAccentColor: state.accentColor, passLabelColor: state.labelColor });
    }
    if (step === 'loyalty') {
      await fetch('/api/settings/pass-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passAccentColor: state.accentColor,
          passLabelColor: state.labelColor,
          loyaltyTarget: state.loyaltyTarget,
          loyaltyReward: state.loyaltyReward,
        }),
      }).catch(() => {});
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function finish() {
    setSaving(true);
    router.push('/dashboard');
  }

  async function openEyedropper() {
    // @ts-expect-error EyeDropper is a non-standard API
    if (!window.EyeDropper) {
      alert('Your browser does not support the EyeDropper API.');
      return;
    }
    try {
      // @ts-expect-error EyeDropper is a non-standard API
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      update('accentColor', result.sRGBHex);
      update('labelColor', computeLabelColour(result.sRGBHex));
    } catch (e) {
      // user canceled
    }
  }

  return (
    <OnboardingLayout step={step} state={state}>
      {cropSrc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: 12, maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Crop Logo</h3>
            <div style={{ overflow: 'auto', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img ref={imageRef} src={cropSrc} alt="Crop" style={{ maxHeight: '60vh', objectFit: 'contain' }} onLoad={onImageLoad} />
              </ReactCrop>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setCropSrc(null)} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              <button onClick={applyCrop} className="btn-lime" style={{ padding: '0.5rem 1.5rem', borderRadius: 4, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Apply & Upload</button>
            </div>
          </div>
        </div>
      )}

      {scrapedImages && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: 12, maxWidth: 600, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Found Images</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Select an image below to use as your logo.</p>
            <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1rem', paddingRight: '0.5rem' }}>
              {scrapedImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setScrapedImages(null);
                    initCrop(src);
                  }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}
                >
                  <img src={src} alt="Scraped" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setScrapedImages(null)} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {step === 'logo' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Add your logo</h2>
          <p style={subStyle}>
            This appears on your Wallet pass and shop page. You can skip this and add it later in Settings.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            {state.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.logoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)' }} />
            )}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="btn-lime"
              style={{ padding: '0.75rem 1.25rem', borderRadius: 4, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}
            >
              {uploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingLogo ? 'Uploading...' : state.logoUrl ? 'Change logo' : 'Upload logo'}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) initCrop(file);
                e.target.value = '';
              }}
            />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="url"
              placeholder="Or paste an image URL or website..."
              value={logoUrlInput}
              onChange={(e) => setLogoUrlInput(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleScrapeUrl(logoUrlInput)}
            />
            <button
              type="button"
              onClick={() => handleScrapeUrl(logoUrlInput)}
              disabled={!logoUrlInput || uploadingLogo}
              style={{ padding: '0.75rem 1rem', borderRadius: 4, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}
            >
              <LinkIcon size={16} /> Grab
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            Tip: You can also press <strong>Ctrl+V</strong> to paste a logo directly from your clipboard.
          </p>
          <StepNav onNext={goNext} nextLabel={state.logoUrl ? 'Next' : 'Skip for now'} showBack={false} />
        </div>
      )}

      {step === 'colour' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Pick your colour</h2>
          <p style={subStyle}>
            {state.logoUrl ? "We've suggested a colour from your logo - tweak it if you like." : 'This is the background colour of your Wallet pass.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
            <input
              type="color"
              value={state.accentColor}
              onChange={(e) => {
                update('accentColor', e.target.value);
                update('labelColor', computeLabelColour(e.target.value));
              }}
              style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer', padding: 0 }}
            />
            <button
              type="button"
              title="Pick color from screen"
              onClick={openEyedropper}
              style={{ padding: '0.5rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, width: 44 }}
            >
              <Pipette size={18} />
            </button>
            <input
              type="text"
              value={state.accentColor}
              onChange={(e) => update('accentColor', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase', width: 110 }}
            />
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    update('accentColor', c);
                    update('labelColor', computeLabelColour(c));
                  }}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
          <StepNav onNext={goNext} onBack={goBack} />
        </div>
      )}

      {step === 'banner' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Banner image (optional)</h2>
          <p style={subStyle}>
            A wide image across the top of the card. Skip this and your accent colour is used instead.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            {state.stripUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.stripUrl} alt="" style={{ width: 120, height: 46, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
            ) : (
              <div style={{ width: 120, height: 46, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)' }} />
            )}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="btn-lime"
              style={{ padding: '0.75rem 1.25rem', borderRadius: 4, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}
            >
              {uploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingBanner ? 'Uploading...' : state.stripUrl ? 'Change banner' : 'Upload banner'}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBannerUpload(file);
                e.target.value = '';
              }}
            />
          </div>
          <StepNav onNext={goNext} onBack={goBack} nextLabel={state.stripUrl ? 'Next' : 'Skip for now'} />
        </div>
      )}

      {step === 'loyalty' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Loyalty reward</h2>
          <p style={subStyle}>What do regulars earn, and how many cuts does it take?</p>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Cuts required</label>
              <select
                value={state.loyaltyTarget}
                onChange={(e) => update('loyaltyTarget', Number(e.target.value))}
                style={{ ...inputStyle }}
              >
                <option value={3}>3 Cuts</option>
                <option value={5}>5 Cuts (Recommended)</option>
                <option value={8}>8 Cuts</option>
                <option value={10}>10 Cuts</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Reward description</label>
              <input
                type="text"
                value={state.loyaltyReward}
                onChange={(e) => update('loyaltyReward', e.target.value)}
                placeholder="e.g. 50% Off 5th Cut"
                style={inputStyle}
              />
            </div>
          </div>
          <StepNav onNext={goNext} onBack={goBack} />
        </div>
      )}

      {step === 'review' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>You&apos;re all set</h2>
          <p style={subStyle}>Add your own card to Wallet, then print your arrival QR for the shop.</p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <a
              href="/api/wallet/owner/apple"
              className="btn-lime"
              style={{ flex: 1, padding: '0.875rem', borderRadius: 4, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}
            >
              Add to Apple Wallet
            </a>
            <a
              href="/api/wallet/owner/google"
              target="_blank"
              rel="noreferrer"
              style={{ flex: 1, padding: '0.875rem', borderRadius: 4, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Add to Google Wallet
            </a>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', marginTop: '1.5rem', textAlign: 'center' }}>
            <QRCodeSVG value={`https://yourbarber.uk/arrive/${shopSlug}`} size={140} fgColor="#0A0A0A" bgColor="white" />
            <p style={{ color: '#666', fontSize: '0.7rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
              yourbarber.uk/arrive/{shopSlug}
            </p>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Print this and put it on the wall or front desk - clients scan it to join your queue.
          </p>

          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="btn-lime"
            style={{ width: '100%', padding: '0.875rem', borderRadius: 4, border: 'none', marginTop: '1.5rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Go to Dashboard
          </button>
        </div>
      )}
    </OnboardingLayout>
  );
}

function StepNav({
  onNext,
  onBack,
  nextLabel = 'Next',
  showBack = true,
}: {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  showBack?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{ padding: '0.875rem 1.25rem', borderRadius: 4, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="btn-lime"
        style={{ flex: 1, padding: '0.875rem', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        {nextLabel} <ArrowRight size={16} />
      </button>
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-barlow, sans-serif)',
  fontWeight: 900,
  fontSize: '1.5rem',
  textTransform: 'uppercase',
  color: 'white',
  margin: 0,
};

const subStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '0.875rem',
  marginTop: '0.5rem',
  lineHeight: 1.5,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '0.5rem',
  fontFamily: 'var(--font-barlow, sans-serif)',
};
