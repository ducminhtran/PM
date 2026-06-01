/** task.model.js — schema, factory, validation for Tasks. */
export const TASK_WRITABLE = [
  'project_id', 'title', 'description', 'status', 'priority',
  'assignee_id', 'reporter_id', 'parent_task_id', 'progress',
  'estimate_hours', 'due_date', 'position',
];

export function emptyTask(projectId = null) {
  return {
    project_id: projectId, title: '', description: '',
    status: 'todo', priority: 'medium',
    assignee_id: null, reporter_id: null, parent_task_id: null,
    progress: 0, estimate_hours: null, due_date: null, position: 0,
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
  return payload;
}

export function validateTask(form) {
  const errors = {};
  if (!form.title?.trim()) errors.title = 'Title is required';
  if (!form.project_id) errors.project_id = 'Project is required';
  if (form.progress != null && (form.progress < 0 || form.progress > 100))
    errors.progress = 'Progress must be 0–100';
  return { valid: Object.keys(errors).length === 0, errors };
}
