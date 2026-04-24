import { normalizePhone, buildCustomerWhereClause } from '@/lib/customerHelpers';

describe('normalizePhone', () => {
  it('strips spaces and dashes', () => {
    expect(normalizePhone('07700 900 001')).toBe('07700900001');
    expect(normalizePhone('07700-900-001')).toBe('07700900001');
  });
  it('leaves digit-only strings unchanged', () => {
    expect(normalizePhone('07700900001')).toBe('07700900001');
  });
});

describe('buildCustomerWhereClause', () => {
  it('searches by phone when query is numeric', () => {
    const where = buildCustomerWhereClause('shop1', '07700');
    expect(where).toMatchObject({ shopId: 'shop1', phone: { contains: '07700' } });
  });
  it('searches by name when query is alphabetic', () => {
    const where = buildCustomerWhereClause('shop1', 'Jake');
    expect(where).toMatchObject({ shopId: 'shop1', name: { contains: 'Jake', mode: 'insensitive' } });
  });
});
