/**
 * CategoryForm — form thêm/sửa một mục danh mục.
 * Màu chọn từ danh sách BIẾN CSS hệ thống (lưu dạng 'var(--c-...)'), kèm chấm
 * xem trước — không dùng hex. Trường hiển thị tùy loại (icon/tone).
 */
import { el } from '../../../shared/utils/dom.js';
import { CATEGORY_TYPES } from '../category.service.js';

const TONES = ['neutral', 'blue', 'amber', 'green', 'red', 'purple'];

// Bảng màu hệ thống (biến CSS) cho người dùng chọn.
const COLOR_OPTIONS = [
  { value: 'var(--c-brand)',          label: 'Brand (xanh)' },
  { value: 'var(--c-info)',           label: 'Info (xanh dương)' },
  { value: 'var(--c-cyan)',           label: 'Cyan (xanh sáng)' },
  { value: 'var(--c-navy)',           label: 'Navy (xanh đậm)' },
  { value: 'var(--c-teal)',           label: 'Teal' },
  { value: 'var(--c-success)',        label: 'Success (xanh lá)' },
  { value: 'var(--c-lime)',           label: 'Lime (xanh cốm)' },
  { value: 'var(--c-warning)',        label: 'Warning (vàng)' },
  { value: 'var(--c-orange)',         label: 'Orange (cam)' },
  { value: 'var(--c-error)',          label: 'Error (đỏ)' },
  { value: 'var(--c-magenta)',        label: 'Magenta' },
  { value: 'var(--c-pink)',           label: 'Pink (hồng)' },
  { value: 'var(--c-purple)',         label: 'Purple (tím)' },
  { value: 'var(--c-text-secondary)', label: 'Grey đậm' },
  { value: 'var(--c-text-muted)',     label: 'Grey nhạt' },
  { value: 'var(--c-black)',          label: 'Black (đen)' },
];

export function CategoryForm({ typeKey, initial, onSubmit, onCancel } = {}) {
  const def = CATEGORY_TYPES[typeKey];
  const data = { label: '', color: 'var(--c-info)', tone: 'neutral', icon: '', position: 0, ...initial };
  const fields = {};

  function field(name, label, input) {
    const errorEl = el('span.field__error');
    fields[name] = { errorEl };
    return el('div.field', {}, [el('label.field__label', { text: label }), input, errorEl]);
  }

  const labelInput = el('input.input', { value: data.label, placeholder: 'Display name' });
  const posInput = el('input.input', { type: 'number', value: String(data.position ?? 0) });
  const inputs = [field('label', 'Label', labelInput)];

  // Màu: dropdown biến CSS + chấm xem trước (cho loại có dùng màu)
  let colorSelect, swatch, toneSelect;
  if (def.fields.includes('color')) {
    const known = COLOR_OPTIONS.some((o) => o.value === data.color);
    colorSelect = el('select.input', {}, [
      ...COLOR_OPTIONS.map((o) => el('option', { value: o.value, text: o.label, selected: o.value === data.color })),
      // nếu giá trị cũ lạ (không trong danh sách), vẫn giữ làm 1 option
      ...(known ? [] : [el('option', { value: data.color, text: data.color, selected: true })]),
    ]);
    swatch = el('span.cat-swatch', { style: { background: data.color } });
    colorSelect.addEventListener('change', () => { swatch.style.background = colorSelect.value; });

    const colorField = el('div.field', {}, [
      el('label.field__label', { text: 'Color' }),
      el('div.color-pick', {}, [swatch, colorSelect]),
      el('span.field__error'),
    ]);

    toneSelect = el('select.input', {}, TONES.map((t) =>
      el('option', { value: t, text: t, selected: t === data.tone })));
    inputs.push(el('div.form-grid', {}, [colorField, field('tone', 'Tone (badge)', toneSelect)]));
  }

  // Icon (priorities, issue types)
  let iconInput;
  if (def.hasIcon) {
    iconInput = el('input.input', { value: data.icon ?? '', placeholder: 'vd: arrow-up, bug, check' });
    inputs.push(field('icon', 'Icon', iconInput));
  }

  inputs.push(field('position', 'Order', posInput));

  const submitBtn = el('button.btn.btn--primary', { type: 'submit' }, [initial?.id ? 'Save' : 'Add']);

  const form = el('form.category-form', {
    on: {
      submit: (e) => {
        e.preventDefault();
        const payload = { ...data, label: labelInput.value, position: Number(posInput.value) || 0 };
        if (colorSelect) payload.color = colorSelect.value; // 'var(--c-...)'
        if (toneSelect) payload.tone = toneSelect.value;
        if (iconInput) payload.icon = iconInput.value || null;
        onSubmit?.(payload, { setErrors });
      },
    },
  }, [
    ...inputs,
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
    submitBtn.textContent = on ? 'Saving…' : initial?.id ? 'Save' : 'Add';
  }

  return { node: form, setErrors, setSubmitting };
}
