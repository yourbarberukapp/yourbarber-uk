import { randomInt } from 'crypto';
import { db } from '@/lib/db';

// Digits only — easy to read off a Wallet pass and type on a numeric keypad.
const CODE_LENGTH = 6;

function randomPasscode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

export async function generateUniqueOwnerPasscode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomPasscode();
    const existing = await db.barber.findUnique({ where: { ownerPasscode: code } });
    if (!existing) return code;
  }
  throw new Error('Could not generate unique owner passcode after 20 attempts');
}
