/**
 * confirmDialog — hộp thoại xác nhận dùng chung (cho hành động xóa...).
 * Trả về modal đã mở; gọi onConfirm khi người dùng đồng ý.
 */
import { el } from '../utils/dom.js';
import { Modal } from './modal.js';

export function confirmDialog({ title = 'Confirm', message, confirmLabel = 'Delete', danger = true, onConfirm } = {}) {
  const content = el('div', {}, [
    el('p', { text: message }),
    el('div.form-actions', {}, [
      el('button.btn.btn--secondary', { type: 'button', on: { click: () => modal.close() } }, ['Cancel']),
      el(`button.btn.${danger ? 'btn--danger' : 'btn--primary'}`, {
        type: 'button',
        on: { click: async () => { await onConfirm?.(); modal.close(); } },
      }, [confirmLabel]),
    ]),
  ]);
  const modal = Modal({ title, content, size: 'md' });
  modal.open();
  return modal;
}
