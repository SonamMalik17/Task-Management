// Abstraction over Socket.IO. Use-cases publish events without knowing the
// transport — keeps the realtime adapter swappable (e.g., Redis pub/sub later).
export interface IRealtimeGateway {
  emitToBoard(boardId: string, event: string, payload: unknown): void;
  emitToUser(userId: string, event: string, payload: unknown): void;
}
