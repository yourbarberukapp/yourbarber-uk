import twilio from 'twilio';

export async function sendSms(to: string, body: string): Promise<{ sid: string; status: string }> {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
  const message = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body,
  });
  return { sid: message.sid, status: message.status };
}
