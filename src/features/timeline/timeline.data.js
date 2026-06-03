/**
 * timeline.data.js — helper load task cho Gantt/Calendar/Report.
 *
 * Các view này chỉ ĐỌC (xem, không sửa) nên gọi service trực tiếp, load một
 * lần — không dùng taskStore (tránh đá cache với Board). Trả về task kèm
 * thông tin đã resolve sẵn (status, priority, project) để view vẽ ngay.
 */
import { taskService } from '../tasks/task.service.js';
import { appStore } from '../../app.store.js';

/**
 * Load task theo project (projectId) hoặc toàn cục (projectId = null).
 * @returns {Promise<Array>} task đã gắn _status/_priority/_projectKey/_projectName
 */
export async function loadTimelineTasks(projectId = null) {
  const tasks = await taskService.list(projectId ? { projectId } : {});
  const r = appStore.getResolver();
  return tasks.map((t) => ({
    ...t,
    _status: r.taskStatus(t.status_id),
    _priority: r.priority(t.priority_id),
    _projectKey: r.projectKey(t.project_id),
    _projectName: r.projectName(t.project_id),
    _assignee: r.member(t.assignee_id),
  }));
}

/** Lọc task có đủ mốc thời gian để vẽ trên trục (Gantt/Calendar). */
export function withDates(tasks) {
  return tasks.filter((t) => t.start_date || t.due_date);
}

/** Parse 'YYYY-MM-DD' -> Date (00:00 local). Trả null nếu rỗng. */
export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Số ngày giữa 2 Date (b - a), làm tròn xuống. */
export function daysBetween(a, b) {
  return Math.floor((b - a) / 86400000);
}

/** Cộng n ngày vào Date, trả Date mới. */
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
