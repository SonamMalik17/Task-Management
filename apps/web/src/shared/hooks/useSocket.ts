'use client';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAppSelector } from '@/store/store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

// Returns a singleton socket scoped to the current session token. Reconnects
// when the token changes; disconnects on sign-out.
export function useSocket(): Socket | null {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      ref.current?.disconnect();
      ref.current = null;
      return;
    }
    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    ref.current = socket;
    return () => {
      socket.disconnect();
      ref.current = null;
    };
  }, [accessToken]);

  return ref.current;
}
