/**
 * category.store.js — điều phối CRUD danh mục.
 *
 * Dữ liệu danh mục sống trong appStore (đã load lúc khởi động). Store này
 * không giữ bản sao — sau mỗi thay đổi, gọi appStore.refreshLookup() để toàn
 * app (board, form, bảng) cập nhật ngay. Tránh trùng nguồn dữ liệu.
 */
import { categoryService, CATEGORY_TYPES } from './category.service.js';
import { appStore } from '../../app.store.js';

async function create(typeKey, form) {
  const created = await categoryService.create(typeKey, form);
  await appStore.refreshLookup(CATEGORY_TYPES[typeKey].storeKey);
  return created;
}

async function update(typeKey, id, form) {
  const updated = await categoryService.update(typeKey, id, form);
  await appStore.refreshLookup(CATEGORY_TYPES[typeKey].storeKey);
  return updated;
}

async function remove(typeKey, id) {
  await categoryService.remove(typeKey, id);
  await appStore.refreshLookup(CATEGORY_TYPES[typeKey].storeKey);
}

/** Lấy danh sách hiện tại của một loại danh mục từ appStore. */
function list(typeKey) {
  return appStore.getState()[CATEGORY_TYPES[typeKey].storeKey] ?? [];
}

export const categoryStore = { create, update, remove, list };
