/**
 * Badge — lozenge trạng thái kiểu Jira: nền nhạt + chữ đậm cùng tông.
 */
import { el } from '../utils/dom.js';
import { Icon } from './icon.js';

export function Badge({ label, tone, color, icon } = {}) {
  const node = el('span.badge');
  if (tone) node.dataset.tone = tone;
  if (icon) node.append(Icon(icon, { size: 13 }));
  node.append(document.createTextNode(label));
  if (color && !tone) {
    node.style.setProperty('--badge-color', color);
    node.classList.add('badge--subtle');
  }
  return node;
}
