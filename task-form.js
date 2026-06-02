/**
 * TaskForm — form tạo/sửa task. Đổ option project/assignee/status/priority từ
 * appStore (status & priority lấy từ DANH MỤC động). Phát payload qua onSubmit.
 */
import { el } from '../../../shared/utils/dom.js';
import { emptyTask } from '../task.model.js';
import { appStore } from '../../../app.store.js';

export function TaskForm({ initial, onSubmit, onCancel } = {}) {
  const data = { ...emptyTask(initial?.project_id ?? null), ...initial };
  const { projects, members, taskStatuses, priorities } = appStore.getState();

  // mặc định: nếu chưa có status_id/priority_id thì chọn theo code 'todo'/'medium'
  const defStatus = taskStatuses.find((s) => s.code === 'todo') ?? taskStatuses[0];
  const defPrio = priorities.find((p) => p.code === 'medium') ?? priorities[0];
  const curStatusId = data.status_id ?? defStatus?.id ?? '';
  const curPrioId = data.priority_id ?? defPrio?.id ?? '';

  const fields = {};
  function field(name, label, input, { required } = {}) {
    const errorEl = el('span.field__error');
    fields[name] = { errorEl };
    return el('div.field', {}, [
      el('label.field__label', { text: label + (required ? ' *' : '') }),
      input, errorEl,
    ]);
  }

  const titleInput = el('input.input', { value: data.title, placeholder: 'Task title' });
  const descInput = el('textarea.input.input--textarea', { rows: '3', value: data.description ?? '' });
  const projectSelect = el('select.input', {}, [
    el('option', { value: '', text: 'Select project', selected: !data.project_id }),
    ...projects.map((p) => el('option', { value: p.id, text: `${p.key} · ${p.name}`, selected: p.id === data.project_id })),
  ]);
  const statusSelect = el('select.input', {}, taskStatuses.map((s) =>
    el('option', { value: s.id, text: s.label, selected: s.id === curStatusId })));
  const prioSelect = el('select.input', {}, priorities.map((p) =>
    el('option', { value: p.id, text: p.label, selected: p.id === curPrioId })));
  const assigneeSelect = el('select.input', {}, [
    el('option', { value: '', text: 'Unassigned', selected: !data.assignee_id }),
    ...members.map((m) => el('option', { value: m.id, text: m.full_name, selected: m.id === data.assignee_id })),
  ]);
  const progressInput = el('input.input', { type: 'number', min: '0', max: '100', value: String(data.progress ?? 0) });
  const startInput = el('input.input', { type: 'date', value: data.start_date ?? '' });
  const dueInput = el('input.input', { type: 'date', value: data.due_date ?? '' });

  const submitBtn = el('button.btn.btn--primary', { type: 'submit' }, [initial?.id ? 'Save changes' : 'Create task']);

  const form = el('form.task-form', {
    on: {
      submit: (e) => {
        e.preventDefault();
        onSubmit?.({
          ...data,
          title: titleInput.value,
          description: descInput.value,
          project_id: projectSelect.value || null,
          status_id: statusSelect.value || null,
          priority_id: prioSelect.value || null,
          assignee_id: assigneeSelect.value || null,
          progress: Number(progressInput.value) || 0,
          start_date: startInput.value || null,
          due_date: dueInput.value || null,
        }, { setErrors });
      },
    },
  }, [
    field('title', 'Title', titleInput, { required: true }),
    field('description', 'Description', descInput),
    el('div.form-grid', {}, [
      field('project_id', 'Project', projectSelect, { required: true }),
      field('assignee_id', 'Assignee', assigneeSelect),
    ]),
    el('div.form-grid', {}, [
      field('status_id', 'Status', statusSelect),
      field('priority_id', 'Priority', prioSelect),
    ]),
    el('div.form-grid', {}, [
      field('start_date', 'Start date', startInput),
      field('due_date', 'Due date', dueInput),
    ]),
    field('progress', 'Progress (%)', progressInput),
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
    submitBtn.textContent = on ? 'Saving…' : initial?.id ? 'Save changes' : 'Create task';
  }

  return { node: form, setErrors, setSubmitting };
}
