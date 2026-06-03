/** issue.store.js — state for Issues. */
import { createStore } from '../../core/store.js';
import { issueService } from './issue.service.js';
const store = createStore({ items: [], status: 'idle', error: null, loaded: false, projectId: null });
async function load({ projectId = null, force = false } = {}) {
  const s = store.getState();
  if (s.loaded && s.projectId === projectId && !force) return s.items;
  store.setState({ status: 'loading', error: null, projectId });
  try {
    const items = await issueService.list({ projectId });
    store.setState({ items, status: 'ready', loaded: true });
    return items;
  } catch (error) { store.setState({ status: 'error', error }); throw error; }
}
async function create(form) {
  const created = await issueService.create(form);
  store.setState((s) => ({ items: [created, ...s.items] }));
  return created;
}
async function updateStatus(id, statusId) {
  const prev = store.getState().items;
  store.setState({ items: prev.map((i) => (i.id === id ? { ...i, status_id: statusId } : i)) });
  try {
    const updated = await issueService.patch(id, { status_id: statusId });
    store.setState((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }));
    return updated;
  } catch (e) { store.setState({ items: prev }); throw e; }
}
async function remove(id) {
  await issueService.remove(id);
  store.setState((s) => ({ items: s.items.filter((i) => i.id !== id) }));
}
async function update(id, form) {
  const updated = await issueService.update(id, form);
  store.setState((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }));
  return updated;
}
export const issueStore = { ...store, load, create, update, updateStatus, remove };
