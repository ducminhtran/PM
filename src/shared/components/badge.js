/**
 * Badge — status/type lozenge kiểu Jira: nền nhạt + chữ đậm cùng tông.
 * Truyền `tone` ('neutral'|'blue'|'amber'|'green'|'red'|'purple') để chọn màu.
 * Vẫn nhận `color` (legacy) cho các chỗ cần màu tùy ý.
 */
import { el } from '../utils/dom.js';

export function Badge({ label, tone, color, icon } = {}) {
  const node = el('span.badge', { text: icon ? undefined : label });
  if (tone) node.dataset.tone = tone;
  if (icon) {
    node.prepend(el(`i.ti.ti-${icon}`, { 'aria-hidden': 'true' }));
    node.append(document.createTextNode(label));
  }
  if (color && !tone) {
    node.style.setProperty('--badge-color', color);
    node.classList.add('badge--subtle');
  }
  return node;
}
