/**
 * Toast — transient notifications. Driven by the eventBus so any module can
 * fire 'toast:show' without importing this. Mounted once in the app shell.
 */
import { el } from '../utils/dom.js';
import { bus } from '../../core/eventBus.js';

let container;

export function mountToasts() {
  if (container) return;
  container = el('div.toast-stack', { 'aria-live': 'polite' });
  document.body.append(container);
  bus.on('toast:show', ({ message, type = 'info', duration = 3500 }) => {
    const toast = el(`div.toast.toast--${type}`, {}, [
      el(`i.ti.ti-${iconFor(type)}`, { 'aria-hidden': 'true' }),
      el('span', { text: message }),
    ]);
    container.append(toast);
    setTimeout(() => {
      toast.classList.add('toast--out');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  });
}

function iconFor(type) {
  return { success: 'check', error: 'alert-triangle', info: 'info-circle', warning: 'alert-circle' }[type] ?? 'info-circle';
}

export function toast(message, type = 'info') {
  bus.emit('toast:show', { message, type });
}
