/**
 * Table — a reusable, config-driven data table.
 *
 * Columns are declared as { key, header, render?, width?, align? }. `render`
 * receives (row) and returns a Node or string, so columns can resolve relation
 * IDs to badges/avatars without the table knowing anything about the domain.
 *
 * Row clicks are delegated through one listener (no per-row inline handlers).
 */
import { el } from '../utils/dom.js';

/**
 * @param {object} cfg
 * @param {Array<{key:string, header:string, render?:Function, width?:string, align?:string}>} cfg.columns
 * @param {Array<object>} cfg.rows
 * @param {(row:object)=>void} [cfg.onRowClick]
 * @param {(row:object)=>string} [cfg.rowKey] - defaults to row.id
 */
export function Table({ columns, rows, onRowClick, rowKey = (r) => r.id } = {}) {
  const thead = el('thead', {}, [
    el(
      'tr',
      {},
      columns.map((col) =>
        el('th', {
          text: col.header,
          style: {
            width: col.width ?? 'auto',
            textAlign: col.align ?? 'left',
          },
        })
      )
    ),
  ]);

  const tbody = el('tbody');
  for (const row of rows) {
    const tr = el('tr.table__row', { dataset: { key: rowKey(row) } });
    if (onRowClick) {
      tr.classList.add('table__row--clickable');
      tr.addEventListener('click', () => onRowClick(row));
    }
    for (const col of columns) {
      const content = col.render ? col.render(row) : row[col.key];
      tr.append(
        el('td', { style: { textAlign: col.align ?? 'left' } }, [
          content instanceof Node ? content : document.createTextNode(content ?? '—'),
        ])
      );
    }
    tbody.append(tr);
  }

  return el('table.table', {}, [thead, tbody]);
}
