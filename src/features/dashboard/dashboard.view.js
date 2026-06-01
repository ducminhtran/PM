/**
 * dashboard.view.js — overview screen. Reads from existing feature stores
 * (no new fetch logic) to show high-level counts. Demonstrates that the
 * dashboard composes other features' state rather than duplicating it.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Spinner } from '../../shared/components/spinner.js';
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

    const openTasks = tasks.filter((t) => t.status !== 'done').length;
    const openIssues = issues.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length;

    const stat = (label, value, icon, href) =>
      el('button.stat-card', { type: 'button', on: { click: () => navigate(href) } }, [
        el('span.stat-card__icon', {}, [el(`i.ti.ti-${icon}`, { 'aria-hidden': 'true' })]),
        el('span.stat-card__value', { text: String(value) }),
        el('span.stat-card__label', { text: label }),
      ]);

    mount(wrap, el('div.page', {}, [
      el('h2.page-header__title', { text: 'Overview' }),
      el('div.stat-grid', {}, [
        stat('Active projects', projects.filter((p) => p.status === 'active').length, 'folder', '/projects'),
        stat('Open tasks', openTasks, 'checklist', '/tasks'),
        stat('Open issues', openIssues, 'bug', '/issues'),
        stat('Team members', members.length, 'users', '/resources'),
      ]),
    ]));
  }
}
