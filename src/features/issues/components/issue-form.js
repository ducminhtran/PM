/**
 * IssueForm — form báo/sửa issue. Đổ option type/status/priority từ DANH MỤC
 * động (issue_types, issue_statuses, priorities). Phát payload qua onSubmit.
 */
import { el } from '../../../shared/utils/dom.js';
import { emptyIssue } from '../issue.model.js';
import { appStore } from '../../../app.store.js';

export function IssueForm({ initial, onSubmit, onCancel } = {}) {
  const data = { ...emptyIssue(initial?.project_id ?? null), ...initial };
  const { projects, members, issueStatuses, issueTypes, priorities } = appStore.getState();

  const defType = issueTypes.find((t) => t.code === 'bug') ?? issueTypes[0];
  const defStatus = issueStatuses.find((s) => s.code === 'open') ?? issueStatuses[0];
  const defPrio = priorities.find((p) => p.code === 'medium') ?? priorities[0];
  const curTypeId = data.type_id ?? defType?.id ?? '';
  const curStatusId = data.status_id ?? defStatus?.id ?? '';
  const curPrioId = data.priority_id ?? defPrio?.id ?? '';

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
  const typeSelect = el('select.input', {}, issueTypes.map((t) =>
    el('option', { value: t.id, text: t.label, selected: t.id === curTypeId })));
  const statusSelect = el('select.input', {}, issueStatuses.map((s) =>
    el('option', { value: s.id, text: s.label, selected: s.id === curStatusId })));
  const prioSelect = el('select.input', {}, priorities.map((p) =>
    el('option', { value: p.id, text: p.label, selected: p.id === curPrioId })));
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
        project_id: projectSelect.value || null,
        type_id: typeSelect.value || null,
        status_id: statusSelect.value || null,
        priority_id: prioSelect.value || null,
        assignee_id: assigneeSelect.value || null,
      }, { setErrors });
    } },
  }, [
    field('title', 'Summary', titleInput, { required: true }),
    field('description', 'Description', descInput),
    el('div.form-grid', {}, [field('project_id', 'Project', projectSelect, { required: true }), field('type_id', 'Type', typeSelect)]),
    el('div.form-grid', {}, [field('status_id', 'Status', statusSelect), field('priority_id', 'Priority', prioSelect)]),
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
