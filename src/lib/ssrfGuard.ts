import dns from 'dns/promises';
import net from 'net';

/**
 * Blocks fetches to loopback, private (RFC1918), link-local, and other
 * non-public address ranges. Used by the two logo-scraping endpoints
 * (scrape-website, scrape-image) which fetch a user-supplied external URL
 * server-side — without this, an owner could point either at an internal
 * service (e.g. a cloud metadata endpoint, or another container on the
 * same network) and read the response back through the app (SSRF).
 */
function isPublicAddress(address: string): boolean {
  const type = net.isIP(address);
  if (type === 4) {
    const [a, b] = address.split('.').map(Number);
    if (a === 127) return false; // loopback
    if (a === 10) return false; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
    if (a === 192 && b === 168) return false; // 192.168.0.0/16
    if (a === 169 && b === 254) return false; // link-local / cloud metadata
    if (a === 0) return false;
    return true;
  }
  if (type === 6) {
    const lower = address.toLowerCase();
    if (lower === '::1') return false; // loopback
    if (lower.startsWith('fe80:') || lower.startsWith('fe80::')) return false; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return false; // unique local (fc00::/7)
    if (lower.startsWith('::ffff:')) {
      // IPv4-mapped IPv6 — re-check the embedded v4 address.
      return isPublicAddress(lower.replace('::ffff:', ''));
    }
    return true;
  }
  return false;
}

/**
 * Resolves the hostname of `url` and returns true only if every resolved
 * address is public. Rejects on DNS failure (fail closed).
 */
export async function isSafeExternalUrl(url: URL): Promise<boolean> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  try {
    const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
    if (records.length === 0) return false;
    return records.every((r) => isPublicAddress(r.address));
  } catch {
    return false;
  }
}
