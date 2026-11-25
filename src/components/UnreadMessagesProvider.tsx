"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playNewMessageSound } from "@/lib/message-sound";

type UnreadCtx = {
  unreadTotal: number;
  unreadByThread: Record<string, number>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<UnreadCtx>({
  unreadTotal: 0,
  unreadByThread: {},
  refresh: async () => {},
});

export function useUnreadMessages() {
  return useContext(Ctx);
}

export function UnreadMessagesProvider({
  initialTotal = 0,
  initialByThread = {},
  children,
}: {
  initialTotal?: number;
  initialByThread?: Record<string, number>;
  children: ReactNode;
}) {
  const [unreadTotal, setUnreadTotal] = useState(initialTotal);
  const [unreadByThread, setUnreadByThread] = useState(initialByThread);
  const prevTotal = useRef(initialTotal);
  const primed = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/live", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        unreadTotal?: number;
        unreadByThread?: Record<string, number>;
      };
      const next = data.unreadTotal ?? 0;
      if (primed.current && next > prevTotal.current) {
        playNewMessageSound();
      }
      primed.current = true;
      prevTotal.current = next;
      setUnreadTotal(next);
      setUnreadByThread(data.unreadByThread ?? {});
    } catch {
      // offline / transient
    }
  }, []);

  useEffect(() => {
    setUnreadTotal(initialTotal);
    setUnreadByThread(initialByThread);
    prevTotal.current = initialTotal;
  }, [initialTotal, initialByThread]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, 3500);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ unreadTotal, unreadByThread, refresh }),
    [unreadTotal, unreadByThread, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
