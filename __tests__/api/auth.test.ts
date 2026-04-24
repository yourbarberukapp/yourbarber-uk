import bcrypt from 'bcryptjs';

describe('credential validation', () => {
  it('accepts correct password', async () => {
    const hash = await bcrypt.hash('secret', 12);
    expect(await bcrypt.compare('secret', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await bcrypt.hash('secret', 12);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});
