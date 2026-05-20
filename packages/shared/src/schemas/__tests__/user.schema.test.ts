import { LoginInputSchema, RegisterInputSchema } from '../user.schema';

describe('RegisterInputSchema', () => {
  it('requires letter + number in password', () => {
    expect(RegisterInputSchema.safeParse({ email: 'a@b.co', name: 'A', password: 'abcdefgh' }).success).toBe(false);
    expect(RegisterInputSchema.safeParse({ email: 'a@b.co', name: 'A', password: '12345678' }).success).toBe(false);
    expect(RegisterInputSchema.safeParse({ email: 'a@b.co', name: 'A', password: 'abcdefg1' }).success).toBe(true);
  });

  it('rejects bad emails', () => {
    expect(RegisterInputSchema.safeParse({ email: 'no-at-sign', name: 'A', password: 'abcdefg1' }).success).toBe(false);
  });
});

describe('LoginInputSchema', () => {
  it('requires email and password', () => {
    expect(LoginInputSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(LoginInputSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
});
