import { Bookmark } from "lucide-react";
import { toggleFavoriteAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui";

export function FavoriteButton({
  targetType,
  targetId,
  favorited,
  returnTo,
}: {
  targetType: "project" | "freelancer";
  targetId: string;
  favorited: boolean;
  returnTo: string;
}) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button
        type="submit"
        variant="ghost"
        className={`!rounded-full !px-3 !py-2 !text-sm ${
          favorited ? "!border-accent/45 !text-accent" : ""
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <Bookmark size={14} className={favorited ? "fill-accent" : ""} />
          {favorited ? "В избранном" : "В избранное"}
        </span>
      </Button>
    </form>
  );
}
