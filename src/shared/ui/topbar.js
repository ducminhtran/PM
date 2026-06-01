/**
 * Topbar — global navigation bar kiểu Jira (nền xanh đậm).
 * Chứa: logo/tên app, link toàn cục (Your work / Projects), nút Create,
 * ô search, và avatar. Đây là điều hướng cấp cao nhất, luôn hiển thị.
 */
import { el } from '../utils/dom.js';
import { Icon } from '../components/icon.js';
import { Avatar } from '../components/avatar.js';

export function Topbar({ user, onCreate } = {}) {
  const link = (label, href) =>
    el('a.topnav__link', { href, 'data-link': '', dataset: { href }, text: label });

  const node = el('header.topnav', {}, [
    el('a.topnav__brand', { href: '/', 'data-link': '' }, [
      el('span.topnav__logo', { text: 'A' }),
      el('span.topnav__brand-name', { text: 'Atlas PM' }),
    ]),
    link('Your work', '/'),
    link('Projects', '/projects'),
    el('button.topnav__create', { type: 'button', on: { click: () => onCreate?.() } }, [
      Icon('plus', { size: 15 }), 'Create',
    ]),
    el('div.topnav__spacer'),
    el('div.topnav__search', {}, [
      Icon('search', { size: 15 }),
      el('input.topnav__search-input', { type: 'search', placeholder: 'Search', 'aria-label': 'Search' }),
    ]),
    Avatar({ name: user?.full_name ?? 'Guest', url: user?.avatar_url, size: 28 }),
  ]);

  // setTitle giữ API cũ nhưng global nav không có chỗ hiện title -> no-op nhẹ.
  function setTitle() {}

  function setActive(pathname) {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    let path = pathname;
    if (base && path.startsWith(base)) path = path.slice(base.length) || '/';
    node.querySelectorAll('.topnav__link').forEach((a) => {
      const href = a.dataset.href;
      const active = href === '/' ? path === '/' : path.startsWith(href);
      a.classList.toggle('topnav__link--active', active);
    });
  }

  return { node, setTitle, setActive };
}
