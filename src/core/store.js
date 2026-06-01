/**
 * createStore — a minimal observable state container.
 *
 * This is the reactivity primitive the whole app is built on. Vanilla JS has
 * no reactivity, so we provide the missing link in the flow:
 *
 *   UI --action--> store.setState() --> subscribers notified --> UI re-renders
 *
 * Design notes:
 *  - State is treated as immutable: setState shallow-merges a NEW object.
 *    Never mutate state in place; the identity change is what lets views
 *    cheaply detect "something changed".
 *  - subscribe() returns an unsubscribe fn (so views can clean up on unmount).
 *  - Updaters can be a partial object OR a function (prevState) => partial,
 *    which avoids stale-closure bugs when updates depend on current state.
 *
 * It deliberately does NOT do: deep reactivity, selectors, middleware. Those
 * are added per-feature only if a real need appears (avoid speculative abstraction).
 */
export function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater) {
    const partial = typeof updater === 'function' ? updater(state) : updater;
    if (partial == null) return;
    const next = { ...state, ...partial };
    state = next;
    listeners.forEach((fn) => fn(state));
  }

  /**
   * @param {(state) => void} listener
   * @param {{ immediate?: boolean }} [opts] - fire once immediately with current state
   * @returns {() => void} unsubscribe
   */
  function subscribe(listener, opts = {}) {
    listeners.add(listener);
    if (opts.immediate) listener(state);
    return () => listeners.delete(listener);
  }

  /** Reset to a known state (useful on logout / project switch). */
  function reset(nextState = initialState) {
    state = { ...nextState };
    listeners.forEach((fn) => fn(state));
  }

  return { getState, setState, subscribe, reset };
}
