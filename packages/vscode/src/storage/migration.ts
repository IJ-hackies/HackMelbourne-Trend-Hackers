export const CURRENT_SCHEMA_VERSION = 1;

export function migrate(raw: Record<string, any>): any {
  const version = raw.schemaVersion ?? 0;

  if (version >= CURRENT_SCHEMA_VERSION) return raw;

  let state = { ...raw };

  if (version < 1) {
    state.schemaVersion = 1;
    if (!state.eventHistory) state.eventHistory = [];
    if (!state.recentCommitTimestamps) state.recentCommitTimestamps = [];
  }

  return state;
}
