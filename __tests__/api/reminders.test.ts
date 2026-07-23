import { isDueForReminder, buildReminderMessage } from '@/lib/reminders';

describe('isDueForReminder', () => {
  it('returns true when 43 days ago and opted in', () => {
    const d = new Date(Date.now() - 43 * 24 * 60 * 60 * 1000);
    expect(isDueForReminder(d, 'yes')).toBe(true);
  });
  it('returns false when only 30 days ago', () => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(isDueForReminder(d, 'yes')).toBe(false);
  });
  it('returns false when opted out', () => {
    const d = new Date(Date.now() - 43 * 24 * 60 * 60 * 1000);
    expect(isDueForReminder(d, 'no')).toBe(false);
  });
  it('returns false when null lastVisitAt', () => {
    expect(isDueForReminder(null, 'yes')).toBe(false);
  });
});

describe('buildReminderMessage', () => {
  it('includes name when provided', () => {
    const msg = buildReminderMessage({ name: 'Jake', shopName: "Benjie's", barberName: 'Benjie' });
    expect(msg).toContain('Jake');
    expect(msg).toContain("Benjie's");
  });
  it('works without name', () => {
    const msg = buildReminderMessage({ name: null, shopName: "Benjie's", barberName: 'Benjie' });
    expect(msg).not.toContain('null');
    expect(msg).toContain('Hi,');
  });
  it('varies copy by reminder type', () => {
    const predictor = buildReminderMessage({ name: 'Sam', shopName: 'Shop', barberName: 'Jake', reminderType: 'predictor' });
    const winback = buildReminderMessage({ name: 'Sam', shopName: 'Shop', barberName: 'Jake', reminderType: 'winback' });
    expect(predictor).not.toBe(winback);
  });
});
