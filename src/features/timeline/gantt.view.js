/**
 * gantt.view.js — biểu đồ Gantt. Mỗi task là một thanh ngang từ start_date đến
 * due_date trên trục thời gian theo tuần. Vẽ bằng HTML/CSS thuần (không thư
 * viện). Dùng cho cả theo-project (projectId) lẫn toàn cục (projectId=null).
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Spinner } from '../../shared/components/spinner.js';
import { emptyState } from '../../shared/components/empty-state.js';
import { toast } from '../../shared/components/toast.js';
import { loadTimelineTasks, withDates, parseDate, daysBetween, addDays } from './timeline.data.js';

const DAY_W = 28; // px mỗi ngày

export function GanttView({ outlet, setTitle, projectId = null }) {
  setTitle?.('Gantt');
  const page = el('div.page', {}, [
    el('div.page-header', {}, [el('h2.page-header__title', { text: 'Gantt' })]),
    Spinner(),
  ]);
  mount(outlet, page);

  loadTimelineTasks(projectId)
    .then((all) => {
      const tasks = withDates(all).sort((a, b) => {
        const sa = parseDate(a.start_date || a.due_date);
        const sb = parseDate(b.start_date || b.due_date);
        return sa - sb;
      });
      render(tasks);
    })
    .catch((err) => { toast(err.message, 'error'); mount(page, header(), emptyState('Không tải được dữ liệu', { icon: 'alert-circle' })); });

  function header() {
    return el('div.page-header', {}, [el('h2.page-header__title', { text: 'Gantt' })]);
  }

  function render(tasks) {
    if (!tasks.length) {
      mount(page, header(), emptyState('Chưa có task nào có ngày bắt đầu hoặc hạn', { icon: 'checklist' }));
      return;
    }

    // Trục thời gian: từ ngày sớm nhất tới muộn nhất (đệm 2 ngày mỗi bên)
    let min = null, max = null;
    for (const t of tasks) {
      const s = parseDate(t.start_date) || parseDate(t.due_date);
      const e = parseDate(t.due_date) || parseDate(t.start_date);
      if (!min || s < min) min = s;
      if (!max || e > max) max = e;
    }
    min = addDays(min, -2);
    max = addDays(max, 2);
    const totalDays = daysBetween(min, max) + 1;

    // Header ngày (đánh dấu mỗi ngày, ghi nhãn đầu mỗi tuần)
    const dayCells = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(min, i);
      const isMon = d.getDay() === 1;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      dayCells.push(el('div.gantt__day', { class: isWeekend ? 'gantt__day--weekend' : '', style: { width: `${DAY_W}px` } }, [
        isMon ? el('span.gantt__day-label', { text: `${d.getDate()}/${d.getMonth() + 1}` }) : null,
      ]));
    }

    // Hàng task
    const rows = tasks.map((t) => {
      const s = parseDate(t.start_date) || parseDate(t.due_date);
      const e = parseDate(t.due_date) || parseDate(t.start_date);
      const offset = daysBetween(min, s);
      const span = Math.max(1, daysBetween(s, e) + 1);
      const color = t._priority?.color ?? 'var(--c-brand)';
      const pct = Math.max(0, Math.min(100, t.progress ?? 0));

      const bar = el('div.gantt__bar', {
        style: { left: `${offset * DAY_W}px`, width: `${span * DAY_W}px`, '--bar-color': color },
        title: `${t.title} · ${t.start_date ?? '?'} → ${t.due_date ?? '?'} · ${pct}%`,
      }, [
        el('span.gantt__bar-fill', { style: { width: `${pct}%` } }),
        el('span.gantt__bar-label', { text: t.title }),
      ]);

      return el('div.gantt__row', {}, [
        el('div.gantt__row-name', {}, [
          projectId ? null : el('span.mono.gantt__row-key', { text: t._projectKey }),
          el('span', { text: t.title }),
        ]),
        el('div.gantt__row-track', { style: { width: `${totalDays * DAY_W}px` } }, [bar]),
      ]);
    });

    mount(page,
      header(),
      el('div.gantt', {}, [
        el('div.gantt__head', {}, [
          el('div.gantt__head-spacer', { text: 'Task' }),
          el('div.gantt__head-days', { style: { width: `${totalDays * DAY_W}px` } }, dayCells),
        ]),
        el('div.gantt__body', {}, rows),
      ]),
    );
  }

  return () => {};
}
