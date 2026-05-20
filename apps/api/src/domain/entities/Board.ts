import type { BoardMember } from '@ai-task/shared';

export interface BoardProps {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: BoardMember[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Board {
  constructor(public readonly props: BoardProps) {}

  get id(): string {
    return this.props.id;
  }

  hasMember(userId: string): boolean {
    return this.props.ownerId === userId || this.props.members.some((m) => m.userId === userId);
  }

  canEdit(userId: string): boolean {
    if (this.props.ownerId === userId) return true;
    const member = this.props.members.find((m) => m.userId === userId);
    return Boolean(member && (member.role === 'admin' || member.role === 'member'));
  }

  toJSON() {
    return { ...this.props };
  }
}
