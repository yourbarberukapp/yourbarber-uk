import { NextRequest } from 'next/server';

const mockDb = {
  shop: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({ db: mockDb }));
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
  }),
}));

import { GET } from '@/app/api/qr/arrive/[slug]/route';

describe('GET /api/qr/arrive/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.shop.findUnique.mockResolvedValue({ name: 'Ben J Barbers', logoUrl: null });
  });

  it('returns a downloadable PDF poster when type=pdf', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/qr/arrive/benj-barbers?format=portrait&type=pdf'),
      { params: { slug: 'benj-barbers' } }
    );

    const body = Buffer.from(await res.arrayBuffer()).toString('ascii', 0, 5);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toContain('YourBarber-Poster-benj-barbers.pdf');
    expect(body).toBe('%PDF-');
  });

  it('keeps the SVG output available for the settings preview', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/qr/arrive/benj-barbers?size=600&format=portrait'),
      { params: { slug: 'benj-barbers' } }
    );

    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/svg+xml');
    expect(body).toContain('SCAN TO CHECK IN');
  });

  it('can encode the demo walk-in arrival URL', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/qr/arrive/benj-barbers?size=600&format=portrait&target=demo-walkin'),
      { params: { slug: 'benj-barbers' } }
    );

    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('SCAN TO CHECK IN');
    expect(body).toContain('<rect x=');
  });
});
