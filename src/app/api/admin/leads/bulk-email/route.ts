import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Resend } from 'resend';

const ADMIN_KEY = process.env.ADMIN_KEY || 'a3024f4c07e01ec4';
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'YourBarber <onboarding@resend.dev>';

function wrap(body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0A0A0A;">
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#0A0A0A;color:white;">
  <p style="font-family:sans-serif;font-size:1.4rem;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;margin:0 0 1.5rem;">
    Your<span style="color:#C8F135;">Barber</span>
  </p>
  ${body}
  <p style="color:rgba(255,255,255,0.2);font-size:0.7rem;margin-top:2rem;border-top:1px solid rgba(255,255,255,0.06);padding-top:1rem;">
    YourBarber · yourbarber.uk
  </p>
</div></body></html>`;
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-key') !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ids, subject, message } = await req.json();
  if (!ids?.length || !subject || !message) {
    return NextResponse.json({ error: 'ids, subject and message required' }, { status: 400 });
  }

  const leads = await db.demoLead.findMany({ where: { id: { in: ids } } });

  const results = await Promise.allSettled(
    leads.map(lead =>
      resend.emails.send({
        from: FROM,
        to: lead.email,
        subject,
        html: wrap(`
          <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:1rem;">
            Hi ${lead.name.split(' ')[0]},
          </p>
          <div style="color:rgba(255,255,255,0.75);font-size:0.95rem;line-height:1.7;white-space:pre-wrap;">${message}</div>
        `),
      })
    )
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  return NextResponse.json({ sent, failed });
}
