"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { sendMessageAction } from "@/app/actions/marketplace";
import { Button, Input } from "@/components/ui";

const MAX_FILE_MB = 12;

export function MessageComposer({ threadId }: { threadId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearFile() {
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form
      action={sendMessageAction}
      encType="multipart/form-data"
      className="border-t border-border bg-panel px-4 py-3 md:px-5"
      onSubmit={() => {
        setError(null);
        setTimeout(() => clearFile(), 0);
      }}
    >
      <input type="hidden" name="threadId" value={threadId} />

      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      {fileName && (
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-panel-soft px-3 py-1 text-xs text-text">
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

      <div className="flex w-full items-center gap-2">
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent"
          aria-label="Прикрепить файл"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip size={18} />
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
        <div
          className={`min-w-0 flex-1 rounded-full border transition-[border-color,box-shadow,background] duration-200 ${
            focused
              ? "border-accent bg-[#241c16] shadow-[0_0_0_3px_rgba(224,168,107,0.28)]"
              : "border-border bg-[#16110e]"
          }`}
        >
          <Input
            name="body"
            placeholder="Написать сообщение…"
            className="!min-w-0 !w-full !rounded-full !border-transparent !bg-transparent !text-[#f6f1e8] !caret-[#e0a86b] !outline-none focus:!border-transparent focus:!outline-none focus-visible:!outline-none focus:!ring-0 focus-visible:!ring-0"
            autoComplete="off"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ color: "#f6f1e8", WebkitTextFillColor: "#f6f1e8", caretColor: "#e0a86b" }}
          />
        </div>
        <Button type="submit" className="!h-11 !shrink-0 !rounded-full !px-4" aria-label="Отправить">
          <Send size={16} />
        </Button>
      </div>
    </form>
  );
}
