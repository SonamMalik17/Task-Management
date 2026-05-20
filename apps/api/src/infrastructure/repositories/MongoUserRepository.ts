import { User, type UserProps } from '../../domain/entities/User.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { UserModel } from '../db/models/UserModel.js';

// Mapper isolated at the persistence boundary — domain entities never know
// about Mongoose documents.
function toEntity(doc: any): User {
  const props: UserProps = {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    passwordHash: doc.passwordHash,
    avatarUrl: doc.avatarUrl ?? null,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return new User(props);
}

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return doc ? toEntity(doc) : null;
  }

  async create(input: { email: string; name: string; passwordHash: string }): Promise<User> {
    const doc = await UserModel.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
    });
    return toEntity(doc.toObject());
  }

  async update(
    id: string,
    patch: Partial<{ name: string; avatarUrl: string | null }>,
  ): Promise<User> {
    const doc = await UserModel.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!doc) throw new NotFoundError('User', id);
    return toEntity(doc);
  }
}
