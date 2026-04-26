import { NextRequest } from 'next/server';

const mockDb = {
  shop: {
    findUnique: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  smsLog: {
    create: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({ db: mockDb }));
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/twilio', () => ({ sendSms: jest.fn() }));

import { POST as previewReminder } from '@/app/api/reminders/preview/route';
import { POST as sendReminder } from '@/app/api/reminders/send/route';
import { auth } from '@/lib/auth';
import { sendSms } from '@/lib/twilio';

const OWNER_SESSION = { user: { id: 'owner1', shopId: 'shop1', role: 'owner', name: 'Ben' } };

describe('POST /api/reminders/preview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(OWNER_SESSION);
  });

  it('returns preview message with access-code URL', async () => {
    mockDb.shop.findUnique.mockResolvedValue({ name: 'Ben J Barbers' });
    mockDb.customer.findFirst.mockResolvedValue({
      id: 'cust1',
      phone: '+447700000001',
      name: 'Marcus',
      accessCode: 'TEST1',
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
    expect(body.message).toContain('yourbarber.uk/c?code=TEST1');
    expect(body.previewUrl).toBe('http://localhost/c?code=TEST1');
  });
});

describe('POST /api/reminders/send', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(OWNER_SESSION);
    mockDb.shop.findUnique.mockResolvedValue({ name: 'Ben J Barbers' });
    mockDb.smsLog.create.mockResolvedValue({});
    (sendSms as jest.Mock).mockResolvedValue({ sid: 'SM1', status: 'queued' });
  });

  it('uses access code and latest barber when sending reminders', async () => {
    mockDb.customer.findMany.mockResolvedValue([
      {
        id: 'cust1',
        phone: '+447700000001',
        name: 'Marcus',
        accessCode: 'TEST1',
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
    expect(sendSms).toHaveBeenCalledWith(
      '+447700000001',
      expect.stringContaining('yourbarber.uk/c?code=TEST1')
    );
    expect(sendSms).toHaveBeenCalledWith(
      '+447700000001',
      expect.stringContaining('Jake')
    );
  });
});
