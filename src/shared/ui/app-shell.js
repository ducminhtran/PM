/**
 * AppShell — assembles sidebar + topbar + content outlet. This is the only
 * "big layout" in the app. index.html mounts this once; routes render into
 * the outlet. The shell holds no business logic.
 */
import { el } from '../utils/dom.js';
import { Sidebar } from './sidebar.js';
import { Topbar } from './topbar.js';

export function AppShell({ user } = {}) {
  const sidebar = Sidebar();
  const topbar = Topbar({ user });
  const outlet = el('main.content-outlet', { id: 'outlet' });

  const node = el('div.app-shell', {}, [
    sidebar.node,
    el('div.app-main', {}, [topbar.node, outlet]),
  ]);

  return {
    node,
    outlet,
    setActiveNav: sidebar.setActive,
    setTitle: topbar.setTitle,
  };
}
