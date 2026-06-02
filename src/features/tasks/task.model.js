/** task.model.js — schema, factory, validation cho Task. */
import { appStore } from '../../app.store.js';

// Cột ghi được. Gồm cả *_id (mới) và status/priority (cũ, giai đoạn chuyển tiếp).
const TASK_WRITABLE = [
  'project_id', 'title', 'description',
  'status', 'priority',            // cột enum cũ — ghi kèm để tương thích ngược
  'status_id', 'priority_id',      // FK danh mục mới
  'assignee_id', 'reporter_id', 'parent_task_id', 'progress',
  'estimate_hours', 'due_date', 'start_date', 'position',
];

export function emptyTask(projectId = null) {
  // mặc định trỏ tới danh mục theo code 'todo' / 'medium' (suy ra id lúc tạo form)
  return {
    project_id: projectId, title: '', description: '',
    status_id: null, priority_id: null,
    assignee_id: null, reporter_id: null, parent_task_id: null,
    progress: 0, estimate_hours: null, due_date: null, start_date: null, position: 0,
  };
}

export function toPayload(form) {
  const payload = {};
  for (const f of TASK_WRITABLE) {
    let v = form[f];
    if (v === '') v = null;
    if (v !== undefined) payload[f] = v;
  }
  if (payload.progress != null) payload.progress = Math.max(0, Math.min(100, Number(payload.progress)));

  // Tương thích ngược: suy 'code' cho cột enum cũ từ *_id (dùng danh mục đang load).
  const r = appStore.getResolver();
  if (form.status_id) payload.status = r.taskStatus(form.status_id)?.code ?? payload.status ?? 'todo';
  if (form.priority_id) payload.priority = r.priority(form.priority_id)?.code ?? payload.priority ?? 'medium';
  // bỏ key cũ nếu vẫn null để khỏi ghi đè bằng null
  if (payload.status == null) delete payload.status;
  if (payload.priority == null) delete payload.priority;

  return payload;
}

export function validateTask(form) {
  const errors = {};
  if (!form.title?.trim()) errors.title = 'Title is required';
  if (!form.project_id) errors.project_id = 'Project is required';
  if (form.progress != null && (form.progress < 0 || form.progress > 100))
    errors.progress = 'Progress must be 0–100';
  if (form.start_date && form.due_date && form.start_date > form.due_date)
    errors.due_date = 'Due date must be after start date';
  return { valid: Object.keys(errors).length === 0, errors };
}
