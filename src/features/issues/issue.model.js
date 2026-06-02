/** issue.model.js — schema, factory, validation cho Issue. */
import { appStore } from '../../app.store.js';

// Gồm cả *_id (mới) và status/priority/type (enum cũ, giai đoạn chuyển tiếp).
const ISSUE_WRITABLE = [
  'project_id', 'task_id', 'title', 'description',
  'type', 'status', 'priority',          // enum cũ — ghi kèm để tương thích ngược
  'status_id', 'priority_id', 'type_id', // FK danh mục mới
  'assignee_id', 'reporter_id',
];

export function emptyIssue(projectId = null) {
  return {
    project_id: projectId, task_id: null, title: '', description: '',
    status_id: null, priority_id: null, type_id: null,
    assignee_id: null, reporter_id: null,
  };
}

export function toPayload(form) {
  const p = {};
  for (const f of ISSUE_WRITABLE) { let v = form[f]; if (v === '') v = null; if (v !== undefined) p[f] = v; }

  // Tương thích ngược: suy 'code' cho cột enum cũ từ *_id.
  const r = appStore.getResolver();
  if (form.status_id)   p.status   = r.issueStatus(form.status_id)?.code ?? p.status ?? 'open';
  if (form.priority_id) p.priority = r.priority(form.priority_id)?.code ?? p.priority ?? 'medium';
  if (form.type_id)     p.type     = r.issueType(form.type_id)?.code ?? p.type ?? 'bug';
  if (p.status == null)   delete p.status;
  if (p.priority == null) delete p.priority;
  if (p.type == null)     delete p.type;

  return p;
}

export function validateIssue(form) {
  const errors = {};
  if (!form.title?.trim()) errors.title = 'Title is required';
  if (!form.project_id) errors.project_id = 'Project is required';
  return { valid: Object.keys(errors).length === 0, errors };
}
