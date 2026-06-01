/**
 * Badge — a status/priority lozenge. Takes a label + color (CSS var or hex).
 * Used everywhere a status/priority/type is shown. One component, many uses.
 */
import { el } from '../utils/dom.js';

export function Badge({ label, color, subtle = true } = {}) {
  const node = el('span.badge', { text: label });
  if (color) {
    node.style.setProperty('--badge-color', color);
    if (subtle) node.classList.add('badge--subtle');
    else node.classList.add('badge--solid');
  }
  return node;
}
