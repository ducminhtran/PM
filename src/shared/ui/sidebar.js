/**
 * Sidebar — primary navigation. Pure presentation + links (data-link is
 * intercepted by the router). Highlights the active route.
 */
import { el } from '../utils/dom.js';
import { Icon } from '../components/icon.js';

const NAV = [
  { href: '/', label: 'Dashboard', icon: 'layout-dashboard' },
  { href: '/projects', label: 'Projects', icon: 'folder' },
  { href: '/tasks', label: 'Tasks', icon: 'checklist' },
  { href: '/issues', label: 'Issues', icon: 'bug' },
  { href: '/resources', label: 'Resources', icon: 'users' },
];

export function Sidebar() {
  const node = el('aside.sidebar', {}, [
    el('div.sidebar__brand', {}, [
      el('span.sidebar__logo', { text: 'A' }),
      el('span.sidebar__brand-name', { text: 'Atlas PM' }),
    ]),
    el(
      'nav.sidebar__nav',
      {},
      NAV.map((item) =>
        el('a.sidebar__link', { href: item.href, 'data-link': '', dataset: { href: item.href } }, [
          Icon(item.icon, { size: 18 }),
          el('span', { text: item.label }),
        ])
      )
    ),
  ]);

  function setActive(pathname) {
    // Normalize away the base path (e.g. '/PM') so comparison works on Pages
    // and locally alike. We strip Vite's BASE_URL prefix if present.
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    let path = pathname;
    if (base && path.startsWith(base)) path = path.slice(base.length) || '/';

    node.querySelectorAll('.sidebar__link').forEach((link) => {
      const href = link.dataset.href;
      const active = href === '/' ? path === '/' : path.startsWith(href);
      link.classList.toggle('sidebar__link--active', active);
    });
  }

  return { node, setActive };
}
