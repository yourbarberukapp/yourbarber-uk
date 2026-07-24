/**
 * Single source of truth for "is this shop's public microsite ready to show
 * real visitors". Used to gate /shop/[slug] today; reuse this (don't
 * duplicate the field checks) if a subscription paywall gates the microsite
 * later — that's the whole reason this lives as one function.
 */
export interface MicrositeCompletenessInput {
  address: string | null;
  phone: string | null;
  openingHours: unknown;
  coverPhotoUrl: string | null;
  /** Pass only active services — this just checks there's at least one. */
  services: unknown[];
}

export function isMicrositeComplete(shop: MicrositeCompletenessInput): boolean {
  return Boolean(
    shop.address &&
    shop.phone &&
    shop.openingHours &&
    shop.coverPhotoUrl &&
    shop.services.length > 0
  );
}
