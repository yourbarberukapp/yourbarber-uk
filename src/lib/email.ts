import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://yourbarber.uk';
const ADMIN_EMAIL = 'info@thornes.org.uk';
const FROM = 'YourBarber <onboarding@resend.dev>';

// ─── Internal helper ───────────────────────────────────────────────────────

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

// ─── Admin: new beta signup ────────────────────────────────────────────────

export async function sendBetaSignupNotification({
  name, email, phone, shopName, challenge,
}: {
  name: string; email: string; phone: string; shopName: string; challenge: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New beta signup: ${shopName || name}`,
    html: wrap(`
      <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
        <tr><td style="color:rgba(255,255,255,0.4);padding:0.4rem 0;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;width:70px;">Name</td><td style="color:white;padding:0.4rem 0;">${name}</td></tr>
        <tr><td style="color:rgba(255,255,255,0.4);padding:0.4rem 0;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;">Email</td><td style="padding:0.4rem 0;"><a href="mailto:${email}" style="color:#C8F135;text-decoration:none;">${email}</a></td></tr>
        <tr><td style="color:rgba(255,255,255,0.4);padding:0.4rem 0;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;">Phone</td><td style="padding:0.4rem 0;"><a href="tel:${phone}" style="color:#C8F135;text-decoration:none;">${phone}</a></td></tr>
        <tr><td style="color:rgba(255,255,255,0.4);padding:0.4rem 0;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;">Shop</td><td style="color:white;padding:0.4rem 0;">${shopName || '—'}</td></tr>
        ${challenge ? `<tr><td style="color:rgba(255,255,255,0.4);padding:0.4rem 0;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;vertical-align:top;">Problem</td><td style="color:rgba(255,255,255,0.8);padding:0.4rem 0;font-style:italic;">"${challenge}"</td></tr>` : ''}
      </table>
      <a href="https://wa.me/44${phone.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`Hi ${name.split(' ')[0]}, it's Luke from YourBarber — you just signed up for the beta. Sign in with Google to get your shop live: ${BASE_URL}/signup`)}"
        style="display:inline-block;background:#25D366;color:white;padding:0.6rem 1.25rem;border-radius:6px;font-weight:700;text-decoration:none;font-size:0.85rem;margin-right:0.5rem;">
        WhatsApp
      </a>
      <a href="${BASE_URL}/admin/a3024f4c07e01ec4"
        style="display:inline-block;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);padding:0.6rem 1.25rem;border-radius:6px;font-weight:700;text-decoration:none;font-size:0.85rem;">
        View all signups
      </a>
    `),
  });
}

// ─── User: beta spot confirmed ─────────────────────────────────────────────

export async function sendBetaConfirmationEmail({
  name, email,
}: {
  name: string; email: string;
}) {
  const firstName = name.split(' ')[0];
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're in the YourBarber beta, ${firstName}`,
    html: wrap(`
      <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:1.25rem;">
        Hi ${firstName},
      </p>
      <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:1rem;">
        You&apos;re in. Sign in with Google to set up your shop — takes about 30 seconds.
      </p>
      <p style="color:rgba(255,200,50,0.85);font-size:0.85rem;line-height:1.6;margin-bottom:1.5rem;padding:0.75rem 1rem;background:rgba(255,200,50,0.08);border-left:3px solid rgba(255,200,50,0.4);border-radius:0 4px 4px 0;">
        <strong>Important:</strong> sign in with the Google account for this email address — <strong>${firstName.length > 0 ? '' : ''}</strong> the same address this email arrived at. Using a different Google account won&apos;t work.
      </p>
      <a href="${BASE_URL}/login"
        style="display:inline-block;background:#C8F135;color:#0A0A0A;padding:0.75rem 1.5rem;border-radius:4px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;font-size:0.9rem;margin-bottom:1.5rem;">
        Sign in and set up my shop →
      </a>
      <p style="color:rgba(255,255,255,0.4);font-size:0.85rem;line-height:1.6;">
        After the beta: £20/month, locked in for life if you stay on.
      </p>
    `),
  });
}

// ─── User: shop is live ────────────────────────────────────────────────────

export async function sendSetupCompleteEmail({
  name, email, shopName, shopSlug,
}: {
  name: string; email: string; shopName: string; shopSlug: string;
}) {
  const firstName = name.split(' ')[0];
  const arriveUrl = `${BASE_URL}/arrive/${shopSlug}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${shopName} is live on YourBarber`,
    html: wrap(`
      <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:1.25rem;">
        Hi ${firstName},
      </p>
      <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:0.75rem;">
        <strong style="color:white;">${shopName}</strong> is set up and ready to go.
      </p>
      <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">
        Your shop's check-in link is below. Print the QR code from your dashboard and put it on the wall — clients scan it and join your queue instantly.
      </p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:1rem 1.25rem;margin-bottom:1.5rem;">
        <p style="color:rgba(255,255,255,0.3);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 0.4rem;">Your check-in link</p>
        <a href="${arriveUrl}" style="color:#C8F135;font-size:0.9rem;text-decoration:none;font-family:monospace;">${arriveUrl}</a>
      </div>
      <a href="${BASE_URL}/dashboard"
        style="display:inline-block;background:#C8F135;color:#0A0A0A;padding:0.75rem 1.5rem;border-radius:4px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;font-size:0.9rem;">
        Open my dashboard →
      </a>
    `),
  });
}

// ─── Barber: 4 AM daily brief ─────────────────────────────────────────────

type DailyAppointment = {
  scheduledAt: Date;
  duration: number;
  notes: string | null;
  status: string;
  customer: { name: string | null; phone: string };
  service: { name: string } | null;
  lastCut: {
    visitedAt: Date;
    cutDetails: unknown;
    notes: string | null;
  } | null;
};

export async function sendDailyBriefEmail({
  barberName, barberEmail, shopName, appointments,
}: {
  barberName: string;
  barberEmail: string;
  shopName: string;
  appointments: DailyAppointment[];
}) {
  const firstName = barberName.split(' ')[0];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const rows = appointments.map(a => {
    const time = new Date(a.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const clientName = a.customer.name || 'Unknown';
    const service = a.service?.name || '—';
    const passport = a.lastCut
      ? (() => {
          const details = a.lastCut.cutDetails as Record<string, string> | null;
          const parts: string[] = [];
          if (details?.style) parts.push(details.style);
          if (details?.top) parts.push(`Top: ${details.top}`);
          if (details?.sides) parts.push(`Sides: ${details.sides}`);
          if (a.lastCut.notes) parts.push(a.lastCut.notes);
          return parts.length ? parts.join(' · ') : 'No notes';
        })()
      : 'First visit';

    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
        <td style="padding:0.75rem 0;color:#C8F135;font-family:sans-serif;font-size:0.85rem;font-weight:700;white-space:nowrap;vertical-align:top;">${time}</td>
        <td style="padding:0.75rem 0 0.75rem 1rem;vertical-align:top;">
          <div style="color:white;font-size:0.9rem;font-weight:700;font-family:sans-serif;">${clientName}</div>
          <div style="color:rgba(255,255,255,0.4);font-size:0.75rem;font-family:sans-serif;margin-top:2px;">${service} · ${a.duration} min</div>
          <div style="color:rgba(255,255,255,0.5);font-size:0.75rem;font-family:sans-serif;margin-top:4px;font-style:italic;">${passport}</div>
        </td>
      </tr>`;
  }).join('');

  await resend.emails.send({
    from: FROM,
    to: barberEmail,
    subject: `Your day at ${shopName} — ${today}`,
    html: wrap(`
      <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:0.5rem;">
        Morning ${firstName},
      </p>
      <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:1.5rem;">
        You have <strong style="color:white;">${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}</strong> today at ${shopName}.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
        ${rows}
      </table>
      <a href="${BASE_URL}/dashboard/appointments"
        style="display:inline-block;background:#C8F135;color:#0A0A0A;padding:0.65rem 1.25rem;border-radius:4px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;font-size:0.8rem;">
        Open schedule →
      </a>
      <p style="color:rgba(255,255,255,0.2);font-size:0.7rem;margin-top:1.5rem;">
        Sent at 4 AM so you have it before you leave the house.
      </p>
    `),
  });
}

// ─── Barber: password reset ────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your YourBarber password',
    html: wrap(`
      <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:1.5rem;">
        We received a request to reset your password. Click below to set a new one. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}"
        style="display:inline-block;background:#C8F135;color:#0A0A0A;padding:0.75rem 1.5rem;border-radius:4px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;font-size:0.9rem;margin-bottom:1.5rem;">
        Reset password
      </a>
      <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;">
        If you didn't request this, ignore this email. Your password won't change.
      </p>
    `),
  });
}
