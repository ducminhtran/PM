/**
 * router.js — a tiny History-API router.
 *
 * Routes are declared as { pattern, handler }. Patterns support :params
 * (e.g. '/projects/:id'). The handler receives ({ params, query }) and is
 * responsible for rendering into the outlet.
 *
 * Why not hash routing? History API gives clean URLs and works with Vite's
 * dev server + a SPA fallback in production. The trade-off is that the host
 * must serve index.html for unknown paths (configured in vite/host).
 */
export function createRouter({ outlet, routes, notFound }) {
  // Base path the app is served under (e.g. '/PM/' on GitHub Pages, '/' locally).
  // Vite injects BASE_URL from vite.config's `base`. We strip it when reading the
  // URL and re-add it when navigating, so routes can stay declared as '/projects'.
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

    // Let the previous view tear down (unsubscribe stores, remove listeners).
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
    // Intercept internal link clicks (data-link or <a> within app).
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
