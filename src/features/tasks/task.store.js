/** task.store.js — state for Tasks, scoped by current project filter. */
import { createStore } from '../../core/store.js';
import { taskService } from './task.service.js';

const store = createStore({
  items: [], status: 'idle', error: null, projectId: null, loaded: false,
});

async function load({ projectId = null, force = false } = {}) {
  const s = store.getState();
  if (s.loaded && s.projectId === projectId && !force) return s.items;
  store.setState({ status: 'loading', error: null, projectId });
  try {
    const items = await taskService.list({ projectId });
    store.setState({ items, status: 'ready', loaded: true });
    return items;
  } catch (error) {
    store.setState({ status: 'error', error });
    throw error;
  }
}

async function create(form) {
  const created = await taskService.create(form);
  store.setState((s) => ({ items: [...s.items, created] }));
  return created;
}

async function updateStatus(id, status) {
  // optimistic update for snappy board interactions
  const prev = store.getState().items;
  store.setState({ items: prev.map((t) => (t.id === id ? { ...t, status } : t)) });
  try {
    const updated = await taskService.patch(id, { status });
    store.setState((s) => ({ items: s.items.map((t) => (t.id === id ? updated : t)) }));
    return updated;
  } catch (error) {
    store.setState({ items: prev }); // rollback
    throw error;
  }
}

async function remove(id) {
  await taskService.remove(id);
  store.setState((s) => ({ items: s.items.filter((t) => t.id !== id) }));
}

export const taskStore = { ...store, load, create, updateStatus, remove };
