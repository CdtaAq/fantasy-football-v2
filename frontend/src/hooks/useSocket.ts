import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(namespace = "/draft") {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:4000" + namespace, {
      path: "/socket.io"
    }) as any);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [namespace]);

  return socketRef.current;
}
