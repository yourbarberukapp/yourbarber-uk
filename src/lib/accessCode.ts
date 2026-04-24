import { db } from '@/lib/db';

// Unambiguous chars — no 0/O or 1/I confusion
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function generateUniqueAccessCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode();
    const existing = await db.customer.findUnique({ where: { accessCode: code } });
    if (!existing) return code;
  }
  throw new Error('Could not generate unique access code after 20 attempts');
}
