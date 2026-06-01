/** resource.store.js — state for resource allocations + derived workload. */
import { createStore } from '../../core/store.js';
import { resourceService } from './resource.service.js';
const store = createStore({ items: [], status: 'idle', error: null, loaded: false });
async function load({ force = false } = {}) {
  const s = store.getState();
  if (s.loaded && !force) return s.items;
  store.setState({ status: 'loading', error: null });
  try {
    const items = await resourceService.list();
    store.setState({ items, status: 'ready', loaded: true });
    return items;
  } catch (error) { store.setState({ status: 'error', error }); throw error; }
}
async function create(form) {
  const created = await resourceService.create(form);
  store.setState((s) => ({ items: [created, ...s.items] }));
  return created;
}
async function remove(id) {
  await resourceService.remove(id);
  store.setState((s) => ({ items: s.items.filter((a) => a.id !== id) }));
}
/** Derived: total allocation % per member (the "overallocation" signal). */
function workloadByMember() {
  const map = new Map();
  for (const a of store.getState().items) {
    map.set(a.member_id, (map.get(a.member_id) ?? 0) + (a.allocation_pct ?? 0));
  }
  return map;
}
export const resourceStore = { ...store, load, create, remove, workloadByMember };
