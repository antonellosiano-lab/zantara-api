export function buildVoDailyRefreshPayload(databaseId) {
  return {
    action: "notion.query_database",
    database_id: databaseId,
  };
}
