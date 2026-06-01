/**
 * Sidebar — primary navigation. Pure presentation + links (data-link is
 * intercepted by the router). Highlights the active route.
 */
import { el } from '../utils/dom.js';

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
      el('span.sidebar__logo', {}, [el('i.ti.ti-brand-trello', { 'aria-hidden': 'true' })]),
      el('span.sidebar__brand-name', { text: 'Atlas PM' }),
    ]),
    el(
      'nav.sidebar__nav',
      {},
      NAV.map((item) =>
        el('a.sidebar__link', { href: item.href, 'data-link': '', dataset: { href: item.href } }, [
          el(`i.ti.ti-${item.icon}`, { 'aria-hidden': 'true' }),
          el('span', { text: item.label }),
        ])
      )
    ),
  ]);

  function setActive(pathname) {
    node.querySelectorAll('.sidebar__link').forEach((link) => {
      const href = link.dataset.href;
      const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
      link.classList.toggle('sidebar__link--active', active);
    });
  }

  return { node, setActive };
}
