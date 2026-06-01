/**
 * app.store.js — the global store for REFERENCE data that many features need
 * to resolve relations: members and a lightweight projects list.
 *
 * This is deliberately the ONLY global store. Feature-specific data (tasks of
 * a project, issues, etc.) lives in per-feature stores. Keeping reference data
 * here means any feature can resolve assignee_id -> member or project_id ->
 * project name without re-fetching.
 *
 * Flow respected: views read via getResolver(); they never fetch directly.
 */
import { createStore } from './core/store.js';
import { createRepository } from './core/api.js';
import { createResolver, indexById } from './shared/utils/resolver.js';

const membersRepo = createRepository('members');
const projectsRepo = createRepository('projects');

const store = createStore({
  members: [],
  projects: [],
  membersById: new Map(),
  projectsById: new Map(),
  status: 'idle', // idle | loading | ready | error
  error: null,
  currentUser: null,
});

/** Load reference data once at app start (and on demand after mutations). */
async function loadReferenceData() {
  store.setState({ status: 'loading', error: null });
  try {
    const [members, projects] = await Promise.all([
      membersRepo.list({ order: { column: 'full_name' } }),
      projectsRepo.list({ order: { column: 'name' } }),
    ]);
    store.setState({
      members,
      projects,
      membersById: indexById(members),
      projectsById: indexById(projects),
      status: 'ready',
    });
  } catch (error) {
    store.setState({ status: 'error', error });
    throw error;
  }
}

/** Refresh just the projects list (after create/update/delete). */
async function refreshProjects() {
  const projects = await projectsRepo.list({ order: { column: 'name' } });
  store.setState({ projects, projectsById: indexById(projects) });
}

/** A resolver bound to the current reference maps. Rebuilt cheaply on demand. */
function getResolver() {
  const s = store.getState();
  return createResolver({ members: s.membersById, projects: s.projectsById });
}

export const appStore = {
  ...store,
  loadReferenceData,
  refreshProjects,
  getResolver,
};
