/**
 * main.js — the entry point. Responsibilities, in order:
 *   1. mount the global toast layer
 *   2. (optionally) check Supabase auth; for an internal tool we sign in
 *      anonymously-ish by just proceeding — real auth is wired here later
 *   3. load reference data (members, projects) so resolvers work everywhere
 *   4. build the app shell and start the router
 *
 * It holds NO business logic and NO rendering beyond the shell. index.html
 * just imports this module.
 */
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { hasSupabase } from './core/config.js';
import { createRouter } from './core/router.js';
import { AppShell } from './shared/ui/app-shell.js';
import { mountToasts, toast } from './shared/components/toast.js';
import { appStore } from './app.store.js';
import { createRoutes } from './routes.js';

async function bootstrap() {
  const root = document.getElementById('app');
  mountToasts();

  if (!hasSupabase) {
    root.append(
      Object.assign(document.createElement('div'), {
        className: 'fatal',
        innerHTML:
          '<h1>Backend not configured</h1>' +
          '<p>Create <code>.env.local</code> with <code>VITE_SUPABASE_URL</code> and ' +
          '<code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server.</p>',
      })
    );
    return;
  }

  // Load reference data first; the UI relies on resolvers being populated.
  try {
    await appStore.loadReferenceData();
  } catch (err) {
    toast('Failed to load reference data: ' + err.message, 'error');
  }

  const shell = AppShell({ user: appStore.getState().currentUser });
  root.replaceChildren(shell.node);

  const router = createRouter({
    outlet: shell.outlet,
    routes: createRoutes({
      navigate: (to, opts) => router.navigate(to, opts),
      setTitle: shell.setTitle,
      setActiveNav: shell.setActiveNav,
    }),
    notFound: ({ outlet }) => {
      outlet.replaceChildren(
        Object.assign(document.createElement('div'), {
          className: 'page state-center',
          innerHTML: '<h2>404</h2><p>Page not found.</p>',
        })
      );
    },
  });

  router.start();
}

bootstrap();
