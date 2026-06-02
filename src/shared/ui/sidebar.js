/**
 * Sidebar — điều hướng phụ, đổi nội dung theo context (kiểu Jira).
 *
 * - scope 'project': hiện header project + Dashboard/Board/Backlog/Issues
 *   (các link trỏ /projects/:id/...).
 * - scope 'global': hiện các mục toàn cục (Projects, Resources).
 *
 * Pure presentation. Lấy tên project từ appStore để hiện header.
 */
import { el, mount } from '../utils/dom.js';
import { Icon } from '../components/icon.js';
import { appStore } from '../../app.store.js';

const PROJECT_NAV = [
  { section: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { section: 'board',     label: 'Board',     icon: 'layout-kanban' },
  { section: 'backlog',   label: 'Backlog',   icon: 'list' },
  { section: 'issues',    label: 'Issues',    icon: 'bug' },
];

const GLOBAL_NAV = [
  { section: 'projects',  label: 'Projects',  icon: 'folder', href: '/projects' },
  { section: 'resources', label: 'Resources', icon: 'users',  href: '/resources' },
  { section: 'settings',  label: 'Categories', icon: 'check', href: '/settings/categories' },
];

export function Sidebar() {
  const node = el('aside.sidebar');

  function render(context = { scope: 'global', section: 'projects' }) {
    if (context.scope === 'project' && context.projectId) {
      renderProject(context);
    } else {
      renderGlobal(context);
    }
  }

  function renderProject({ projectId, section }) {
    const project = appStore.getResolver().project(projectId);
    const key = project?.key ?? '—';
    const name = project?.name ?? 'Project';

    mount(node,
      el('div.sidebar__project', {}, [
        el('span.sidebar__project-badge', { text: key.slice(0, 2).toUpperCase() }),
        el('div', {}, [
          el('p.sidebar__project-name', { text: name }),
          el('p.sidebar__project-type', { text: 'Software project' }),
        ]),
      ]),
      el('nav.sidebar__nav', {}, PROJECT_NAV.map((item) => {
        const href = `/projects/${projectId}/${item.section}`;
        const a = el('a.sidebar__link', { href, 'data-link': '', dataset: { section: item.section } }, [
          Icon(item.icon, { size: 17 }),
          el('span', { text: item.label }),
        ]);
        if (item.section === section) a.classList.add('sidebar__link--active');
        return a;
      }))
    );
  }

  function renderGlobal({ section }) {
    mount(node,
      el('div.sidebar__heading', { text: 'Workspace' }),
      el('nav.sidebar__nav', {}, GLOBAL_NAV.map((item) => {
        const a = el('a.sidebar__link', { href: item.href, 'data-link': '', dataset: { section: item.section } }, [
          Icon(item.icon, { size: 17 }),
          el('span', { text: item.label }),
        ]);
        if (item.section === section) a.classList.add('sidebar__link--active');
        return a;
      }))
    );
  }

  return { node, render };
}
