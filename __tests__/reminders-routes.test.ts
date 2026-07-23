import { NextRequest } from 'next/server';

const mockDb = {
  shop: {
    findUnique: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockNotifyCustomer = jest.fn();

jest.mock('@/lib/db', () => ({ db: mockDb }));
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/wallet/notify', () => ({ notifyCustomer: mockNotifyCustomer }));

import { POST as previewReminder } from '@/app/api/reminders/preview/route';
import { POST as sendReminder } from '@/app/api/reminders/send/route';
import { auth } from '@/lib/auth';

const OWNER_SESSION = { user: { id: 'owner1', shopId: 'shop1', role: 'owner', name: 'Ben' } };

describe('POST /api/reminders/preview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(OWNER_SESSION);
  });

  it('returns preview message and wallet pass status', async () => {
    mockDb.shop.findUnique.mockResolvedValue({ name: 'Ben J Barbers', allowBarberReminders: true });
    mockDb.customer.findFirst.mockResolvedValue({
      id: 'cust1',
      name: 'Marcus',
      walletDevices: [{ id: 'wd1' }],
      googlePassId: null,
      visits: [{ barber: { name: 'Jake' } }],
    });

    const res = await previewReminder(
      new NextRequest('http://localhost/api/reminders/preview', {
        method: 'POST',
        body: JSON.stringify({ customerId: 'cust1', reminderType: 'overdue' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('Marcus');
    expect(body.message).toContain('Jake');
    expect(body.hasWalletPass).toBe(true);
  });

  it('reports no wallet pass when customer has none installed', async () => {
    mockDb.shop.findUnique.mockResolvedValue({ name: 'Ben J Barbers', allowBarberReminders: true });
    mockDb.customer.findFirst.mockResolvedValue({
      id: 'cust2',
      name: 'Priya',
      walletDevices: [],
      googlePassId: null,
      visits: [],
    });

    const res = await previewReminder(
      new NextRequest('http://localhost/api/reminders/preview', {
        method: 'POST',
        body: JSON.stringify({ customerId: 'cust2', reminderType: 'overdue' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(body.hasWalletPass).toBe(false);
  });
});

describe('POST /api/reminders/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(OWNER_SESSION);
    mockDb.shop.findUnique.mockResolvedValue({ name: 'Ben J Barbers', allowBarberReminders: true });
    mockNotifyCustomer.mockResolvedValue({ notified: true });
  });

  it('pushes a wallet notification and reports it sent — no SMS provider involved', async () => {
    mockDb.customer.findMany.mockResolvedValue([
      {
        id: 'cust1',
        name: 'Marcus',
        visits: [{ barber: { name: 'Jake' } }],
      },
    ]);

    const res = await sendReminder(
      new NextRequest('http://localhost/api/reminders/send', {
        method: 'POST',
        body: JSON.stringify({ customerIds: ['cust1'] }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(mockNotifyCustomer).toHaveBeenCalledWith('cust1', expect.stringContaining('Jake'));
  });

  it('counts a failed push without throwing', async () => {
    mockDb.customer.findMany.mockResolvedValue([
      { id: 'cust1', name: 'Marcus', visits: [] },
    ]);
    mockNotifyCustomer.mockRejectedValueOnce(new Error('push failed'));

    const res = await sendReminder(
      new NextRequest('http://localhost/api/reminders/send', {
        method: 'POST',
        body: JSON.stringify({ customerIds: ['cust1'] }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(body.failed).toBe(1);
  });
});
