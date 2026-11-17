"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

export function AvatarField({
  currentUrl,
  name,
}: {
  currentUrl?: string | null;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? currentUrl ?? null;

  function clear() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) {
            setPreview(null);
            return;
          }
          if (preview) URL.revokeObjectURL(preview);
          setPreview(URL.createObjectURL(file));
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-border bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] transition hover:border-accent/50"
        aria-label="Загрузить аватар"
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-accent">{name.slice(0, 1)}</span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100">
          <Camera size={20} className="text-[#f6f1e8]" />
        </span>
      </button>

      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-medium text-accent hover:underline"
        >
          {shown ? "Сменить фото" : "Добавить фото"}
        </button>
        {preview && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-muted hover:text-text"
          >
            <X size={12} />
            Отмена
          </button>
        )}
      </div>
      <p className="text-center text-[11px] text-muted">JPG, PNG, WebP · до 12 МБ</p>
    </div>
  );
}
