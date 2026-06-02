/**
 * resolver.js — the bridge between "relations stored as IDs" and "UI needs labels".
 *
 * Core rule of this app: the DB stores only UUIDs for relations. The UI must
 * resolve those IDs to human-readable entities at RENDER time. This module is
 * where that happens — backed by lookup Maps so resolution is O(1) and there
 * is no N+1 querying.
 *
 * The app store holds normalized collections (members, projects keyed by id).
 * createResolver wraps those into convenient lookups.
 */

/** Build an id -> entity Map from an array. */
export function indexById(rows = []) {
  const map = new Map();
  for (const row of rows) map.set(row.id, row);
  return map;
}

/**
 * Create a resolver over the app's reference collections.
 * @param {{ members?, projects?, taskStatuses?, priorities?, issueStatuses?, issueTypes? }} maps
 */
export function createResolver(maps = {}) {
  const members = maps.members ?? new Map();
  const projects = maps.projects ?? new Map();
  const taskStatuses = maps.taskStatuses ?? new Map();
  const priorities = maps.priorities ?? new Map();
  const issueStatuses = maps.issueStatuses ?? new Map();
  const issueTypes = maps.issueTypes ?? new Map();

  return {
    member: (id) => (id ? members.get(id) ?? null : null),
    memberName: (id) => members.get(id)?.full_name ?? 'Unassigned',
    project: (id) => (id ? projects.get(id) ?? null : null),
    projectName: (id) => projects.get(id)?.name ?? '—',
    projectKey: (id) => projects.get(id)?.key ?? '—',
    // danh mục: trả nguyên dòng (có label, color, tone, icon, code...)
    taskStatus: (id) => taskStatuses.get(id) ?? null,
    priority: (id) => priorities.get(id) ?? null,
    issueStatus: (id) => issueStatuses.get(id) ?? null,
    issueType: (id) => issueTypes.get(id) ?? null,
  };
}
