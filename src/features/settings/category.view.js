/**
 * category.view.js — màn quản lý DANH MỤC (Settings).
 *
 * Hiển thị 4 loại danh mục, mỗi loại một bảng: nhãn + màu + thứ tự + thao tác.
 * Thêm/sửa qua modal, xóa có xác nhận, đổi thứ tự bằng nút lên/xuống (ghi
 * position). Sau mỗi thay đổi store tự refresh appStore -> toàn app cập nhật.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Icon } from '../../shared/components/icon.js';
import { Badge } from '../../shared/components/badge.js';
import { Modal } from '../../shared/components/modal.js';
import { toast } from '../../shared/components/toast.js';
import { appStore } from '../../app.store.js';
import { categoryStore } from './category.store.js';
import { CATEGORY_TYPES } from './category.service.js';
import { CategoryForm } from './components/category-form.js';

export function CategoryView({ outlet, setTitle }) {
  setTitle?.('Settings');
  const page = el('div.page');
  mount(outlet, page);
  render();

  function render() {
    mount(page,
      el('h2.page-header__title', { text: 'Categories' }),
      el('p.settings-hint', { text: 'Quản lý trạng thái, độ ưu tiên và loại issue. Thay đổi áp dụng ngay cho toàn bộ task và issue.' }),
      ...Object.keys(CATEGORY_TYPES).map((typeKey) => sectionFor(typeKey)),
    );
  }

  function sectionFor(typeKey) {
    const def = CATEGORY_TYPES[typeKey];
    const rows = categoryStore.list(typeKey);

    const body = el('div.cat-list', {}, rows.map((row, idx) => rowItem(typeKey, def, row, idx, rows.length)));

    return el('section.cat-section', {}, [
      el('div.cat-section__head', {}, [
        el('h3.section-title', { text: def.title }),
        el('button.btn.btn--secondary', { type: 'button', on: { click: () => openForm(typeKey) } }, [
          Icon('plus', { size: 15 }), 'Add',
        ]),
      ]),
      body,
    ]);
  }

  function rowItem(typeKey, def, row, idx, total) {
    const preview = def.fields.includes('color')
      ? Badge({ label: row.label, tone: row.tone })
      : el('span.cell-type', {}, [Icon(row.icon ?? 'circle', { size: 15 }), el('span', { text: row.label })]);

    // chấm màu (hex hoặc biến CSS đều là giá trị background hợp lệ)
    const swatch = def.fields.includes('color') && row.color
      ? el('span.cat-swatch', { style: { background: row.color } })
      : null;

    return el('div.cat-row', {}, [
      el('div.cat-row__main', {}, [swatch, preview, el('span.cat-row__code', { text: row.code })]),
      el('div.cat-row__actions', {}, [
        el('button.icon-btn', { type: 'button', title: 'Move up', disabled: idx === 0,
          on: { click: () => reorder(typeKey, row, idx, -1) } }, [Icon('arrow-up', { size: 15 })]),
        el('button.icon-btn', { type: 'button', title: 'Move down', disabled: idx === total - 1,
          on: { click: () => reorder(typeKey, row, idx, 1) } }, [Icon('chevron-down', { size: 15 })]),
        el('button.icon-btn', { type: 'button', title: 'Edit',
          on: { click: () => openForm(typeKey, row) } }, [Icon('check', { size: 15 })]),
        el('button.icon-btn.icon-btn--danger', { type: 'button', title: 'Delete',
          on: { click: () => confirmDelete(typeKey, row) } }, [Icon('x', { size: 15 })]),
      ]),
    ]);
  }

  async function reorder(typeKey, row, idx, dir) {
    const rows = categoryStore.list(typeKey);
    const swapWith = rows[idx + dir];
    if (!swapWith) return;
    try {
      // đổi position của 2 dòng
      await categoryStore.update(typeKey, row.id, { ...row, position: swapWith.position });
      await categoryStore.update(typeKey, swapWith.id, { ...swapWith, position: row.position });
      render();
    } catch (err) { toast(err.message, 'error'); }
  }

  function openForm(typeKey, row = null) {
    const form = CategoryForm({
      typeKey, initial: row,
      onCancel: () => modal.close(),
      onSubmit: async (payload, { setErrors }) => {
        form.setSubmitting(true);
        try {
          if (row) await categoryStore.update(typeKey, row.id, payload);
          else await categoryStore.create(typeKey, payload);
          toast('Saved', 'success');
          modal.close();
          render();
        } catch (err) {
          if (err.code === 'VALIDATION') setErrors(err.cause);
          else toast(err.message, 'error');
        } finally { form.setSubmitting(false); }
      },
    });
    const modal = Modal({ title: row ? 'Edit item' : 'Add item', content: form.node });
    modal.open();
  }

  function confirmDelete(typeKey, row) {
    const content = el('div', {}, [
      el('p', { text: `Xóa "${row.label}"? Task/issue đang dùng mục này sẽ mất liên kết.` }),
      el('div.form-actions', {}, [
        el('button.btn.btn--secondary', { type: 'button', on: { click: () => modal.close() } }, ['Cancel']),
        el('button.btn.btn--danger', { type: 'button', on: { click: doDelete } }, ['Delete']),
      ]),
    ]);
    async function doDelete() {
      try { await categoryStore.remove(typeKey, row.id); toast('Deleted', 'success'); modal.close(); render(); }
      catch (err) { toast(err.message, 'error'); }
    }
    const modal = Modal({ title: 'Delete', content, size: 'md' });
    modal.open();
  }

  return () => {};
}
