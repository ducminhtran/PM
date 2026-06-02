/**
 * category.service.js — data layer cho 4 bảng DANH MỤC.
 * Mỗi loại danh mục map tới một bảng + tập cột riêng. Dùng chung repo CRUD.
 */
import { createRepository, ApiError } from '../../core/api.js';

// Định nghĩa từng loại danh mục: bảng, các cột sửa được, nhãn hiển thị.
export const CATEGORY_TYPES = {
  taskStatuses: {
    table: 'task_statuses', title: 'Task statuses', storeKey: 'taskStatuses',
    fields: ['label', 'color', 'tone', 'position'], hasIcon: false,
  },
  priorities: {
    table: 'priorities', title: 'Priorities', storeKey: 'priorities',
    fields: ['label', 'color', 'tone', 'icon', 'position'], hasIcon: true,
  },
  issueStatuses: {
    table: 'issue_statuses', title: 'Issue statuses', storeKey: 'issueStatuses',
    fields: ['label', 'color', 'tone', 'position'], hasIcon: false,
  },
  issueTypes: {
    table: 'issue_types', title: 'Issue types', storeKey: 'issueTypes',
    fields: ['label', 'icon', 'position'], hasIcon: true,
  },
};

function repoFor(typeKey) {
  const def = CATEGORY_TYPES[typeKey];
  if (!def) throw new ApiError('Unknown category type', { code: 'BAD_TYPE' });
  return createRepository(def.table);
}

// Tạo 'code' từ nhãn khi thêm mới (slug): "In Review" -> "in_review".
function slug(label) {
  return String(label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'item';
}

function pickWritable(typeKey, form) {
  const def = CATEGORY_TYPES[typeKey];
  const payload = {};
  for (const f of def.fields) {
    let v = form[f];
    if (v === '') v = null;
    if (v !== undefined) payload[f] = v;
  }
  if (payload.position != null) payload.position = Number(payload.position) || 0;
  return payload;
}

export const categoryService = {
  async create(typeKey, form) {
    if (!form.label?.trim()) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: { label: 'Label is required' } });
    const payload = pickWritable(typeKey, form);
    payload.code = form.code?.trim() || slug(form.label); // code cố định, suy từ nhãn
    return repoFor(typeKey).create(payload);
  },
  async update(typeKey, id, form) {
    if (!form.label?.trim()) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: { label: 'Label is required' } });
    // Không cho sửa 'code' (giữ ổn định cho code chương trình tham chiếu).
    return repoFor(typeKey).update(id, pickWritable(typeKey, form));
  },
  async remove(typeKey, id) {
    return repoFor(typeKey).remove(id);
  },
};
