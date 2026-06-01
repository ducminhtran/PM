/**
 * AppShell — bố cục tổng kiểu Jira:
 *   [ global nav xanh — full width ]
 *   [ sidebar trắng | content outlet ]
 *
 * setContext nhận { scope, projectId, section } từ router để:
 *   - vẽ lại sidebar đúng (trong project / toàn cục)
 *   - tô sáng link toàn cục trên global nav
 * Shell không chứa business logic.
 */
import { el } from '../utils/dom.js';
import { Sidebar } from './sidebar.js';
import { Topbar } from './topbar.js';

export function AppShell({ user, onCreate } = {}) {
  const topbar = Topbar({ user, onCreate });
  const sidebar = Sidebar();
  const outlet = el('main.content-outlet', { id: 'outlet' });

  const node = el('div.app-root', {}, [
    topbar.node,
    el('div.app-body', {}, [
      sidebar.node,
      outlet,
    ]),
  ]);

  function setContext(context) {
    sidebar.render(context);
    topbar.setActive(window.location.pathname);
  }

  return {
    node,
    outlet,
    setContext,
    setTitle: topbar.setTitle,
  };
}
