import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../services/api';

export function useSocket(accessToken: string | null): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setSocket(null);
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [accessToken]);

  return socket;
}
