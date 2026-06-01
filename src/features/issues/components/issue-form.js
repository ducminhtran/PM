/** IssueForm — controlled create/edit form for an issue. */
import { el } from '../../../shared/utils/dom.js';
import { emptyIssue } from '../issue.model.js';
import { ISSUE_STATUS, PRIORITY, ISSUE_TYPE } from '../../../core/config.js';
import { appStore } from '../../../app.store.js';

export function IssueForm({ initial, onSubmit, onCancel } = {}) {
  const data = { ...emptyIssue(initial?.project_id ?? null), ...initial };
  const { projects, members } = appStore.getState();
  const fields = {};
  function field(name, label, input, { required } = {}) {
    const errorEl = el('span.field__error');
    fields[name] = { errorEl };
    return el('div.field', {}, [el('label.field__label', { text: label + (required ? ' *' : '') }), input, errorEl]);
  }

  const titleInput = el('input.input', { value: data.title, placeholder: 'Issue summary' });
  const descInput = el('textarea.input.input--textarea', { rows: '3', value: data.description ?? '' });
  const projectSelect = el('select.input', {}, [
    el('option', { value: '', text: 'Select project', selected: !data.project_id }),
    ...projects.map((p) => el('option', { value: p.id, text: `${p.key} · ${p.name}`, selected: p.id === data.project_id })),
  ]);
  const typeSelect = el('select.input', {}, Object.entries(ISSUE_TYPE).map(([v, c]) =>
    el('option', { value: v, text: c.label, selected: v === data.type })));
  const statusSelect = el('select.input', {}, Object.entries(ISSUE_STATUS).map(([v, c]) =>
    el('option', { value: v, text: c.label, selected: v === data.status })));
  const prioSelect = el('select.input', {}, Object.entries(PRIORITY).map(([v, c]) =>
    el('option', { value: v, text: c.label, selected: v === data.priority })));
  const assigneeSelect = el('select.input', {}, [
    el('option', { value: '', text: 'Unassigned', selected: !data.assignee_id }),
    ...members.map((m) => el('option', { value: m.id, text: m.full_name, selected: m.id === data.assignee_id })),
  ]);

  const submitBtn = el('button.btn.btn--primary', { type: 'submit' }, [initial?.id ? 'Save changes' : 'Report issue']);
  const form = el('form.issue-form', {
    on: { submit: (e) => {
      e.preventDefault();
      onSubmit?.({
        ...data, title: titleInput.value, description: descInput.value,
        project_id: projectSelect.value || null, type: typeSelect.value,
        status: statusSelect.value, priority: prioSelect.value,
        assignee_id: assigneeSelect.value || null,
      }, { setErrors });
    } },
  }, [
    field('title', 'Summary', titleInput, { required: true }),
    field('description', 'Description', descInput),
    el('div.form-grid', {}, [field('project_id', 'Project', projectSelect, { required: true }), field('type', 'Type', typeSelect)]),
    el('div.form-grid', {}, [field('status', 'Status', statusSelect), field('priority', 'Priority', prioSelect)]),
    field('assignee_id', 'Assignee', assigneeSelect),
    el('div.form-actions', {}, [
      onCancel && el('button.btn.btn--secondary', { type: 'button', on: { click: onCancel } }, ['Cancel']),
      submitBtn,
    ]),
  ]);

  function setErrors(map = {}) {
    Object.values(fields).forEach((f) => (f.errorEl.textContent = ''));
    for (const [n, msg] of Object.entries(map)) if (fields[n]) fields[n].errorEl.textContent = msg;
  }
  function setSubmitting(on) {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Saving…' : initial?.id ? 'Save changes' : 'Report issue';
  }
  return { node: form, setErrors, setSubmitting };
}
