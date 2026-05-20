'use client';
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/store';
import { baseApi } from '@/store/baseApi';
import { useSocket } from '@/shared/hooks/useSocket';

// Subscribe to board-scoped socket events and invalidate the board cache on
// any change. Cheap and correct — RTK Query refetches and the UI re-renders.
// A more advanced approach would surgically patch the cache; skipped for clarity.
export function useBoardRealtime(boardId: string | undefined) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!socket || !boardId) return;
    socket.emit('board:join', boardId);

    const invalidate = () => {
      dispatch(baseApi.util.invalidateTags([{ type: 'Board', id: boardId }]));
    };
    socket.on('task:created', invalidate);
    socket.on('task:updated', invalidate);
    socket.on('task:moved', invalidate);
    socket.on('task:deleted', invalidate);

    return () => {
      socket.emit('board:leave', boardId);
      socket.off('task:created', invalidate);
      socket.off('task:updated', invalidate);
      socket.off('task:moved', invalidate);
      socket.off('task:deleted', invalidate);
    };
  }, [socket, boardId, dispatch]);
}
