import bcrypt from 'bcryptjs';
import type { IPasswordHasher } from '../../domain/services/IPasswordHasher.js';

// 12 rounds is a 2025-era balance between cost (~250ms on commodity hardware)
// and resistance. Higher means slower logins; lower means easier to brute-force.
const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
