import Link from 'next/link';

const optInLabel: Record<string, string> = { yes: 'SMS on', no: 'SMS off', not_asked: 'Not asked' };
const optInColor: Record<string, string> = {
  yes: 'bg-green-100 text-green-800',
  no: 'bg-neutral-100 text-neutral-600',
  not_asked: 'bg-yellow-100 text-yellow-800',
};

interface Props {
  id: string; phone: string; name?: string | null;
  smsOptIn: string; lastVisitAt?: string | null;
}

export function CustomerCard({ id, phone, name, smsOptIn, lastVisitAt }: Props) {
  const lastVisit = lastVisitAt ? new Date(lastVisitAt).toLocaleDateString('en-GB') : 'Never';
  return (
    <Link href={`/customers/${id}`} className="block">
      <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 mb-2 flex items-center justify-between active:bg-neutral-50">
        <div>
          <p className="font-semibold text-base">{name ?? 'No name'}</p>
          <p className="text-sm text-neutral-500">{phone} · Last visit: {lastVisit}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${optInColor[smsOptIn]}`}>
          {optInLabel[smsOptIn]}
        </span>
      </div>
    </Link>
  );
}
