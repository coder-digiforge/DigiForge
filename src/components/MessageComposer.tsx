"use client";

import { useRef, useState } from "react";
import { Paperclip, SendHorizonal, X } from "lucide-react";
import { useUnreadMessages } from "@/components/UnreadMessagesProvider";

const MAX_FILE_MB = 12;

export function MessageComposer({
  threadId,
  onSent,
}: {
  threadId: string;
  onSent?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasText, setHasText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { refresh } = useUnreadMessages();

  function clearFile() {
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const canSend = hasText || Boolean(fileName);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !canSend) return;
    setError(null);
    setPending(true);
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const res = await fetch("/api/messages/send", { method: "POST", body: data });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Не удалось отправить");
      }
      setHasText(false);
      clearFile();
      if (inputRef.current) inputRef.current.value = "";
      onSent?.();
      void refresh();
      window.dispatchEvent(new CustomEvent("df:messages-changed", { detail: { threadId } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="border-t border-border/60 bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
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
        <input
          ref={inputRef}
          name="body"
          type="text"
          autoComplete="off"
          enterKeyHint="send"
          placeholder="Сообщение"
          className="min-h-10 min-w-0 flex-1 rounded-full border border-border bg-panel-soft px-4 py-2.5 text-[15px] text-text outline-none placeholder:text-muted focus:border-accent/50"
          onChange={(e) => setHasText(e.target.value.trim().length > 0)}
          disabled={pending}
        />
        <button
          type="submit"
          disabled={!canSend || pending}
          className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[#1a120c] transition enabled:active:scale-95 disabled:opacity-40"
          aria-label="Отправить"
        >
          <SendHorizonal size={18} strokeWidth={2.25} />
        </button>
      </div>
    </form>
  );
}
