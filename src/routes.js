/**
 * routes.js — the route table.
 *
 * Each route lazily imports its view (code-splitting via dynamic import, so a
 * feature's JS only loads when navigated to — a real performance win as the
 * app grows). The handler returns the view's cleanup function (if any) so the
 * router can tear it down on navigation.
 *
 * Views are given { outlet, params, query } plus shell helpers injected here.
 */
export function createRoutes({ navigate, setTitle, setActiveNav }) {
  const withShell = (fn) => async (ctx) => {
    setActiveNav(window.location.pathname);
    return fn({ ...ctx, navigate, setTitle });
  };

  return [
    {
      pattern: '/',
      handler: withShell(async (ctx) => {
        const { DashboardView } = await import('./features/dashboard/dashboard.view.js');
        return DashboardView(ctx);
      }),
    },
    {
      pattern: '/projects',
      handler: withShell(async (ctx) => {
        const { ProjectsView } = await import('./features/projects/project.view.js');
        return ProjectsView(ctx);
      }),
    },
    {
      pattern: '/projects/:id',
      handler: withShell(async (ctx) => {
        const { ProjectDetailView } = await import('./features/projects/project-detail.view.js');
        return ProjectDetailView(ctx);
      }),
    },
    {
      pattern: '/tasks',
      handler: withShell(async (ctx) => {
        const { TasksView } = await import('./features/tasks/task.view.js');
        return TasksView(ctx);
      }),
    },
    {
      pattern: '/issues',
      handler: withShell(async (ctx) => {
        const { IssuesView } = await import('./features/issues/issue.view.js');
        return IssuesView(ctx);
      }),
    },
    {
      pattern: '/resources',
      handler: withShell(async (ctx) => {
        const { ResourcesView } = await import('./features/resources/resource.view.js');
        return ResourcesView(ctx);
      }),
    },
  ];
}
