"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui";

const MAX_WORDS = 150;

function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function PortfolioSummaryField({
  defaultValue = "",
}: {
  defaultValue?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const words = countWords(value);
  const over = words > MAX_WORDS;

  return (
    <div>
      <label className="mb-1.5 block text-sm text-muted">
        Описание работы <span className="text-accent">*</span>
      </label>
      <Textarea
        ref={ref}
        name="summary"
        required
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          const n = countWords(next);
          e.target.setCustomValidity(
            n > MAX_WORDS ? `Не больше ${MAX_WORDS} слов` : "",
          );
        }}
        placeholder="Что сделали, какой результат, стек и сроки. Можно добавить #теги прямо в тексте."
        className="!min-h-40 w-full !rounded-xl !border !border-border !bg-[#16110e] focus:!border-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
      />
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Опишите работу так, чтобы заказчик сразу понял ценность. Используйте{" "}
        <span className="text-accent">#хештеги</span> для тегов. Контакты и ссылки на
        мессенджеры в описании запрещены.
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted">До {MAX_WORDS} слов</span>
        <span className={over ? "font-semibold text-danger" : "text-muted"}>
          {words} / {MAX_WORDS}
        </span>
      </div>
      {over && (
        <p className="mt-1 text-xs text-danger">Сократите текст до {MAX_WORDS} слов</p>
      )}
    </div>
  );
}
