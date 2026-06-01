/**
 * eventBus — a minimal pub/sub for cross-feature events that don't belong
 * to any single store (e.g. 'toast:show', 'task:created' so the board and
 * the activity feed can both react without importing each other).
 *
 * Use sparingly. If two modules talk constantly, they probably belong in the
 * same feature. The bus is for loose, occasional coupling — not a backdoor
 * around the unidirectional data flow.
 */
function createEventBus() {
  const channels = new Map();

  function on(event, handler) {
    if (!channels.has(event)) channels.set(event, new Set());
    channels.get(event).add(handler);
    return () => channels.get(event)?.delete(handler);
  }

  function emit(event, payload) {
    channels.get(event)?.forEach((h) => h(payload));
  }

  return { on, emit };
}

export const bus = createEventBus();
