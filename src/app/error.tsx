"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ErrorState";

export default function AppError({
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
    <div>
      <ErrorState
        code="500"
        title="Что-то сломалось"
        description="Мы уже смотрим. Попробуйте ещё раз через минуту."
        imageSrc="/errors/mascot-500.png"
        imageAlt="Персонаж чинит систему"
        primary={{ href: "/", label: "На главную" }}
        secondary={{ href: "/support", label: "Написать в поддержку" }}
      />
      <div className="fixed bottom-6 left-1/2 z-10 -translate-x-1/2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-border bg-panel-soft px-4 py-2 text-xs text-muted transition hover:border-accent/40 hover:text-accent"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
