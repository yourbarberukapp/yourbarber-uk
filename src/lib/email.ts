import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await resend.emails.send({
    from: 'noreply@yourbarber.uk',
    to,
    subject: 'Reset your YourBarber password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem; background: #0A0A0A; color: white; border-radius: 8px;">
        <h1 style="font-size: 1.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; margin-bottom: 1rem; color: white;">
          Your<span style="color: #C8F135;">Barber</span>
        </h1>
        <p style="color: rgba(255,255,255,0.7); margin-bottom: 1.5rem; line-height: 1.6;">
          We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #C8F135; color: #0A0A0A; padding: 0.75rem 1.5rem; border-radius: 4px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.9rem;">
          Reset password
        </a>
        <p style="color: rgba(255,255,255,0.3); font-size: 0.75rem; margin-top: 1.5rem;">
          If you did not request this, ignore this email. Your password will not change.
        </p>
      </div>
    `,
  });
}
