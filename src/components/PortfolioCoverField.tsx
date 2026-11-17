"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export function PortfolioCoverField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function clear() {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm text-text">Обложка кейса</label>
      <input
        ref={inputRef}
        type="file"
        name="cover"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) {
            clear();
            return;
          }
          if (preview) URL.revokeObjectURL(preview);
          setFileName(file.name);
          setPreview(URL.createObjectURL(file));
        }}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="aspect-[16/10] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-[#120e0a]/75 px-3 py-2 backdrop-blur-sm">
            <span className="truncate text-xs text-[#f6f1e8]">{fileName}</span>
            <button
              type="button"
              onClick={clear}
              className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted hover:text-text"
              aria-label="Убрать картинку"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-panel-soft/40 px-4 py-10 text-center transition hover:border-accent/45 hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border border-border text-accent">
            <ImagePlus size={20} />
          </span>
          <span className="text-sm font-medium text-text">Загрузить картинку</span>
          <span className="text-xs text-muted">JPG, PNG, WebP · до 12 МБ</span>
        </button>
      )}
      <p className="mt-1.5 text-xs text-muted">Необязательно · будет превью на карточке кейса</p>
    </div>
  );
}
