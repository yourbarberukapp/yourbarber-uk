import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks — must be before any imports that pull in the real modules
// ---------------------------------------------------------------------------

const mockDb = {
  feedback: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  feedbackTicket: {
    create: jest.fn(),
    update: jest.fn(),
  },
  visit: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  customer: {
    findUnique: jest.fn(),
  },
  barber: {
    findFirst: jest.fn(),
  },
  smsLog: {
    create: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({ db: mockDb }));
jest.mock('@/lib/twilio', () => ({ sendSms: jest.fn() }));
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/customerAuth', () => ({ getCustomerSession: jest.fn() }));

import { POST as createFeedback } from '@/app/api/feedback/create/route';
import { PATCH as resolveFeedback } from '@/app/api/feedback/[feedbackId]/resolve/route';
import { POST as completeFeedback } from '@/app/api/feedback/[feedbackId]/complete/route';
import { GET as getFeedback } from '@/app/api/feedback/route';
import { sendSms } from '@/lib/twilio';
import { auth } from '@/lib/auth';
import { getCustomerSession } from '@/lib/customerAuth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost/api/feedback/create', {
    method,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/feedback');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

const BARBER_SESSION = { user: { id: 'barber1', shopId: 'shop1', role: 'barber', name: 'Jake' } };
const OWNER_SESSION = { user: { id: 'owner1', shopId: 'shop1', role: 'owner', name: 'Ben' } };
const CUSTOMER_SESSION = { customerId: 'cust1' };

// ---------------------------------------------------------------------------
// POST /api/feedback/create
// ---------------------------------------------------------------------------

describe('POST /api/feedback/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(BARBER_SESSION);
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
  });

  it('returns 401 when no session', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    (getCustomerSession as jest.Mock).mockResolvedValue(null);

    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'positive', sourceType: 'in_shop' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid rating', async () => {
    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'meh', sourceType: 'in_shop' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when visit not found', async () => {
    mockDb.visit.findFirst.mockResolvedValue(null);
    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'positive', sourceType: 'in_shop' }));
    expect(res.status).toBe(404);
  });

  it('creates feedback without ticket for positive rating', async () => {
    mockDb.visit.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop1', shop: { name: 'Ben J', phone: null } });
    mockDb.feedback.create.mockResolvedValue({ id: 'fb1' });

    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'positive', sourceType: 'in_shop' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.feedbackId).toBe('fb1');
    expect(body.ticketId).toBeNull();
    expect(mockDb.feedbackTicket.create).not.toHaveBeenCalled();
  });

  it('creates feedback + ticket for neutral rating', async () => {
    mockDb.visit.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop1', shop: { name: 'Ben J', phone: null } });
    mockDb.feedback.create.mockResolvedValue({ id: 'fb2' });
    mockDb.feedbackTicket.create.mockResolvedValue({ id: 'tk1', status: 'unresolved' });

    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'neutral', sourceType: 'web' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ticketId).toBe('tk1');
    expect(body.status).toBe('unresolved');
    expect(mockDb.feedbackTicket.create).toHaveBeenCalledWith({
      data: { feedbackId: 'fb2', status: 'unresolved' },
    });
  });

  it('sends SMS alert to shop phone on negative feedback', async () => {
    mockDb.visit.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop1', shop: { name: 'Ben J', phone: '+447700123456' } });
    mockDb.feedback.create.mockResolvedValue({ id: 'fb3' });
    mockDb.feedbackTicket.create.mockResolvedValue({ id: 'tk2', status: 'unresolved' });
    mockDb.customer.findUnique.mockResolvedValue({ name: 'Ahmed' });
    (sendSms as jest.Mock).mockResolvedValue({ sid: 'SM123', status: 'queued' });

    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'negative', issue: 'Left side shorter', sourceType: 'in_shop' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.alertSent).toBe(true);
    expect(sendSms).toHaveBeenCalledWith('+447700123456', expect.stringContaining('Ahmed'));
    expect(sendSms).toHaveBeenCalledWith('+447700123456', expect.stringContaining('Left side shorter'));
  });

  it('does not send alert when shop has no phone', async () => {
    mockDb.visit.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop1', shop: { name: 'Ben J', phone: null } });
    mockDb.feedback.create.mockResolvedValue({ id: 'fb4' });
    mockDb.feedbackTicket.create.mockResolvedValue({ id: 'tk3', status: 'unresolved' });

    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'negative', sourceType: 'in_shop' }));
    const body = await res.json();

    expect(body.alertSent).toBe(false);
    expect(sendSms).not.toHaveBeenCalled();
  });

  it('still returns 201 even if alert SMS throws', async () => {
    mockDb.visit.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop1', shop: { name: 'Ben J', phone: '+447700123456' } });
    mockDb.feedback.create.mockResolvedValue({ id: 'fb5' });
    mockDb.feedbackTicket.create.mockResolvedValue({ id: 'tk4', status: 'unresolved' });
    mockDb.customer.findUnique.mockResolvedValue({ name: 'Sam' });
    (sendSms as jest.Mock).mockRejectedValue(new Error('Twilio down'));

    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'negative', sourceType: 'web' }));
    expect(res.status).toBe(201);
  });

  it('blocks cross-shop access for barber session', async () => {
    mockDb.visit.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop-OTHER', shop: { name: 'Other', phone: null } });
    mockDb.feedback.create.mockResolvedValue({ id: 'fb6' });

    const res = await createFeedback(makeRequest({ customerId: 'c1', visitId: 'v1', rating: 'positive', sourceType: 'in_shop' }));
    expect(res.status).toBe(403);
  });

  it('allows customer session for their own visit', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    (getCustomerSession as jest.Mock).mockResolvedValue(CUSTOMER_SESSION);
    mockDb.visit.findFirst.mockResolvedValue({ id: 'v1', shopId: 'shop1', shop: { name: 'Ben J', phone: null } });
    mockDb.feedback.create.mockResolvedValue({ id: 'fb7' });

    const res = await createFeedback(makeRequest({ customerId: 'cust1', visitId: 'v1', rating: 'positive', sourceType: 'web' }));
    expect(res.status).toBe(201);
  });

  it('blocks customer session from submitting for a different customer', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    (getCustomerSession as jest.Mock).mockResolvedValue(CUSTOMER_SESSION); // cust1

    const res = await createFeedback(makeRequest({ customerId: 'cust-OTHER', visitId: 'v1', rating: 'positive', sourceType: 'web' }));
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/feedback/[feedbackId]/resolve
// ---------------------------------------------------------------------------

describe('PATCH /api/feedback/[feedbackId]/resolve', () => {
  const makeResolveRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/feedback/fb1/resolve', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });

  const routeParams = { params: { feedbackId: 'fb1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(OWNER_SESSION);
  });

  it('returns 403 for non-owner barber', async () => {
    (auth as jest.Mock).mockResolvedValue(BARBER_SESSION);
    const res = await resolveFeedback(makeResolveRequest({ resolution: 'log_only' }), routeParams);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid resolution', async () => {
    const res = await resolveFeedback(makeResolveRequest({ resolution: 'delete_customer' }), routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 400 when assignedBarberId missing for same_barber_fix', async () => {
    const res = await resolveFeedback(makeResolveRequest({ resolution: 'same_barber_fix' }), routeParams);
    expect(res.status).toBe(400);
  });

  it('returns 404 when feedback not found in shop', async () => {
    mockDb.feedback.findFirst.mockResolvedValue(null);
    const res = await resolveFeedback(makeResolveRequest({ resolution: 'log_only' }), routeParams);
    expect(res.status).toBe(404);
  });

  it('returns 409 when ticket already resolved', async () => {
    mockDb.feedback.findFirst.mockResolvedValue({
      id: 'fb1', issue: 'Too short', shop: { name: 'Ben J' },
      customer: { id: 'c1', name: 'Sam', phone: '+447700000001' },
      ticket: { id: 'tk1', status: 'resolved' },
    });
    const res = await resolveFeedback(makeResolveRequest({ resolution: 'log_only' }), routeParams);
    expect(res.status).toBe(409);
  });

  it('resolves with log_only — no SMS sent, status = resolved', async () => {
    mockDb.feedback.findFirst.mockResolvedValue({
      id: 'fb1', issue: null, shop: { name: 'Ben J' },
      customer: { id: 'c1', name: 'Sam', phone: '+447700000001' },
      ticket: { id: 'tk1', status: 'unresolved' },
    });
    mockDb.feedbackTicket.update.mockResolvedValue({ id: 'tk1', status: 'resolved' });

    const res = await resolveFeedback(makeResolveRequest({ resolution: 'log_only' }), routeParams);
    expect(res.status).toBe(200);
    expect(sendSms).not.toHaveBeenCalled();
    expect(mockDb.feedbackTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'resolved' }) })
    );
  });

  it('resolves with book_return — SMS sent to customer, status = in_progress', async () => {
    mockDb.feedback.findFirst.mockResolvedValue({
      id: 'fb1', issue: 'Too short', shop: { name: 'Ben J' },
      customer: { id: 'c1', name: 'Ahmed', phone: '+447700000002' },
      ticket: { id: 'tk1', status: 'unresolved' },
    });
    mockDb.feedbackTicket.update.mockResolvedValue({ id: 'tk1', status: 'in_progress' });
    mockDb.smsLog.create.mockResolvedValue({});
    (sendSms as jest.Mock).mockResolvedValue({ sid: 'SM999', status: 'queued' });

    const res = await resolveFeedback(
      makeResolveRequest({ resolution: 'book_return', preferredDate: '2026-05-07T10:00:00.000Z' }),
      routeParams
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.smsSent).toBe(true);
    expect(sendSms).toHaveBeenCalledWith('+447700000002', expect.stringContaining('Ben J'));
    expect(sendSms).toHaveBeenCalledWith('+447700000002', expect.stringContaining('Thursday'));
  });

  it('resolves with same_barber_fix — looks up barber name', async () => {
    mockDb.feedback.findFirst.mockResolvedValue({
      id: 'fb1', issue: 'Uneven', shop: { name: 'Ben J' },
      customer: { id: 'c1', name: 'James', phone: '+447700000003' },
      ticket: { id: 'tk1', status: 'unresolved' },
    });
    mockDb.barber.findFirst.mockResolvedValue({ name: 'Jake' });
    mockDb.feedbackTicket.update.mockResolvedValue({ id: 'tk1', status: 'in_progress' });
    mockDb.smsLog.create.mockResolvedValue({});
    (sendSms as jest.Mock).mockResolvedValue({ sid: 'SM888', status: 'queued' });

    const res = await resolveFeedback(
      makeResolveRequest({ resolution: 'same_barber_fix', assignedBarberId: 'barber1' }),
      routeParams
    );
    expect(res.status).toBe(200);
    expect(sendSms).toHaveBeenCalledWith('+447700000003', expect.stringContaining('Jake'));
  });
});

// ---------------------------------------------------------------------------
// POST /api/feedback/[feedbackId]/complete
// ---------------------------------------------------------------------------

describe('POST /api/feedback/[feedbackId]/complete', () => {
  const makeCompleteRequest = (body: unknown) =>
    new NextRequest('http://localhost/api/feedback/fb1/complete', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });

  const routeParams = { params: { feedbackId: 'fb1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(OWNER_SESSION);
  });

  it('returns 404 when feedback is missing', async () => {
    mockDb.feedback.findFirst.mockResolvedValue(null);
    const res = await completeFeedback(makeCompleteRequest({ customerHappy: true }), routeParams);
    expect(res.status).toBe(404);
  });

  it('blocks unassigned barbers from completing a ticket', async () => {
    (auth as jest.Mock).mockResolvedValue(BARBER_SESSION);
    mockDb.feedback.findFirst.mockResolvedValue({
      id: 'fb1',
      customerId: 'c1',
      issue: 'Uneven fade',
      shopId: 'shop1',
      shop: { name: 'Ben J', phone: '+447700000010', defaultReminderWeeks: 6 },
      customer: { id: 'c1', phone: '+447700000011', preferredReminderWeeks: 8 },
      visit: { id: 'v1', barberId: 'barber1' },
      ticket: { id: 'tk1', status: 'in_progress', assignedBarberId: 'barber-OTHER', notes: null },
    });

    const res = await completeFeedback(makeCompleteRequest({ customerHappy: true }), routeParams);
    expect(res.status).toBe(403);
  });

  it('resolves the ticket, updates reminder schedule, and sends customer SMS', async () => {
    mockDb.feedback.findFirst.mockResolvedValue({
      id: 'fb1',
      customerId: 'c1',
      issue: 'Too short',
      shopId: 'shop1',
      shop: { name: 'Ben J', phone: '+447700000010', defaultReminderWeeks: 6 },
      customer: { id: 'c1', phone: '+447700000011', preferredReminderWeeks: 8 },
      visit: { id: 'v1', barberId: 'barber1' },
      ticket: { id: 'tk1', status: 'in_progress', assignedBarberId: 'barber1', notes: 'Initial note' },
    });
    mockDb.feedbackTicket.update.mockResolvedValue({
      id: 'tk1',
      status: 'resolved',
      resolvedAt: new Date('2026-04-26T12:00:00.000Z'),
      assignedBarberId: 'barber1',
    });
    mockDb.visit.update.mockResolvedValue({});
    mockDb.smsLog.create.mockResolvedValue({});
    (sendSms as jest.Mock).mockResolvedValue({ sid: 'SMCOMPLETE', status: 'queued' });

    const res = await completeFeedback(
      makeCompleteRequest({ notes: 'Leveled both sides', customerHappy: true }),
      routeParams
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ticket.status).toBe('resolved');
    expect(mockDb.visit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v1' },
        data: expect.objectContaining({ reminderScheduledAt: expect.any(Date), cutRating: 'positive' }),
      })
    );
    expect(sendSms).toHaveBeenCalledWith('+447700000011', expect.stringContaining('All sorted'));
  });
});

// ---------------------------------------------------------------------------
// GET /api/feedback
// ---------------------------------------------------------------------------

describe('GET /api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(OWNER_SESSION);
  });

  it('returns 401 when not authenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await getFeedback(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns feedback list for the shop', async () => {
    mockDb.feedback.findMany.mockResolvedValue([
      { id: 'fb1', rating: 'negative', issue: 'Too short', sourceType: 'in_shop', createdAt: new Date(), customer: { id: 'c1', name: 'Ahmed', phone: '+44' }, visit: { id: 'v1', visitedAt: new Date(), barber: { id: 'b1', name: 'Jake' } }, ticket: { id: 'tk1', status: 'unresolved', resolution: null, assignedBarberId: null, preferredDate: null, followUpDate: null, resolvedAt: null, createdAt: new Date() } },
    ]);

    const res = await getFeedback(makeGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].rating).toBe('negative');
  });

  it('passes status filter to query', async () => {
    mockDb.feedback.findMany.mockResolvedValue([]);
    await getFeedback(makeGetRequest({ status: 'unresolved' }));

    expect(mockDb.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ticket: { status: 'unresolved' } }) })
    );
  });

  it('passes rating filter to query', async () => {
    mockDb.feedback.findMany.mockResolvedValue([]);
    await getFeedback(makeGetRequest({ rating: 'negative' }));

    expect(mockDb.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ rating: 'negative' }) })
    );
  });

  it('returns 400 for invalid status param', async () => {
    const res = await getFeedback(makeGetRequest({ status: 'banana' }));
    expect(res.status).toBe(400);
  });

  it('caps limit at 100', async () => {
    mockDb.feedback.findMany.mockResolvedValue([]);
    await getFeedback(makeGetRequest({ limit: '999' }));

    expect(mockDb.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it('defaults limit to 10', async () => {
    mockDb.feedback.findMany.mockResolvedValue([]);
    await getFeedback(makeGetRequest());

    expect(mockDb.feedback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });
});
