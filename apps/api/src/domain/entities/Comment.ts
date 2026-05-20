export interface CommentProps {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Comment {
  constructor(public readonly props: CommentProps) {}

  get id(): string {
    return this.props.id;
  }

  toJSON() {
    return { ...this.props };
  }
}
