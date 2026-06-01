/**
 * dashboard.view.js — overview screen. Reads from existing feature stores
 * (no new fetch logic) to show high-level counts, a task-status breakdown,
 * and recent activity. Composes other features' state, never re-fetches.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Spinner } from '../../shared/components/spinner.js';
import { Avatar } from '../../shared/components/avatar.js';
import { relativeTime } from '../../shared/utils/format.js';
import { TASK_STATUS } from '../../core/config.js';
import { projectStore } from '../projects/project.store.js';
import { taskStore } from '../tasks/task.store.js';
import { issueStore } from '../issues/issue.store.js';
import { appStore } from '../../app.store.js';

export function DashboardView({ outlet, setTitle, navigate }) {
  setTitle?.('Dashboard');
  const wrap = el('div.page');
  mount(outlet, wrap);
  mount(wrap, el('div.state-center', {}, [Spinner({ label: 'Loading overview…' })]));

  Promise.all([
    projectStore.load().catch(() => []),
    taskStore.load().catch(() => []),
    issueStore.load().catch(() => []),
  ]).then(() => render());

  function render() {
    const projects = projectStore.getState().items;
    const tasks = taskStore.getState().items;
    const issues = issueStore.getState().items;
    const members = appStore.getState().members;
    const r = appStore.getResolver();

    const openTasks = tasks.filter((t) => t.status !== 'done').length;
    const openIssues = issues.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length;

    // ---- Stat cards (icon màu + số) ----
    const stat = (label, value, icon, tone, href) =>
      el('button.stat-card', { type: 'button', on: { click: () => navigate(href) } }, [
        el('span.stat-card__icon', { dataset: { tone } }, [el(`i.ti.ti-${icon}`, { 'aria-hidden': 'true' })]),
        el('span.stat-card__value', { text: String(value) }),
        el('span.stat-card__label', { text: label }),
      ]);

    const statGrid = el('div.stat-grid', {}, [
      stat('Active projects', projects.filter((p) => p.status === 'active').length, 'folder', 'blue', '/projects'),
      stat('Open tasks', openTasks, 'checklist', 'amber', '/tasks'),
      stat('Open issues', openIssues, 'bug', 'red', '/issues'),
      stat('Team members', members.length, 'users', 'green', '/resources'),
    ]);

    // ---- Task status breakdown ----
    const STATUS_BAR_COLOR = {
      todo: 'var(--c-text-muted)', in_progress: 'var(--c-warning)',
      in_review: 'var(--c-info)', done: 'var(--c-success)', blocked: 'var(--c-error)',
    };
    const order = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];
    const counts = order.map((s) => ({ s, n: tasks.filter((t) => t.status === s).length }));
    const total = tasks.length || 1;

    const bar = el('div.breakdown__bar', {}, counts
      .filter((c) => c.n > 0)
      .map((c) => el('span', { style: { width: `${(c.n / total) * 100}%`, background: STATUS_BAR_COLOR[c.s] } })));

    const legend = el('div.breakdown__legend', {}, counts.map((c) =>
      el('div.breakdown__row', {}, [
        el('span.breakdown__label', {}, [
          el('span.breakdown__dot', { style: { background: STATUS_BAR_COLOR[c.s] } }),
          el('span', { text: TASK_STATUS[c.s].label }),
        ]),
        el('span.breakdown__count', { text: String(c.n) }),
      ])));

    const breakdown = el('div.panel', {}, [
      el('div.panel__title', { text: 'Task status breakdown' }),
      bar,
      legend,
    ]);

    // ---- Recent activity (suy ra từ task/issue mới nhất) ----
    const activity = [
      ...tasks.map((t) => ({ at: t.created_at, who: t.reporter_id ?? t.assignee_id, text: `created task “${t.title}”` })),
      ...issues.map((i) => ({ at: i.created_at, who: i.reporter_id ?? i.assignee_id, text: `reported “${i.title}”` })),
    ]
      .filter((a) => a.at)
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, 6);

    const activityPanel = el('div.panel', {}, [
      el('div.panel__title', { text: 'Recent activity' }),
      activity.length
        ? el('div.activity', {}, activity.map((a) => {
            const m = r.member(a.who);
            return el('div.activity__item', {}, [
              Avatar({ name: m?.full_name ?? 'Someone', url: m?.avatar_url, size: 24 }),
              el('div', {}, [
                el('p.activity__text', {}, [
                  el('span', { text: (m?.full_name ?? 'Someone') + ' ' }),
                  el('span.activity__muted', { text: a.text }),
                ]),
                el('p.activity__time', { text: relativeTime(a.at) }),
              ]),
            ]);
          }))
        : el('p.activity__empty', { text: 'No recent activity yet.' }),
    ]);

    mount(wrap, el('div.page', {}, [
      el('h2.page-header__title', { text: 'Overview' }),
      statGrid,
      el('div.dashboard-grid', {}, [breakdown, activityPanel]),
    ]));
  }
}
