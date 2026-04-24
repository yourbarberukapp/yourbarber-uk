export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

export function buildCustomerWhereClause(shopId: string, query: string) {
  const normalized = normalizePhone(query);
  const looksLikePhone = /^[\d\+]+$/.test(normalized) && normalized.length >= 3;
  if (looksLikePhone) {
    return { shopId, phone: { contains: normalized } };
  }
  return { shopId, name: { contains: query, mode: 'insensitive' as const } };
}
