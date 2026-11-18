"use client";

import { useRef, useState } from "react";
import { Paperclip, SendHorizonal, X } from "lucide-react";
import { sendMessageAction } from "@/app/actions/marketplace";

const MAX_FILE_MB = 12;

export function MessageComposer({ threadId }: { threadId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasText, setHasText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearFile() {
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const canSend = hasText || Boolean(fileName);

  return (
    <form
      action={sendMessageAction}
      encType="multipart/form-data"
      className="border-t border-border/60 bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
      onSubmit={() => {
        setError(null);
        setHasText(false);
        setTimeout(() => {
          clearFile();
          if (inputRef.current) inputRef.current.value = "";
        }, 0);
      }}
    >
      <input type="hidden" name="threadId" value={threadId} />

      {error && <p className="mb-2 px-1 text-xs text-danger">{error}</p>}

      {fileName && (
        <div className="mb-2 flex items-center gap-2 px-1">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-panel-soft px-3 py-1.5 text-xs text-text">
            <Paperclip size={12} className="shrink-0 text-accent" />
            <span className="truncate">{fileName}</span>
            <button
              type="button"
              className="shrink-0 text-muted hover:text-text"
              aria-label="Убрать файл"
              onClick={clearFile}
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      <div className="flex w-full items-end gap-2">
        <button
          type="button"
          className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-accent transition active:scale-95"
          aria-label="Прикрепить файл"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip size={18} strokeWidth={2} />
        </button>
        <input
          ref={fileRef}
          type="file"
          name="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              clearFile();
              return;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
              setError(`Файл больше ${MAX_FILE_MB} МБ`);
              clearFile();
              return;
            }
            setError(null);
            setFileName(file.name);
          }}
        />

        <div className="min-w-0 flex-1 rounded-[22px] border border-border bg-[#16110e] px-3.5 py-2">
          <input
            ref={inputRef}
            name="body"
            placeholder="Сообщение"
            autoComplete="off"
            enterKeyHint="send"
            className="df-imessage-input w-full bg-transparent text-[16px] leading-5 text-text outline-none placeholder:text-muted"
            style={{ color: "var(--text)", WebkitTextFillColor: "var(--text)", caretColor: "var(--accent)" }}
            onChange={(e) => setHasText(e.target.value.trim().length > 0)}
          />
        </div>

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Отправить"
          className={`mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full transition active:scale-95 ${
            canSend
              ? "bg-[#0a84ff] text-white shadow-[0_0_16px_rgba(10,132,255,0.35)]"
              : "bg-panel-soft text-muted"
          }`}
        >
          <SendHorizonal size={16} strokeWidth={2.25} />
        </button>
      </div>
    </form>
  );
}
