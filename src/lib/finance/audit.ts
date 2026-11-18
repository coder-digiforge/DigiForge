import type { AuditAction, AuditLogEntry, DbShape } from "@/lib/types";

const MAX_AUDIT = 5000;

export function pushAudit(
  db: DbShape,
  input: {
    actorUserId?: string;
    action: AuditAction;
    entityType?: string;
    entityId?: string;
    ip?: string;
    meta?: AuditLogEntry["meta"];
  },
) {
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `aud-${crypto.randomUUID().slice(0, 10)}`,
    at: new Date().toISOString(),
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    ip: input.ip,
    meta: input.meta,
  });
  if (db.auditLog.length > MAX_AUDIT) {
    db.auditLog.length = MAX_AUDIT;
  }
}
