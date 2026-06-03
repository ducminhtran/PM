/**
 * routes.js — bảng route.
 *
 * Mô hình điều hướng kiểu Jira: phần lớn màn hình nằm TRONG bối cảnh một
 * project (/projects/:id/...). Global nav lo phần toàn cục (danh sách project,
 * dashboard tổng, resources). Sidebar đổi nội dung tùy đang ở trong project
 * hay ở khu vực toàn cục.
 *
 * Mỗi route lazy-import view (code-splitting). Handler trả về hàm cleanup để
 * router gỡ khi rời trang. setContext báo cho shell biết đang ở đâu để vẽ
 * sidebar đúng.
 */
export function createRoutes({ navigate, setTitle, setContext }) {
  const inProject = (section, fn) => async (ctx) => {
    setContext({ scope: 'project', projectId: ctx.params.id, section });
    return fn({ ...ctx, navigate, setTitle });
  };
  const global = (section, fn) => async (ctx) => {
    setContext({ scope: 'global', section });
    return fn({ ...ctx, navigate, setTitle });
  };

  return [
    {
      pattern: '/',
      handler: global('your-work', async (ctx) => {
        const { DashboardView } = await import('./features/dashboard/dashboard.view.js');
        return DashboardView(ctx);
      }),
    },
    {
      pattern: '/projects',
      handler: global('projects', async (ctx) => {
        const { ProjectsView } = await import('./features/projects/project.view.js');
        return ProjectsView(ctx);
      }),
    },
    {
      pattern: '/resources',
      handler: global('resources', async (ctx) => {
        const { ResourcesView } = await import('./features/resources/resource.view.js');
        return ResourcesView(ctx);
      }),
    },
    {
      pattern: '/settings/categories',
      handler: global('settings', async (ctx) => {
        const { CategoryView } = await import('./features/settings/category.view.js');
        return CategoryView(ctx);
      }),
    },
    {
      pattern: '/gantt',
      handler: global('gantt', async (ctx) => {
        const { GanttView } = await import('./features/timeline/gantt.view.js');
        return GanttView({ ...ctx, projectId: null });
      }),
    },
    {
      pattern: '/projects/:id',
      handler: async (ctx) => {
        navigate(`/projects/${ctx.params.id}/dashboard`, { replace: true });
      },
    },
    {
      pattern: '/projects/:id/dashboard',
      handler: inProject('dashboard', async (ctx) => {
        const { ProjectDetailView } = await import('./features/projects/project-detail.view.js');
        return ProjectDetailView(ctx);
      }),
    },
    {
      pattern: '/projects/:id/board',
      handler: inProject('board', async (ctx) => {
        const { TasksView } = await import('./features/tasks/task.view.js');
        return TasksView({ ...ctx, query: { ...ctx.query, project: ctx.params.id } });
      }),
    },
    {
      pattern: '/projects/:id/backlog',
      handler: inProject('backlog', async (ctx) => {
        const { BacklogView } = await import('./features/tasks/backlog.view.js');
        return BacklogView({ ...ctx, projectId: ctx.params.id });
      }),
    },
    {
      pattern: '/projects/:id/issues',
      handler: inProject('issues', async (ctx) => {
        const { IssuesView } = await import('./features/issues/issue.view.js');
        return IssuesView({ ...ctx, projectId: ctx.params.id });
      }),
    },
    {
      pattern: '/projects/:id/gantt',
      handler: inProject('gantt', async (ctx) => {
        const { GanttView } = await import('./features/timeline/gantt.view.js');
        return GanttView({ ...ctx, projectId: ctx.params.id });
      }),
    },
  ];
}
