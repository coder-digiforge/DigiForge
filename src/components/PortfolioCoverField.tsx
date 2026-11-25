"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";

export function PortfolioCoverField({
  initialUrl,
}: {
  initialUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(
    initialUrl ? "Текущая обложка" : null,
  );
  const [dragging, setDragging] = useState(false);

  function clear() {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function applyFile(file: File | undefined) {
    if (!file) {
      clear();
      return;
    }
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="cover"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => applyFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-[#120e0a]/80 px-3 py-2.5 backdrop-blur-sm">
            <span className="truncate text-xs text-[#f6f1e8]">{fileName}</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-border bg-[#1a1511]/90 px-2.5 py-1 text-[11px] font-medium text-muted-2 hover:text-accent"
              >
                Заменить
              </button>
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
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            const dt = new DataTransfer();
            dt.items.add(file);
            if (inputRef.current) inputRef.current.files = dt.files;
            applyFile(file);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-9 text-center transition ${
            dragging
              ? "border-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
              : "border-border bg-panel-soft/30 hover:border-accent/45 hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
          }`}
        >
          <p className="text-sm font-medium text-text">
            Выберите файл или перетащите его сюда
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            До 12 МБ · лучше 4:3, например 1600×1200
          </p>
          <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#16110e] px-3.5 py-2 text-xs font-semibold text-muted-2">
            <Paperclip size={14} className="text-accent" />
            Загрузить вложение
          </span>
        </div>
      )}
    </div>
  );
}
