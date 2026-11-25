"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#120d0a",
          color: "#f5e6c8",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            textAlign: "center",
            borderRadius: 28,
            border: "1px solid rgba(226,178,116,0.35)",
            background: "rgba(28,20,16,0.92)",
            padding: "40px 32px",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, color: "#e0a86b" }}>500</div>
          <h1 style={{ margin: "12px 0 0", fontSize: 28 }}>Что-то сломалось</h1>
          <p style={{ margin: "12px 0 0", color: "#b3a89a", fontSize: 15 }}>
            Мы уже смотрим. Попробуйте ещё раз через минуту.
          </p>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <a
              href="/"
              style={{
                borderRadius: 999,
                background: "#e0a86b",
                color: "#120d0a",
                padding: "12px 22px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              На главную
            </a>
            <button
              type="button"
              onClick={reset}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(224,168,107,0.45)",
                background: "transparent",
                color: "#e0a86b",
                padding: "12px 22px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
