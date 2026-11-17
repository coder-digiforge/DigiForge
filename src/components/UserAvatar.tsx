export function UserAvatar({
  name,
  url,
  size = 40,
  className = "",
}: {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full border border-border bg-panel-soft ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" width={size} height={size} />
      ) : (
        <div
          className="grid h-full w-full place-items-center font-semibold text-accent"
          style={{ fontSize: Math.max(12, Math.round(size * 0.35)) }}
        >
          {name.slice(0, 1)}
        </div>
      )}
    </div>
  );
}
