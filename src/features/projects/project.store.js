/**
 * project.store.js — state for the projects feature.
 *
 * Holds the list, loading status, and error. Exposes actions that call the
 * service and update state. Views subscribe to this; they never call the
 * service directly. After mutations it refreshes the global appStore's project
 * list so relation resolution stays correct everywhere.
 *
 * Simple cache: once loaded, `load()` won't re-fetch unless force=true. This
 * is the "cache/state layer" — good enough for an internal tool; swap for a
 * TTL or revalidation strategy later without touching views.
 */
import { createStore } from '../../core/store.js';
import { projectService } from './project.service.js';
import { appStore } from '../../app.store.js';

const store = createStore({
  items: [],
  status: 'idle', // idle | loading | ready | error
  error: null,
  loaded: false,
});

async function load({ force = false } = {}) {
  const s = store.getState();
  if (s.loaded && !force) return s.items;
  store.setState({ status: 'loading', error: null });
  try {
    const items = await projectService.list();
    store.setState({ items, status: 'ready', loaded: true });
    return items;
  } catch (error) {
    store.setState({ status: 'error', error });
    throw error;
  }
}

async function create(form) {
  const created = await projectService.create(form);
  store.setState((s) => ({ items: [created, ...s.items] }));
  await appStore.refreshProjects();
  return created;
}

async function update(id, form) {
  const updated = await projectService.update(id, form);
  store.setState((s) => ({ items: s.items.map((p) => (p.id === id ? updated : p)) }));
  await appStore.refreshProjects();
  return updated;
}

async function remove(id) {
  await projectService.remove(id);
  store.setState((s) => ({ items: s.items.filter((p) => p.id !== id) }));
  await appStore.refreshProjects();
}

export const projectStore = {
  ...store,
  load,
  create,
  update,
  remove,
};
