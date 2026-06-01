/** EmptyState — placeholder khi không có dữ liệu. */
import { el } from '../utils/dom.js';
import { Icon } from './icon.js';

export function emptyState(message, { icon = 'circle', action } = {}) {
  return el('div.empty-state', {}, [
    Icon(icon, { size: 32 }),
    el('p.empty-state__msg', { text: message }),
    action || null,
  ]);
}
