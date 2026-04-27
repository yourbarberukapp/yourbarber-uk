'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

const lime = '#C8F135';

interface Props {
  visitId: string;
  alreadyRated: boolean;
}

export function RateVisit({ visitId, alreadyRated }: Props) {
  const [state, setState] = useState<'idle' | 'negative_input' | 'submitting' | 'done_positive' | 'done_negative'>(
    alreadyRated ? 'done_negative' : 'idle'
  );
  const [issue, setIssue] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);

  async function handleStarClick(stars: number) {
    setSelectedStars(stars);
    if (stars <= 2) {
      setState('negative_input');
    } else {
      await submitRating(stars);
    }
  }

  async function submitRating(stars: number, feedbackIssue?: string) {
    setState('submitting');
    const res = await fetch(`/api/customer/visits/${visitId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars, issue: feedbackIssue }),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (stars >= 3) {
        setGoogleReviewUrl(data.googleReviewUrl ?? null);
        setState('done_positive');
      } else {
        setState('done_negative');
      }
    } else {
      setState('idle'); // Or show error
    }
  }

  if (alreadyRated && state === 'done_negative') return null;

  if (state === 'done_positive') {
    return (
      <div style={{
        marginTop: '0.875rem', padding: '0.75rem 1rem',
        background: 'rgba(200,241,53,0.05)', border: '1px solid rgba(200,241,53,0.15)',
        borderRadius: 8,
      }}>
        <p style={{
          fontSize: '0.75rem', fontWeight: 700, color: lime,
          fontFamily: "'Barlow Condensed',sans-serif",
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: googleReviewUrl ? '0.5rem' : 0,
        }}>
          Thanks for the feedback!
        </p>
        {googleReviewUrl && (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              fontSize: '0.75rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: "'Barlow Condensed',sans-serif",
              textTransform: 'uppercase', letterSpacing: '0.06em',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            Leave us a Google review →
          </a>
        )}
      </div>
    );
  }

  if (state === 'done_negative') {
    return (
      <div style={{
        marginTop: '0.875rem', padding: '0.75rem 1rem',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}>
        <p style={{
          fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          fontFamily: "'Barlow Condensed',sans-serif",
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Feedback received. Thank you.
        </p>
      </div>
    );
  }

  if (state === 'negative_input') {
    return (
      <div style={{ marginTop: '0.875rem' }}>
        <textarea
          value={issue}
          onChange={e => setIssue(e.target.value)}
          placeholder="What could we have done better?"
          rows={2}
          style={{
            width: '100%', padding: '0.625rem 0.875rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: 'white', fontSize: '0.85rem',
            fontFamily: 'var(--font-inter, sans-serif)', resize: 'none',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => submitRating(selectedStars, issue)}
            style={{
              flex: 1, padding: '0.5rem',
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)',
              color: 'rgba(255,120,120,0.9)', borderRadius: 6,
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', cursor: 'pointer',
              fontFamily: "'Barlow Condensed',sans-serif",
            }}
          >
            Send feedback
          </button>
          <button
            onClick={() => setState('idle')}
            style={{
              padding: '0.5rem 0.875rem',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.3)', borderRadius: 6,
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', cursor: 'pointer',
              fontFamily: "'Barlow Condensed',sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span style={{
        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)',
        fontFamily: "'Barlow Condensed',sans-serif",
      }}>
        Rate your visit
      </span>
      <div 
        style={{ display: 'flex', gap: '0.25rem' }}
        onMouseLeave={() => setHoverStars(0)}
      >
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => handleStarClick(s)}
            onMouseEnter={() => setHoverStars(s)}
            disabled={state === 'submitting'}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              outline: 'none',
              transition: 'transform 0.1s ease',
              transform: (hoverStars >= s || selectedStars >= s) ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <Star 
              size={24}
              strokeWidth={1.5}
              color={(hoverStars >= s || selectedStars >= s) ? lime : 'rgba(255,255,255,0.1)'}
              fill={(hoverStars >= s || selectedStars >= s) ? lime : 'none'}
              style={{ transition: 'all 0.1s ease' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
