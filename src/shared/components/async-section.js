/**
 * AsyncSection — a declarative wrapper that renders loading / error / empty /
 * ready states for any async-backed view. This is how the app guarantees
 * "has loading state" and "has error handling" everywhere, without each view
 * re-implementing the boilerplate.
 *
 * Usage:
 *   const section = AsyncSection({
 *     render: (data) => buildTable(data),
 *     empty:  () => emptyState('No projects yet'),
 *     onRetry: () => store.load(),
 *   });
 *   container.append(section.node);
 *   section.setLoading();
 *   ...later: section.setData(rows) / section.setError(err)
 */
import { el, mount } from '../utils/dom.js';
import { Spinner } from './spinner.js';
import { Icon } from './icon.js';

export function AsyncSection({ render, empty, onRetry } = {}) {
  const node = el('div.async-section');

  function setLoading() {
    mount(node, el('div.state-center', {}, [Spinner({ label: 'Loading…' })]));
  }

  function setError(error) {
    mount(
      node,
      el('div.state-center.state-error', {}, [
        Icon('alert-triangle', { size: 28 }),
        el('p.state-error__msg', { text: error?.message ?? 'Something went wrong' }),
        onRetry &&
          el('button.btn.btn--secondary', { type: 'button', on: { click: onRetry } }, ['Retry']),
      ])
    );
  }

  function setData(data) {
    const isEmpty = Array.isArray(data) ? data.length === 0 : data == null;
    if (isEmpty && empty) {
      mount(node, empty());
    } else {
      mount(node, render(data));
    }
  }

  return { node, setLoading, setError, setData };
}
