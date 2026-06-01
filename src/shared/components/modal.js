/**
 * Modal — an accessible dialog. Opens with a backdrop, traps nothing fancy but
 * closes on Escape and backdrop click. Content is any Node (e.g. a form).
 *
 * Returns { open, close, node }. The caller controls lifecycle; the modal does
 * not assume how it's used (create form, confirm dialog, detail panel).
 */
import { el } from '../utils/dom.js';
import { Icon } from './icon.js';

export function Modal({ title, content, onClose, size = 'md' } = {}) {
  let onEsc;

  const closeBtn = el(
    'button.modal__close',
    { type: 'button', 'aria-label': 'Close', on: { click: () => close() } },
    [Icon('x', { size: 20 })]
  );

  const dialog = el(`div.modal__dialog.modal__dialog--${size}`, { role: 'dialog', 'aria-modal': 'true' }, [
    el('header.modal__header', {}, [el('h2.modal__title', { text: title }), closeBtn]),
    el('div.modal__body', {}, [content]),
  ]);

  const backdrop = el('div.modal__backdrop', {
    on: {
      click: (e) => {
        if (e.target === backdrop) close();
      },
    },
  }, [dialog]);

  function open() {
    document.body.append(backdrop);
    document.body.style.overflow = 'hidden';
    onEsc = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onEsc);
    // focus first focusable element for accessibility
    dialog.querySelector('input, textarea, select, button')?.focus();
  }

  function close() {
    document.removeEventListener('keydown', onEsc);
    document.body.style.overflow = '';
    backdrop.remove();
    onClose?.();
  }

  return { open, close, node: backdrop };
}
