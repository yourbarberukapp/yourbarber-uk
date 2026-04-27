export async function sendSms(to: string, body: string): Promise<{ messageId: string; status: string }> {
  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    console.log('--- DEV SMS BYPASS ---');
    console.log(`To: ${to}`);
    console.log(`Body: ${body}`);
    console.log('----------------------');
    return { messageId: 'dev-id', status: 'sent' };
  }

  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.VONAGE_API_KEY,
      api_secret: process.env.VONAGE_API_SECRET,
      from: process.env.VONAGE_FROM ?? 'YourBarber',
      to: to.replace(/^\+/, ''),
      text: body,
    }),
  });
  const data = await res.json();
  const msg = data.messages?.[0];
  if (!msg || msg.status !== '0') {
    throw new Error(`Vonage error: ${msg?.['error-text'] ?? 'Unknown error'}`);
  }
  return { messageId: msg['message-id'], status: 'sent' };
}
