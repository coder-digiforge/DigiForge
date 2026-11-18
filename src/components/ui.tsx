import Link from "next/link";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export function Logo({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex flex-col leading-none transition-opacity duration-300 hover:opacity-90"
    >
      <span className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-text transition-colors duration-300 group-hover:text-accent">
        DigiForge
      </span>
      {!compact && (
        <span className="mt-1 text-[10px] tracking-wide text-muted">фриланс-биржа</span>
      )}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      className={`df-btn ${variant === "primary" ? "df-btn-primary" : "df-btn-ghost"} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}: {
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      className={`df-btn ${variant === "primary" ? "df-btn-primary" : "df-btn-ghost"} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`df-input ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return <textarea ref={ref} className={`df-input min-h-28 ${className}`} {...props} />;
  },
);

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`df-panel ${className}`}>{children}</div>;
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="df-chip">{children}</span>;
}

export function PageTitle({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6 sm:gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-syne)] text-[24px] font-bold leading-tight tracking-[-0.02em] text-[#f5e6c8] sm:text-[28px] sm:leading-[34px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm font-medium text-muted">{subtitle}</p>
        )}
      </div>
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-border px-6 py-10 text-center">
      <p className="text-text">{title}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="df-panel p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
