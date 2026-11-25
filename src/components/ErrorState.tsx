import Image from "next/image";
import { ButtonLink } from "@/components/ui";

export type ErrorStateProps = {
  code: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

export function ErrorState({
  code,
  title,
  description,
  imageSrc,
  imageAlt,
  primary,
  secondary,
}: ErrorStateProps) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#120d0a] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(224,168,107,0.12),transparent_55%)]"
      />
      <div className="relative w-full max-w-[520px] rounded-[28px] border border-[rgba(226,178,116,0.35)] bg-[rgba(28,20,16,0.88)] px-6 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-[440px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={880}
            height={496}
            className="mx-auto h-auto w-full object-contain"
            priority
          />
        </div>
        <div className="mt-2 font-[family-name:var(--font-syne)] text-[64px] font-bold leading-none tracking-tight text-accent md:text-[72px]">
          {code}
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-[24px] font-bold leading-tight text-[#f5e6c8] md:text-[28px]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-[380px] text-[15px] font-medium leading-relaxed text-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={primary.href} className="!rounded-full !px-[22px] !py-3 !text-sm">
            {primary.label}
          </ButtonLink>
          <ButtonLink
            href={secondary.href}
            variant="ghost"
            className="!rounded-full !border-[rgba(226,178,116,0.45)] !px-[22px] !py-3 !text-sm !text-accent"
          >
            {secondary.label}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
