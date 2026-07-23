'use client';

import React, { useState } from 'react';
import { AppleWalletPreview, GoogleWalletPreview } from '@/components/WalletPreview';
import { Loader2, Check, Sparkles } from 'lucide-react';

interface ShopData {
  id: string;
  name: string;
  slug: string;
  passAccentColor: string | null;
  passLabelColor: string | null;
  loyaltyEnabled: boolean;
  loyaltyTarget: number;
  loyaltyReward: string;
  promoMessage: string | null;
}

export default function PassStudioClient({ shop }: { shop: ShopData }) {
  const [accentColor, setAccentColor] = useState(shop.passAccentColor || '#111111');
  const [labelColor, setLabelColor] = useState(shop.passLabelColor || '#C8F135');
  const [loyaltyTarget, setLoyaltyTarget] = useState(shop.loyaltyTarget || 5);
  const [loyaltyReward, setLoyaltyReward] = useState(shop.loyaltyReward || '50% Off 5th Cut');
  const [promoMessage, setPromoMessage] = useState(shop.promoMessage || '');
  const [previewTab, setPreviewTab] = useState<'apple' | 'google'>('apple');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/settings/pass-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passAccentColor: accentColor,
          passLabelColor: labelColor,
          loyaltyTarget: Number(loyaltyTarget),
          loyaltyReward,
          promoMessage,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const PRESET_COLORS = ['#111111', '#1A1D20', '#1C2541', '#2B1B17', '#1E3A2B', '#3A1E2B'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Controls Form */}
      <div className="lg:col-span-6 bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="font-barlow font-bold text-lg uppercase text-white tracking-wide">
            Card Branding & Theme
          </h3>
          <p className="text-white/40 text-xs mt-1">
            Choose background accent colors and text label colors for your Wallet pass.
          </p>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2 font-barlow">
            Pass Accent Background
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm uppercase w-32"
            />
            <div className="flex items-center gap-1.5 ml-auto">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Label Color */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2 font-barlow">
            Label Accent Color (Apple Wallet)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={labelColor}
              onChange={(e) => setLabelColor(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm uppercase w-32"
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="font-barlow font-bold text-lg uppercase text-white tracking-wide">
            Loyalty & Stamp Rules
          </h3>
        </div>

        {/* Stamps Required */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2 font-barlow">
            Cuts / Stamps Required for Reward
          </label>
          <select
            value={loyaltyTarget}
            onChange={(e) => setLoyaltyTarget(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-barlow text-sm"
          >
            <option value={3} className="bg-[#111]">3 Cuts</option>
            <option value={5} className="bg-[#111]">5 Cuts (Recommended)</option>
            <option value={8} className="bg-[#111]">8 Cuts</option>
            <option value={10} className="bg-[#111]">10 Cuts</option>
          </select>
        </div>

        {/* Reward Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2 font-barlow">
            Reward Description
          </label>
          <input
            type="text"
            value={loyaltyReward}
            onChange={(e) => setLoyaltyReward(e.target.value)}
            placeholder="e.g. 50% Off 5th Cut or Free Beard Oil"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-inter text-sm"
          />
        </div>

        {/* Special Promo Message */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2 font-barlow">
            Special Promo Announcement (Optional)
          </label>
          <textarea
            value={promoMessage}
            onChange={(e) => setPromoMessage(e.target.value)}
            placeholder="e.g. Tuesday 20% off all beard trims!"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-inter text-sm resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-lime w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,241,53,0.15)]"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <>
              <Check size={16} /> Saved Successfully
            </>
          ) : (
            <>
              <Sparkles size={16} /> Save & Deploy Pass Changes
            </>
          )}
        </button>
      </div>

      {/* Live Preview Panel */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-bold uppercase tracking-wider text-white/50 font-barlow">
            Live Pass Preview
          </span>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setPreviewTab('apple')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase font-barlow transition-colors ${
                previewTab === 'apple' ? 'bg-[#C8F135] text-[#0a0a0a]' : 'text-white/60 hover:text-white'
              }`}
            >
              Apple Wallet
            </button>
            <button
              onClick={() => setPreviewTab('google')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase font-barlow transition-colors ${
                previewTab === 'google' ? 'bg-[#C8F135] text-[#0a0a0a]' : 'text-white/60 hover:text-white'
              }`}
            >
              Google Wallet
            </button>
          </div>
        </div>

        {previewTab === 'apple' ? (
          <AppleWalletPreview
            shopName={shop.name}
            accentColor={accentColor}
            labelColor={labelColor}
            loyaltyTarget={loyaltyTarget}
            rewardName={loyaltyReward}
            promoMessage={promoMessage}
          />
        ) : (
          <GoogleWalletPreview
            shopName={shop.name}
            accentColor={accentColor}
            loyaltyTarget={loyaltyTarget}
            rewardName={loyaltyReward}
          />
        )}
      </div>
    </div>
  );
}
