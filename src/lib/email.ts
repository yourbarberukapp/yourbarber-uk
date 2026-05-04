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
      <p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;margin-bottom:1.5rem;">
        Your beta spot is confirmed. Sign in with Google to set up your shop — takes about 30 seconds.
      </p>
      <a href="${BASE_URL}/signup"
        style="display:inline-block;background:#C8F135;color:#0A0A0A;padding:0.75rem 1.5rem;border-radius:4px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;font-size:0.9rem;margin-bottom:1.5rem;">
        Set up my shop →
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
