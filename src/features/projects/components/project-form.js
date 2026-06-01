/**
 * ProjectForm — a controlled form for create/edit. Emits the form object via
 * onSubmit; shows inline field errors. Knows nothing about the store or API —
 * the view wires it to the store.
 */
import { el } from '../../../shared/utils/dom.js';
import { emptyProject } from '../project.model.js';
import { PROJECT_STATUS } from '../../../core/config.js';
import { appStore } from '../../../app.store.js';

export function ProjectForm({ initial, onSubmit, onCancel } = {}) {
  const data = { ...emptyProject(), ...initial };
  const members = appStore.getState().members;
  const errors = {};

  const fields = {};

  function field(name, label, inputNode, { required } = {}) {
    const errorEl = el('span.field__error');
    const wrap = el('div.field', {}, [
      el('label.field__label', { text: label + (required ? ' *' : '') }),
      inputNode,
      errorEl,
    ]);
    fields[name] = { inputNode, errorEl };
    return wrap;
  }

  const keyInput = el('input.input', { value: data.key, placeholder: 'ATL', maxlength: '10' });
  const nameInput = el('input.input', { value: data.name, placeholder: 'Project name' });
  const descInput = el('textarea.input.input--textarea', { rows: '3', value: data.description ?? '' });
  const statusSelect = el(
    'select.input',
    { value: data.status },
    Object.entries(PROJECT_STATUS).map(([val, cfg]) =>
      el('option', { value: val, text: cfg.label, selected: val === data.status })
    )
  );
  const leadSelect = el(
    'select.input',
    {},
    [
      el('option', { value: '', text: 'Unassigned', selected: !data.lead_id }),
      ...members.map((m) =>
        el('option', { value: m.id, text: m.full_name, selected: m.id === data.lead_id })
      ),
    ]
  );
  const startInput = el('input.input', { type: 'date', value: data.start_date ?? '' });
  const endInput = el('input.input', { type: 'date', value: data.end_date ?? '' });

  const submitBtn = el('button.btn.btn--primary', { type: 'submit' }, [initial?.id ? 'Save changes' : 'Create project']);

  const form = el('form.project-form', {
    on: {
      submit: (e) => {
        e.preventDefault();
        const payload = {
          ...data,
          key: keyInput.value,
          name: nameInput.value,
          description: descInput.value,
          status: statusSelect.value,
          lead_id: leadSelect.value || null,
          start_date: startInput.value || null,
          end_date: endInput.value || null,
        };
        onSubmit?.(payload, { setErrors });
      },
    },
  }, [
    el('div.form-grid', {}, [
      field('name', 'Name', nameInput, { required: true }),
      field('key', 'Key', keyInput, { required: true }),
    ]),
    field('description', 'Description', descInput),
    el('div.form-grid', {}, [
      field('status', 'Status', statusSelect),
      field('lead_id', 'Lead', leadSelect),
    ]),
    el('div.form-grid', {}, [
      field('start_date', 'Start date', startInput),
      field('end_date', 'End date', endInput),
    ]),
    el('div.form-actions', {}, [
      onCancel && el('button.btn.btn--secondary', { type: 'button', on: { click: onCancel } }, ['Cancel']),
      submitBtn,
    ]),
  ]);

  function setErrors(map = {}) {
    Object.values(fields).forEach((f) => (f.errorEl.textContent = ''));
    for (const [name, msg] of Object.entries(map)) {
      if (fields[name]) fields[name].errorEl.textContent = msg;
    }
  }

  function setSubmitting(on) {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Saving…' : initial?.id ? 'Save changes' : 'Create project';
  }

  return { node: form, setErrors, setSubmitting };
}
