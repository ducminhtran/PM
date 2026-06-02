/**
 * IconPicker — lưới icon bấm chọn. Thay cho ô gõ tên icon tự do.
 * Hiển thị các icon trong PICKABLE_ICONS; bấm để chọn; icon đang chọn được
 * tô sáng. getValue() trả về tên icon đang chọn.
 */
import { el } from '../utils/dom.js';
import { Icon, PICKABLE_ICONS } from './icon.js';

export function IconPicker({ value } = {}) {
  let selected = value || PICKABLE_ICONS[0];

  const grid = el('div.icon-picker');
  const buttons = new Map();

  function renderButtons(list) {
    grid.replaceChildren(...list.map((name) => {
      const btn = el('button.icon-picker__item', {
        type: 'button', title: name,
        on: { click: () => select(name) },
      }, [Icon(name, { size: 18 })]);
      if (name === selected) btn.classList.add('icon-picker__item--active');
      buttons.set(name, btn);
      return btn;
    }));
  }

  function select(name) {
    selected = name;
    buttons.forEach((b, n) => b.classList.toggle('icon-picker__item--active', n === name));
  }

  const search = el('input.input.icon-picker__search', {
    type: 'search', placeholder: 'Lọc icon…',
    on: {
      input: (e) => {
        const q = e.target.value.trim().toLowerCase();
        renderButtons(q ? PICKABLE_ICONS.filter((n) => n.includes(q)) : PICKABLE_ICONS);
      },
    },
  });

  renderButtons(PICKABLE_ICONS);

  const node = el('div.icon-picker__wrap', {}, [search, grid]);

  return { node, getValue: () => selected };
}
