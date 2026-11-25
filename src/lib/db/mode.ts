/** Relational tables are source of finance constraints; JSON app_store remains document mirror. */
export function isRelationalStore() {
  const mode = (process.env.STORE_MODE ?? "").toLowerCase();
  if (mode === "relational") return true;
  if (mode === "json") return false;
  // Default json until STORE_MODE=relational is set after schema migration.
  return false;
}
