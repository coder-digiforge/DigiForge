import { addReviewAction } from "@/app/actions/marketplace";
import { Button, Textarea } from "@/components/ui";

export function ReviewForm({
  dealId,
  toUserId,
  toName,
}: {
  dealId: string;
  toUserId: string;
  toName: string;
}) {
  return (
    <form action={addReviewAction} className="mt-3 space-y-3 rounded-xl border border-border p-4">
      <input type="hidden" name="dealId" value={dealId} />
      <input type="hidden" name="toUserId" value={toUserId} />
      <div className="text-sm font-semibold text-text">Отзыв о {toName}</div>
      <label className="block text-xs text-muted">
        Оценка
        <select name="rating" className="df-input mt-1" defaultValue="5">
          <option value="5">5 — отлично</option>
          <option value="4">4 — хорошо</option>
          <option value="3">3 — нормально</option>
          <option value="2">2 — слабо</option>
          <option value="1">1 — плохо</option>
        </select>
      </label>
      <label className="block text-xs text-muted">
        Комментарий
        <Textarea
          name="text"
          required
          className="mt-1"
          placeholder="Как прошла работа…"
        />
      </label>
      <Button type="submit" className="!rounded-full !text-sm">
        Оставить отзыв
      </Button>
    </form>
  );
}
