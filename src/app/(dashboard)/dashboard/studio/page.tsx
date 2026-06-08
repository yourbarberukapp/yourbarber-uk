import { FlipsideWizard } from '@/components/studio/FlipsideWizard';
import { getRequiredSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function DashboardStudioPage() {
  const session = await getRequiredSession();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C8F135]">Studio workspace</p>
        <h1 className="font-barlow text-4xl font-black uppercase tracking-tight text-white">
          Wallet preview customizer
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-white/45">
          Signed in as {session.name}. This view is tuned for deterministic E2E layout checks around the dual wallet preview canvas.
        </p>
      </header>

      <FlipsideWizard />
    </div>
  );
}
