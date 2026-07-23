import http2 from 'http2';

const APNS_HOST = 'api.push.apple.com';

function getCerts() {
  const certPem = process.env.APPLE_PASS_CERT_PEM;
  const keyPem = process.env.APPLE_PASS_KEY_PEM;
  if (!certPem || !keyPem) return null;
  return {
    cert: certPem.replace(/\\n/g, '\n'),
    key: keyPem.replace(/\\n/g, '\n'),
  };
}

/** Sends a silent APNs wake-up push for a pass serial number to a single device push token. */
async function pushOne(pushToken: string): Promise<void> {
  const certs = getCerts();
  if (!certs) return; // No Apple cert configured — no-op, matches dev/unsigned-pass fallback elsewhere.

  return new Promise((resolve) => {
    const client = http2.connect(`https://${APNS_HOST}`, {
      cert: certs.cert,
      key: certs.key,
    });

    client.on('error', () => resolve());

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      'apns-topic': process.env.APPLE_PASS_TYPE_ID || 'pass.uk.yourbarber.client',
      'apns-push-type': 'background',
      'apns-priority': '5',
    });

    req.setEncoding('utf8');
    req.on('response', () => {
      // PassKit pushes have an empty JSON payload — content is irrelevant, this just wakes the device.
    });
    req.on('end', () => {
      client.close();
      resolve();
    });
    req.on('error', () => {
      client.close();
      resolve();
    });

    req.end(JSON.stringify({}));
  });
}

/** Wakes every registered device for a customer's pass so Wallet re-fetches the latest pass data. */
export async function pushPassUpdate(pushTokens: string[]): Promise<void> {
  await Promise.all(pushTokens.map(pushOne));
}
