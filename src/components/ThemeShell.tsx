"use client";

import { useEffect, useState } from "react";

export type CabinetTheme = "dark" | "light";

export const CABINET_THEME_KEY = "df-cabinet-theme";
export const CABINET_THEME_EVENT = "df-cabinet-theme";

export function readCabinetTheme(): CabinetTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(CABINET_THEME_KEY);
  return stored === "light" ? "light" : "dark";
}

export function writeCabinetTheme(theme: CabinetTheme) {
  window.localStorage.setItem(CABINET_THEME_KEY, theme);
  window.dispatchEvent(
    new CustomEvent<CabinetTheme>(CABINET_THEME_EVENT, { detail: theme }),
  );
}

export function ThemeShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [theme, setTheme] = useState<CabinetTheme>("dark");

  useEffect(() => {
    setTheme(readCabinetTheme());
    const onTheme = (e: Event) => {
      const detail = (e as CustomEvent<CabinetTheme>).detail;
      if (detail === "light" || detail === "dark") setTheme(detail);
    };
    window.addEventListener(CABINET_THEME_EVENT, onTheme);
    return () => window.removeEventListener(CABINET_THEME_EVENT, onTheme);
  }, []);

  return (
    <div data-theme={theme} className={className}>
      {children}
    </div>
  );
}
