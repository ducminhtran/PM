/** issue.model.js — schema, factory, validation for Issues. */
export const ISSUE_WRITABLE = [
  'project_id', 'task_id', 'title', 'description', 'type',
  'status', 'priority', 'assignee_id', 'reporter_id',
];
export function emptyIssue(projectId = null) {
  return {
    project_id: projectId, task_id: null, title: '', description: '',
    type: 'bug', status: 'open', priority: 'medium',
    assignee_id: null, reporter_id: null,
  };
}
export function toPayload(form) {
  const p = {};
  for (const f of ISSUE_WRITABLE) { let v = form[f]; if (v === '') v = null; if (v !== undefined) p[f] = v; }
  return p;
}
export function validateIssue(form) {
  const errors = {};
  if (!form.title?.trim()) errors.title = 'Title is required';
  if (!form.project_id) errors.project_id = 'Project is required';
  return { valid: Object.keys(errors).length === 0, errors };
}
