import type { User } from '../entities/User.js';

// Repository interfaces use plain types — no Mongoose models leak through.
// This is the dependency inversion principle: the inner layer (application)
// depends on this abstraction; the outer layer (infrastructure) implements it.
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User>;
  update(id: string, patch: Partial<{ name: string; avatarUrl: string | null }>): Promise<User>;
}
