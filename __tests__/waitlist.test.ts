import { NextRequest } from 'next/server';

const mockDb = {
  walkIn: {
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({ db: mockDb }));
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));

import { DELETE } from '@/app/api/waitlist/[id]/route';
import { auth } from '@/lib/auth';

describe('DELETE /api/waitlist/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { shopId: 'shop1' },
    });
  });

  it('deletes a walk-in only after checking it belongs to the current shop', async () => {
    mockDb.walkIn.findFirst.mockResolvedValue({ id: 'walk1', shopId: 'shop1' });
    mockDb.walkIn.delete.mockResolvedValue({ id: 'walk1' });

    const res = await DELETE(
      new NextRequest('http://localhost/api/waitlist/walk1', { method: 'DELETE' }),
      { params: { id: 'walk1' } }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.walkIn.findFirst).toHaveBeenCalledWith({ where: { id: 'walk1', shopId: 'shop1' } });
    expect(mockDb.walkIn.delete).toHaveBeenCalledWith({ where: { id: 'walk1' } });
  });

  it('does not delete a walk-in from another shop', async () => {
    mockDb.walkIn.findFirst.mockResolvedValue(null);

    const res = await DELETE(
      new NextRequest('http://localhost/api/waitlist/walk-other', { method: 'DELETE' }),
      { params: { id: 'walk-other' } }
    );

    expect(res.status).toBe(404);
    expect(mockDb.walkIn.delete).not.toHaveBeenCalled();
  });
});
