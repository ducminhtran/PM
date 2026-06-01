/** EmptyState — friendly placeholder when a collection has no rows. */
import { el } from '../utils/dom.js';

export function emptyState(message, { icon = 'inbox', action } = {}) {
  return el('div.empty-state', {}, [
    el(`i.ti.ti-${icon}`, { 'aria-hidden': 'true' }),
    el('p.empty-state__msg', { text: message }),
    action || null,
  ]);
}
