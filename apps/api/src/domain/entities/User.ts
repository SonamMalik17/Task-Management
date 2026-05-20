import type { UserRole } from '@ai-task/shared';

// Domain entities are PLAIN data + behavior — no Mongoose, no DTOs, no JSON.
// The persistence layer maps to/from this shape; the HTTP layer serializes it.
export interface UserProps {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(public readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  // Strip secrets when crossing the use-case → HTTP boundary.
  toPublicJSON() {
    const { passwordHash: _omit, ...rest } = this.props;
    return rest;
  }
}
