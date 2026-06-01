/** Topbar — page title + global search placeholder + current user avatar. */
import { el } from '../utils/dom.js';
import { Icon } from '../components/icon.js';
import { Avatar } from '../components/avatar.js';

export function Topbar({ user } = {}) {
  const titleEl = el('h1.topbar__title', { text: '' });
  const node = el('header.topbar', {}, [
    titleEl,
    el('div.topbar__actions', {}, [
      el('div.topbar__search', {}, [
        Icon('search', { size: 16 }),
        el('input.topbar__search-input', { type: 'search', placeholder: 'Search…', 'aria-label': 'Search' }),
      ]),
      Avatar({ name: user?.full_name ?? 'Guest', url: user?.avatar_url, size: 30 }),
    ]),
  ]);
  function setTitle(t) { titleEl.textContent = t; }
  return { node, setTitle };
}
