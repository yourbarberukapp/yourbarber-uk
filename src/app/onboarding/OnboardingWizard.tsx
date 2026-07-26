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

const LOYALTY_PRESETS = [
  { target: 5, reward: 'Free Hot Towel' },
  { target: 5, reward: '50% Off 5th Cut' },
  { target: 10, reward: '50% Off 10th Cut' },
  { target: 10, reward: 'Free Cut' },
] as const;

const QR_PLACEMENTS = [
  { label: 'Front door', blurb: 'Clients scan on the way in' },
  { label: 'Counter', blurb: 'Backup if they missed the door' },
  { label: 'Each chair', blurb: 'Barbers can point to it too' },
] as const;

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
  const [cropTarget, setCropTarget] = useState<'logo' | 'banner'>('logo');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imageRef = useRef<HTMLImageElement>(null);

  const steps = ['branding', 'colour', 'loyalty', 'review'] as const;
  const step = steps[stepIndex];

  function initCrop(file: File | Blob | string, target: 'logo' | 'banner' = 'logo') {
    // A blob/object URL is always same-origin so the crop canvas can read
    // it back out — a bare external URL (string) would "taint" the canvas
    // and canvas.toBlob() throws SecurityError when we try to save the crop.
    // Callers passing a string must first fetch it through our own
    // same-origin proxy (see handleScrapeUrl / the "Found Images" picker).
    setCropTarget(target);
    if (typeof file === 'string') {
      setCropSrc(file);
    } else {
      setCropSrc(URL.createObjectURL(file));
    }
  }

  useEffect(() => {
    if (step !== 'branding') return;
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

  // Banner strip on the pass is 375x144 (~2.6:1) — default the crop to that
  // shape so the owner starts from a sensible banner-like selection instead
  // of fighting a full-image square/free crop into a wide shape by hand.
  // Logos have no fixed aspect (most are wordmarks or icons, not circles) —
  // default there is the full image, trimmed by hand if wanted.
  const BANNER_ASPECT = 375 / 144;

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (cropTarget === 'banner') {
      const aspect = BANNER_ASPECT;
      const initialCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, naturalWidth, naturalHeight),
        naturalWidth,
        naturalHeight
      );
      setCrop(initialCrop);
    } else {
      const initialCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 100 }, naturalWidth / naturalHeight, naturalWidth, naturalHeight),
        naturalWidth,
        naturalHeight
      );
      setCrop(initialCrop);
    }
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
      const file = new File([blob], `${cropTarget}-cropped.jpg`, { type: 'image/jpeg' });
      if (cropTarget === 'banner') {
        await handleBannerUpload(file);
      } else {
        await uploadLogoFile(file);
      }
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
    } catch {
      // user canceled
    }
  }

  return (
    <OnboardingLayout step={step} state={state}>
      {cropSrc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: 12, maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>{cropTarget === 'banner' ? 'Crop Banner' : 'Crop Logo'}</h3>
            {cropTarget === 'banner' && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                Locked to banner shape — drag the corners to reposition, the shape stays fixed.
              </p>
            )}
            <div style={{ overflow: 'auto', flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ReactCrop
                crop={crop}
                aspect={cropTarget === 'banner' ? BANNER_ASPECT : undefined}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img ref={imageRef} src={cropSrc} alt="Crop" crossOrigin="anonymous" style={{ maxHeight: '60vh', objectFit: 'contain' }} onLoad={onImageLoad} />
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
                  onClick={async () => {
                    setScrapedImages(null);
                    setUploadingLogo(true);
                    try {
                      // Fetch through our own proxy so the resulting blob URL is
                      // same-origin — cropping a bare external URL taints the
                      // canvas and canvas.toBlob() throws when saving.
                      const res = await fetch(`/api/settings/scrape-image?url=${encodeURIComponent(src)}`);
                      if (!res.ok) throw new Error('Could not fetch image');
                      const blob = await res.blob();
                      initCrop(blob);
                    } catch {
                      alert('Failed to load that image — try another one.');
                    } finally {
                      setUploadingLogo(false);
                    }
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

      {step === 'branding' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Add your branding</h2>
          <p style={subStyle}>
            Two different things: your <strong>logo</strong> is the small mark shown in the corner of every pass.
            Your <strong>banner</strong> is an optional wide image across the top of the card — think of it like a
            photo of your shopfront or chair. Both are shown live in the preview on the right as you add them.
            You can skip either and add them later in Settings.
          </p>

          <div style={{ marginTop: '1.5rem' }}>
            <label style={labelStyle}>Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
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
                  if (file) initCrop(file, 'logo');
                  e.target.value = '';
                }}
              />
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
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
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Tip: You can also press <strong>Ctrl+V</strong> to paste a logo directly from your clipboard.
            </p>
          </div>

          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <label style={labelStyle}>Banner (optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
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
                  if (file) initCrop(file, 'banner');
                  e.target.value = '';
                }}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Skip this and your accent colour fills the banner space instead.
            </p>
          </div>

          <StepNav onNext={goNext} nextLabel={state.logoUrl || state.stripUrl ? 'Next' : 'Skip for now'} showBack={false} />
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

      {step === 'loyalty' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>Loyalty reward</h2>
          <p style={subStyle}>What do regulars earn, and how many cuts does it take? Pick a quick preset or write your own.</p>

          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {LOYALTY_PRESETS.map((preset) => {
              const active = state.loyaltyTarget === preset.target && state.loyaltyReward === preset.reward;
              return (
                <button
                  key={preset.reward}
                  type="button"
                  onClick={() => {
                    update('loyaltyTarget', preset.target);
                    update('loyaltyReward', preset.reward);
                  }}
                  style={{
                    textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 6, cursor: 'pointer',
                    background: active ? 'rgba(200,241,53,0.1)' : 'rgba(255,255,255,0.03)',
                    border: active ? '1px solid #C8F135' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>{preset.reward}</span>
                  <span style={{ color: active ? '#C8F135' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {preset.target} cuts
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '1rem' }}>
            This is a single starter reward to get you going. Want to stack several offers (e.g. a free hot towel at 5 cuts <em>and</em> 50% off at 10)? Set up multiple loyalty offers any time in Settings → Pass Studio.
          </p>

          <StepNav onNext={goNext} onBack={goBack} />
        </div>
      )}

      {step === 'review' && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>You&apos;re all set</h2>
          <p style={subStyle}>
            Your shop and pass are ready. Here&apos;s how clients actually check in — everything below happens in
            the dashboard, not here.
          </p>

          {/* Where the QR goes — simple three-spot mockup */}
          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {QR_PLACEMENTS.map((spot) => (
              <div key={spot.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, margin: '0 auto 0.5rem', borderRadius: 6, background: '#141414', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QRCodeSVG value={`https://yourbarber.uk/arrive/${shopSlug}`} size={26} fgColor="#C8F135" bgColor="#141414" />
                </div>
                <p style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{spot.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', margin: '0.15rem 0 0' }}>{spot.blurb}</p>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Once you&apos;re in the dashboard, go to <strong>Arrival QR</strong> to print or download this code —
            clients scan it on their own phone to join the queue. No app for them to install.
          </p>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Your Wallet business card</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
              From the dashboard sidebar, tap <strong>My Owner Card</strong> to add your own Apple or Google Wallet
              card — it carries your sign-in passcode, so it doubles as your login. Add staff from <strong>Team</strong>{' '}
              and each of them gets their own card the same way.
            </p>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '1rem' }}>
            Everything here — logo, colour, banner, loyalty reward — stays editable any time in Settings → Pass
            Studio.
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
