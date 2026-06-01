/** AllocationForm — assign a member to a project at a given allocation %. */
import { el } from '../../../shared/utils/dom.js';
import { appStore } from '../../../app.store.js';

export function AllocationForm({ onSubmit, onCancel } = {}) {
  const { projects, members } = appStore.getState();
  const fields = {};
  function field(name, label, input, { required } = {}) {
    const errorEl = el('span.field__error');
    fields[name] = { errorEl };
    return el('div.field', {}, [el('label.field__label', { text: label + (required ? ' *' : '') }), input, errorEl]);
  }

  const memberSelect = el('select.input', {}, [
    el('option', { value: '', text: 'Select member' }),
    ...members.map((m) => el('option', { value: m.id, text: m.full_name })),
  ]);
  const projectSelect = el('select.input', {}, [
    el('option', { value: '', text: 'Select project' }),
    ...projects.map((p) => el('option', { value: p.id, text: `${p.key} · ${p.name}` })),
  ]);
  const pctInput = el('input.input', { type: 'number', min: '0', max: '100', value: '100' });
  const startInput = el('input.input', { type: 'date', value: new Date().toISOString().slice(0, 10) });
  const endInput = el('input.input', { type: 'date' });

  const submitBtn = el('button.btn.btn--primary', { type: 'submit' }, ['Add allocation']);
  const form = el('form.allocation-form', {
    on: { submit: (e) => {
      e.preventDefault();
      onSubmit?.({
        member_id: memberSelect.value || null, project_id: projectSelect.value || null,
        allocation_pct: pctInput.value, start_date: startInput.value, end_date: endInput.value,
      }, { setErrors });
    } },
  }, [
    el('div.form-grid', {}, [field('member_id', 'Member', memberSelect, { required: true }), field('project_id', 'Project', projectSelect, { required: true })]),
    field('allocation_pct', 'Allocation (%)', pctInput),
    el('div.form-grid', {}, [field('start_date', 'From', startInput), field('end_date', 'To', endInput)]),
    el('div.form-actions', {}, [
      onCancel && el('button.btn.btn--secondary', { type: 'button', on: { click: onCancel } }, ['Cancel']),
      submitBtn,
    ]),
  ]);

  function setErrors(map = {}) {
    Object.values(fields).forEach((f) => (f.errorEl.textContent = ''));
    for (const [n, msg] of Object.entries(map)) if (fields[n] && msg) fields[n].errorEl.textContent = msg;
  }
  function setSubmitting(on) { submitBtn.disabled = on; submitBtn.textContent = on ? 'Saving…' : 'Add allocation'; }
  return { node: form, setErrors, setSubmitting };
}
