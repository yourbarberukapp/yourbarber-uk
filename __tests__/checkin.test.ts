import { NextRequest } from 'next/server';

const mockDb = {
  customer: {
    findUnique: jest.fn(),
  },
  checkIn: {
    create: jest.fn(),
  },
  appointment: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  visit: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({ db: mockDb }));
jest.mock('@/lib/customerAuth', () => ({ getCustomerSession: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));

import { POST as createCheckin } from '@/app/api/customer/checkin/route';
import { POST as startCheckin } from '@/app/api/qr/checkin/start/route';
import { POST as finishCheckin } from '@/app/api/qr/checkin/finish/route';
import { getCustomerSession } from '@/lib/customerAuth';
import { getSession } from '@/lib/session';

describe('POST /api/customer/checkin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the customer auth helper and creates a check-in token', async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: 'cust1' });
    mockDb.customer.findUnique.mockResolvedValue({ id: 'cust1', shopId: 'shop1' });
    mockDb.checkIn.create.mockResolvedValue({ qrToken: 'qr-123' });

    const res = await createCheckin(
      new Request('http://localhost/api/customer/checkin', {
        method: 'POST',
        body: JSON.stringify({ referenceVisitId: 'visit1' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.qrToken).toBe('qr-123');
    expect(mockDb.checkIn.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customerId: 'cust1', shopId: 'shop1', referenceVisitId: 'visit1' }),
      })
    );
  });
});

describe('POST /api/qr/checkin/finish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue({ barberId: 'barber1', shopId: 'shop1', role: 'barber', name: 'Jake', shopName: 'Ben J' });
  });

  it('marks an in-progress appointment completed by customerId', async () => {
    mockDb.appointment.findFirst.mockResolvedValue({ id: 'appt1', customerId: 'cust1' });
    mockDb.appointment.update.mockResolvedValue({});

    const res = await finishCheckin(
      new NextRequest('http://localhost/api/qr/checkin/finish', {
        method: 'POST',
        body: JSON.stringify({ customerId: 'cust1' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('completed');
    expect(body.appointmentId).toBe('appt1');
    expect(body.reminderPreference).toBe('ask_now');
  });

  it('updates visit reminder timing when a visitId is provided', async () => {
    mockDb.visit.findFirst.mockResolvedValue({
      id: 'visit1',
      customerId: 'cust1',
      customer: { preferredReminderWeeks: 6 },
    });
    mockDb.visit.update.mockResolvedValue({});

    const res = await finishCheckin(
      new NextRequest('http://localhost/api/qr/checkin/finish', {
        method: 'POST',
        body: JSON.stringify({ visitId: 'visit1' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.visitId).toBe('visit1');
    expect(body.reminderPreference).toBe('6_weeks');
    expect(mockDb.visit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'visit1' },
        data: expect.objectContaining({ reminderScheduledAt: expect.any(Date) }),
      })
    );
  });

  it('creates a walk-in appointment when check-in starts with no booking', async () => {
    mockDb.appointment.findFirst.mockResolvedValue(null);
    mockDb.appointment.create.mockResolvedValue({ id: 'walkin1' });

    const res = await startCheckin(
      new NextRequest('http://localhost/api/qr/checkin/start', {
        method: 'POST',
        body: JSON.stringify({ customerId: 'cust1' }),
        headers: { 'content-type': 'application/json' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.appointmentId).toBe('walkin1');
    expect(mockDb.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust1',
          shopId: 'shop1',
          barberId: 'barber1',
          status: 'in_progress',
        }),
      })
    );
  });
});
