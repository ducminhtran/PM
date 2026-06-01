/**
 * router.js — a tiny History-API router.
 */
export function createRouter({ outlet, routes, notFound }) {
  // Base path the app is served under (e.g. '/PM/' on GitHub Pages, '/' locally).
  const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, ''); // -> '/PM' or ''

  const stripBase = (path) => {
    if (BASE && path.startsWith(BASE)) return path.slice(BASE.length) || '/';
    return path || '/';
  };
  const withBase = (path) => `${BASE}${path.startsWith('/') ? path : '/' + path}`;

  const compiled = routes.map((r) => ({
    ...r,
    ...compile(r.pattern),
  }));

  function compile(pattern) {
    const keys = [];
    const regex = new RegExp(
      '^' +
        pattern
          .replace(/\//g, '\\/')
          .replace(/:(\w+)/g, (_, k) => {
            keys.push(k);
            return '([^\\/]+)';
          }) +
        '\\/?$'
    );
    return { regex, keys };
  }

  function parseQuery(search) {
    return Object.fromEntries(new URLSearchParams(search));
  }

  function match(path) {
    for (const route of compiled) {
      const m = route.regex.exec(path);
      if (m) {
        const params = {};
        route.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        return { route, params };
      }
    }
    return null;
  }

  let currentCleanup = null;

  async function render() {
    const path = stripBase(window.location.pathname);
    const query = parseQuery(window.location.search);
    const matched = match(path);

    if (typeof currentCleanup === 'function') {
      try { currentCleanup(); } catch { /* ignore cleanup errors */ }
      currentCleanup = null;
    }

    if (!matched) {
      currentCleanup = await notFound?.({ outlet, path });
      return;
    }
    currentCleanup = await matched.route.handler({
      outlet,
      params: matched.params,
      query,
    });
  }

  function navigate(to, { replace = false } = {}) {
    const target = withBase(to);
    if (target === window.location.pathname + window.location.search) return;
    if (replace) window.history.replaceState({}, '', target);
    else window.history.pushState({}, '', target);
    render();
  }

  function start() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-link]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      e.preventDefault();
      navigate(href);
    });
    window.addEventListener('popstate', render);
    render();
  }

  return { start, navigate, render };
}
