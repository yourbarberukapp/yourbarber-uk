const REMINDER_DAYS = 42; // 6 weeks

export function isDueForReminder(lastVisitAt: Date | null, smsOptIn: string): boolean {
  if (smsOptIn !== 'yes' || !lastVisitAt) return false;
  const daysSince = (Date.now() - lastVisitAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= REMINDER_DAYS;
}

export function buildSmsMessage(params: {
  name: string | null;
  shopName: string;
  barberName: string;
  accessCode?: string | null;
}): string {
  const greeting = params.name ? `Hi ${params.name}` : 'Hi';
  const base = `${greeting}, it's been 6 weeks since your cut at ${params.shopName}. Time to book in with ${params.barberName}?`;
  const portal = params.accessCode
    ? ` View your cut: yourbarber.uk/c?code=${params.accessCode}`
    : '';
  return `${base}${portal} Reply STOP to opt out.`;
}
