const DEFAULT_AVI = 42; // 6-week fallback when not enough visit history

export type ReminderType = 'overdue' | 'upcoming' | 'predictor' | 'winback';
export type ReminderStatus = 'predictor' | 'winback' | null;

const MIN_AVI = 21; // never remind sooner than 3 weeks regardless of visit clustering

/** Average Visit Interval — mean gap (days) between last 3 visits. Floored at 21 days, falls back to 42. */
export function calcAVI(visitDates: Date[]): number {
  const sorted = [...visitDates].sort((a, b) => b.getTime() - a.getTime());
  if (sorted.length < 2) return DEFAULT_AVI;
  const gaps: number[] = [];
  for (let i = 0; i < Math.min(sorted.length - 1, 3); i++) {
    gaps.push((sorted[i].getTime() - sorted[i + 1].getTime()) / 86400000);
  }
  const avg = gaps.reduce((a, b) => a + b) / gaps.length;
  return Math.max(MIN_AVI, Math.round(avg));
}

/** Days since a date (float). */
export function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / 86400000;
}

/** Whether a customer is due for a reminder based on their AVI. */
export function getReminderStatus(lastVisitAt: Date | null, avi: number): ReminderStatus {
  if (!lastVisitAt) return null;
  const days = daysSince(lastVisitAt);
  if (days >= avi + 21) return 'winback';
  if (days >= avi - 3) return 'predictor';
  return null;
}

/** Legacy fixed-window check — kept for backwards compatibility. */
export function isDueForReminder(lastVisitAt: Date | null, smsOptIn: string): boolean {
  if (smsOptIn !== 'yes' || !lastVisitAt) return false;
  return daysSince(lastVisitAt) >= DEFAULT_AVI;
}

export function buildSmsMessage(params: {
  name: string | null;
  shopName: string;
  barberName: string;
  accessCode?: string | null;
  reminderType?: ReminderType;
}): string {
  const greeting = params.name ? `Hi ${params.name}` : 'Hi';
  let base: string;
  switch (params.reminderType) {
    case 'predictor':
      base = `${greeting}, you're about due for your next cut at ${params.shopName}. Ready to book in with ${params.barberName}?`;
      break;
    case 'winback':
      base = `${greeting}, it's been a while since your last cut at ${params.shopName}. We'd love to see you back — ${params.barberName} is ready for you.`;
      break;
    case 'upcoming':
      base = `${greeting}, your next trim at ${params.shopName} is coming up soon. Ready to book back in with ${params.barberName}?`;
      break;
    default:
      base = `${greeting}, it's been 6 weeks since your cut at ${params.shopName}. Time to book in with ${params.barberName}?`;
  }
  const portal = params.accessCode
    ? ` View your cut: yourbarber.uk/c?code=${params.accessCode}`
    : '';
  return `${base}${portal} Reply STOP to opt out.`;
}
