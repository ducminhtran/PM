/**
 * Priority — độ ưu tiên: icon mũi tên + chữ màu (không nền), kiểu Jira.
 */
import { el } from '../utils/dom.js';
import { Icon } from './icon.js';
import { PRIORITY } from '../../core/config.js';

export function Priority({ value } = {}) {
  const cfg = PRIORITY[value] ?? PRIORITY.medium;
  return el('span.priority', { dataset: { prio: value } }, [
    Icon(cfg.icon, { size: 15 }),
    el('span', { text: cfg.label }),
  ]);
}
