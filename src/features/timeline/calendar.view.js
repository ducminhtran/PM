/**
 * calendar.view.js — lịch tháng. Mỗi ô ngày hiện các task có due_date (ưu tiên)
 * hoặc start_date rơi vào ngày đó. Chuyển tháng bằng nút ‹ ›. Vẽ HTML/CSS thuần.
 * Dùng cho theo-project (projectId) lẫn toàn cục (projectId=null).
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Icon } from '../../shared/components/icon.js';
import { Spinner } from '../../shared/components/spinner.js';
import { toast } from '../../shared/components/toast.js';
import { loadTimelineTasks, parseDate } from './timeline.data.js';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export function CalendarView({ outlet, setTitle, projectId = null }) {
  setTitle?.('Calendar');
  let tasks = [];
  let cursor = new Date(); // tháng đang xem
  cursor.setDate(1);

  const page = el('div.page', {}, [
    el('div.page-header', {}, [el('h2.page-header__title', { text: 'Calendar' })]),
    Spinner(),
  ]);
  mount(outlet, page);

  loadTimelineTasks(projectId)
    .then((all) => { tasks = all; render(); })
    .catch((err) => { toast(err.message, 'error'); });

  // gom task theo 'YYYY-M-D' (theo due_date, fallback start_date)
  function tasksOn(year, month, day) {
    return tasks.filter((t) => {
      const d = parseDate(t.due_date) || parseDate(t.start_date);
      return d && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  function render() {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    // ngày đầu tháng rơi vào thứ mấy (chuyển CN=0 -> cuối tuần, T2 đầu)
    const first = new Date(year, month, 1);
    let startCol = first.getDay() - 1; // T2=0
    if (startCol < 0) startCol = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // các ô: đệm đầu + ngày trong tháng
    const cells = [];
    for (let i = 0; i < startCol; i++) cells.push(el('div.cal__cell.cal__cell--pad'));
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayTasks = tasksOn(year, month, d);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
      cells.push(el('div.cal__cell', { class: isToday ? 'cal__cell--today' : '' }, [
        el('span.cal__date', { text: String(d) }),
        el('div.cal__events', {}, dayTasks.slice(0, 4).map((t) => {
          const color = t._priority?.color ?? 'var(--c-brand)';
          return el('div.cal__event', {
            style: { '--ev-color': color },
            title: `${t.title}${projectId ? '' : ' · ' + t._projectKey}`,
          }, [
            projectId ? null : el('span.cal__event-key', { text: t._projectKey }),
            el('span.cal__event-title', { text: t.title }),
          ]);
        }).concat(dayTasks.length > 4 ? [el('span.cal__more', { text: `+${dayTasks.length - 4}` })] : [])),
      ]));
    }

    mount(page,
      el('div.page-header', {}, [
        el('h2.page-header__title', { text: 'Calendar' }),
        el('div.cal__nav', {}, [
          el('button.icon-btn', { type: 'button', title: 'Tháng trước', on: { click: () => move(-1) } }, [Icon('chevron-left', { size: 16 })]),
          el('span.cal__title', { text: `${MONTHS[month]} ${year}` }),
          el('button.icon-btn', { type: 'button', title: 'Tháng sau', on: { click: () => move(1) } }, [Icon('chevron-right', { size: 16 })]),
          el('button.btn.btn--secondary', { type: 'button', on: { click: goToday } }, ['Hôm nay']),
        ]),
      ]),
      el('div.cal', {}, [
        el('div.cal__weekdays', {}, WEEKDAYS.map((w) => el('div.cal__weekday', { text: w }))),
        el('div.cal__grid', {}, cells),
      ]),
    );
  }

  function move(delta) { cursor.setMonth(cursor.getMonth() + delta); render(); }
  function goToday() { cursor = new Date(); cursor.setDate(1); render(); }

  return () => {};
}
