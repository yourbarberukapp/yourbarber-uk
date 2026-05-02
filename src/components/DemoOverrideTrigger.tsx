'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, MapPin, Store, Clock, ExternalLink, Loader2, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useDemoOverride } from './DemoOverrideProvider';

interface DemoOverrideTriggerProps {
  shopSlug?: string;
  showBadge?: boolean;
}

export default function DemoOverrideTrigger({ 
  shopSlug = 'the-barber-room',
  showBadge = false 
}: DemoOverrideTriggerProps) {
  const { overrides, setOverride, clearOverride } = useDemoOverride();
  const [tapCount, setTapCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const currentOverrides = overrides[shopSlug] || {};
  
  const [formData, setFormData] = useState({
    name: currentOverrides.name || '',
    address: currentOverrides.address || '',
    googleMapsUrl: currentOverrides.googleMapsUrl || '',
  });

  // Sync formData with currentOverrides when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: currentOverrides.name || '',
        address: currentOverrides.address || '',
        googleMapsUrl: currentOverrides.googleMapsUrl || '',
      });
    }
  }, [isOpen, currentOverrides]);

  // Handle triple tap on the component
  const handleTap = (e: React.MouseEvent | React.PointerEvent) => {
    setTapCount(prev => prev + 1);
  };

  useEffect(() => {
    // Check for ?demo=true in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setIsOpen(true);
      // Remove the param from URL without refreshing to keep it clean
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Keyboard shortcut: Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (tapCount === 3) {
      setIsOpen(true);
      setTapCount(0);
    }

    const timer = setTimeout(() => {
      setTapCount(0);
    }, 1500); // Relaxed from 1000 to 1500ms

    return () => clearTimeout(timer);
  }, [tapCount]);

  const handleMagicFetch = async () => {
    if (!formData.googleMapsUrl) {
      alert('Please paste a Google Maps URL first');
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch('/api/demo/extract-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.googleMapsUrl }),
      });

      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          name: result.data.name || prev.name,
          address: result.data.address || prev.address,
        }));
      } else {
        alert('Could not extract details automatically. Please enter them manually.');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      alert('An error occurred during extraction');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Update local state and cookies via provider
      setOverride(shopSlug, formData);
      
      // 2. Optionally update DB if it's the primary demo slug
      if (shopSlug === 'the-barber-room') {
        await fetch('/api/demo/override-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: shopSlug,
            ...formData,
          }),
        });
      }

      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating shop:', error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to remove all overrides for this shop?')) {
      clearOverride(shopSlug);
      setIsOpen(false);
      window.location.reload();
    }
  };

  if (!isOpen) {
    return (
      <div 
        onPointerDown={handleTap}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Triple tap for Demo Settings"
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-barlow, sans-serif)', fontWeight: 900,
            fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'white',
          }}>
            YOUR<span style={{ color: '#C8F135' }}>BARBER</span>
          </span>
          {showBadge && (
            <span style={{
              fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              background: 'rgba(200,241,53,0.1)', color: '#C8F135',
              border: '1px solid rgba(200,241,53,0.2)',
              padding: '0.2rem 0.5rem', borderRadius: 2,
              fontFamily: 'var(--font-barlow, sans-serif)',
            }}>Barber</span>
          )}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div 
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', 
          backdropFilter: 'blur(12px)', zIndex: 9999,
          overflowY: 'auto', display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '4rem 1rem', // Increased padding for mobile safe areas
          WebkitOverflowScrolling: 'touch'
        }}
        onClick={() => setIsOpen(false)}
      >
        <div 
          style={{
            background: '#0F0F0F', border: '1px solid rgba(200,241,53,0.2)',
            borderRadius: '16px', width: '100%', maxWidth: '420px',
            padding: '2rem', boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
            position: 'relative', overflow: 'hidden',
            // Centering logic: margin-bottom auto keeps it pushed towards the top 
            // if it's tall, but padding on parent ensures it's never cut off.
            marginTop: '0', 
            marginBottom: 'auto',
            flexShrink: 0, // Prevent the modal from shrinking
            display: 'flex', flexDirection: 'column', gap: '1.5rem'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Subtle Glow */}
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px', 
            width: '150px', height: '150px', background: 'rgba(200,241,53,0.05)',
            filter: 'blur(40px)', borderRadius: 'full', pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#C8F135', display: 'flex', alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={18} className="text-black" />
              </div>
              <h2 style={{ 
                margin: 0, fontSize: '1.25rem', fontWeight: 900, 
                fontFamily: 'var(--font-barlow, sans-serif)', color: 'white',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Demo <span style={{ color: '#C8F135' }}>Override</span>
              </h2>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', 
                cursor: 'pointer', padding: '8px', borderRadius: '50%'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Google Maps Link
              </label>
              <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text"
                  placeholder="Paste URL to auto-fill..."
                  value={formData.googleMapsUrl}
                  onChange={e => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '0.875rem', color: 'white', fontSize: '0.9rem',
                    outline: 'none', flex: 1, fontFamily: 'var(--font-inter, sans-serif)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleMagicFetch}
                  disabled={isExtracting}
                  style={{
                    background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)',
                    borderRadius: '8px', padding: '0 1rem', color: '#C8F135', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Magic Auto-Fill"
                >
                  {isExtracting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Shop Name
              </label>
              <input 
                type="text"
                placeholder="e.g. The High St Barber"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.875rem', color: 'white', fontSize: '0.9rem',
                  outline: 'none', width: '100%', fontFamily: 'var(--font-inter, sans-serif)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Address
              </label>
              <textarea 
                placeholder="e.g. 123 High St, London"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.875rem', color: 'white', fontSize: '0.9rem',
                  outline: 'none', width: '100%', fontFamily: 'var(--font-inter, sans-serif)',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                type="button"
                onClick={handleReset}
                style={{
                  background: 'rgba(255,50,50,0.1)', color: '#FF5050', border: '1px solid rgba(255,50,50,0.2)',
                  borderRadius: '8px', padding: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Clear Overrides"
              >
                <Trash2 size={18} />
              </button>

              <button 
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: '#C8F135', color: 'black', border: 'none',
                  borderRadius: '8px', padding: '0.875rem', fontWeight: 900,
                  fontSize: '0.9rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Apply Branding'}
              </button>
            </div>
          </form>
          
          <div style={{ 
            marginTop: '1.5rem', padding: '0.75rem', borderRadius: '8px',
            background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.1)'
          }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
              Overrides are stored locally on this device.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)}
              style={{ 
                color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '4px', background: 'rgba(255,255,255,0.02)'
              }}
            >
              <ExternalLink size={14} /> Go back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
