const appleFields = [
  ['Client', 'Jordan Booker'],
  ['Queue state', 'Waiting | Position 2'],
  ['Style tags', 'Textured Crop | Shape-up'],
  ['Pass serial', 'YB-E2EWALKINTA-PASS'],
];

const googleFields = [
  ['Header', 'Your Barber QA Lab'],
  ['Subheader', 'Next up in the walk-in queue'],
  ['Hero line', 'Jordan Booker | 15 minute estimate'],
  ['Footer', 'Wallet-ready preview validated side by side'],
];

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-white/80">{value}</p>
    </div>
  );
}

export function FlipsideWizard() {
  return (
    <section
      data-testid="flipside-wizard"
      className="grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
    >
      <aside data-testid="studio-control-rail" className="rounded-[28px] border border-white/10 bg-[#111] p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C8F135]">Card studio</p>
        <h2 className="mt-3 font-barlow text-3xl font-black uppercase tracking-tight text-white">
          FlipsideWizard
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/55">
          This workspace keeps both wallet variants visible while the barber-facing queue metadata changes. QA can pin the layout and assert that neither preview unmounts or overlaps as content scales.
        </p>

        <div className="mt-6 space-y-4">
          <PreviewField label="Primary palette" value="Charcoal, lime accent, and high-contrast white copy" />
          <PreviewField label="Template mode" value="Queue ticket mapped to wallet-ready customer pass" />
          <PreviewField label="Guard rail" value="Equal-width preview columns with wrapped copy and fixed card shells" />
        </div>
      </aside>

      <div
        data-testid="studio-preview-canvas"
        className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 shadow-[0_35px_90px_rgba(0,0,0,0.28)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Live preview canvas</p>
            <h3 className="mt-2 font-barlow text-2xl font-black uppercase tracking-[0.04em] text-white">
              Apple and Google wallet surfaces
            </h3>
          </div>
          <span className="rounded-full border border-[#C8F135]/20 bg-[#C8F135]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">
            Sync locked
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <article
            data-testid="apple-wallet-preview"
            className="flex min-h-[340px] flex-col rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,#1d1d1d_0%,#0f0f0f_60%,#090909_100%)] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8F135]">Apple Wallet pass</p>
                <h4 className="mt-2 font-barlow text-2xl font-black uppercase text-white">Queue status</h4>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">
                Live
              </div>
            </div>

            <div data-testid="apple-wallet-preview-copy" className="mt-5 grid flex-1 gap-3 content-start">
              {appleFields.map(([label, value]) => (
                <PreviewField key={label} label={label} value={value} />
              ))}
            </div>
          </article>

          <article
            data-testid="google-wallet-preview"
            className="flex min-h-[340px] flex-col rounded-[28px] border border-sky-300/20 bg-[linear-gradient(160deg,rgba(7,35,56,0.95)_0%,rgba(8,17,29,0.96)_58%,rgba(7,11,18,1)_100%)] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">Google Wallet header pass</p>
                <h4 className="mt-2 font-barlow text-2xl font-black uppercase text-white">Customer handoff</h4>
              </div>
              <div className="rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-100">
                Mirrored
              </div>
            </div>

            <div data-testid="google-wallet-preview-copy" className="mt-5 grid flex-1 gap-3 content-start">
              {googleFields.map(([label, value]) => (
                <PreviewField key={label} label={label} value={value} />
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
