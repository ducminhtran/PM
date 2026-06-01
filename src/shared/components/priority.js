/**
 * Priority — hiển thị độ ưu tiên bằng icon mũi tên + chữ màu (không nền),
 * đúng kiểu Jira. Nhận key ('low'|'medium'|'high'|'critical').
 */
import { el } from '../utils/dom.js';
import { PRIORITY } from '../../core/config.js';

export function Priority({ value } = {}) {
  const cfg = PRIORITY[value] ?? PRIORITY.medium;
  const node = el('span.priority', { dataset: { prio: value } }, [
    el(`i.ti.ti-${cfg.icon}`, { 'aria-hidden': 'true' }),
    el('span', { text: cfg.label }),
  ]);
  return node;
}
