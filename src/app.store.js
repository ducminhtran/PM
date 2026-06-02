/**
 * app.store.js — global store cho REFERENCE data mà nhiều feature cần để
 * resolve quan hệ: members, projects, và 4 DANH MỤC (lookup tables):
 * task_statuses, priorities, issue_statuses, issue_types.
 *
 * Đây là store toàn cục DUY NHẤT. Dữ liệu riêng từng feature (task của một
 * project, issue...) nằm ở store của feature đó. Để danh mục ở đây nghĩa là
 * mọi view resolve status_id/priority_id -> {nhãn, màu} mà không phải fetch lại.
 *
 * Luồng: view đọc qua getResolver(); không tự fetch.
 */
import { createStore } from './core/store.js';
import { createRepository } from './core/api.js';
import { createResolver, indexById } from './shared/utils/resolver.js';

const membersRepo       = createRepository('members');
const projectsRepo      = createRepository('projects');
const taskStatusRepo    = createRepository('task_statuses');
const priorityRepo      = createRepository('priorities');
const issueStatusRepo   = createRepository('issue_statuses');
const issueTypeRepo     = createRepository('issue_types');

const store = createStore({
  members: [],
  projects: [],
  taskStatuses: [],
  priorities: [],
  issueStatuses: [],
  issueTypes: [],
  membersById: new Map(),
  projectsById: new Map(),
  taskStatusesById: new Map(),
  prioritiesById: new Map(),
  issueStatusesById: new Map(),
  issueTypesById: new Map(),
  status: 'idle', // idle | loading | ready | error
  error: null,
  currentUser: null,
});

const byPosition = { column: 'position' };

/** Load toàn bộ reference data + danh mục một lần lúc khởi động. */
async function loadReferenceData() {
  store.setState({ status: 'loading', error: null });
  try {
    const [members, projects, taskStatuses, priorities, issueStatuses, issueTypes] = await Promise.all([
      membersRepo.list({ order: { column: 'full_name' } }),
      projectsRepo.list({ order: { column: 'name' } }),
      taskStatusRepo.list({ order: byPosition }),
      priorityRepo.list({ order: byPosition }),
      issueStatusRepo.list({ order: byPosition }),
      issueTypeRepo.list({ order: byPosition }),
    ]);
    store.setState({
      members, projects, taskStatuses, priorities, issueStatuses, issueTypes,
      membersById: indexById(members),
      projectsById: indexById(projects),
      taskStatusesById: indexById(taskStatuses),
      prioritiesById: indexById(priorities),
      issueStatusesById: indexById(issueStatuses),
      issueTypesById: indexById(issueTypes),
      status: 'ready',
    });
  } catch (error) {
    store.setState({ status: 'error', error });
    throw error;
  }
}

async function refreshProjects() {
  const projects = await projectsRepo.list({ order: { column: 'name' } });
  store.setState({ projects, projectsById: indexById(projects) });
}

/** Refresh một danh mục sau khi CRUD (key: 'taskStatuses'|'priorities'|...). */
async function refreshLookup(key) {
  const repoMap = {
    taskStatuses: taskStatusRepo, priorities: priorityRepo,
    issueStatuses: issueStatusRepo, issueTypes: issueTypeRepo,
  };
  const repo = repoMap[key];
  if (!repo) return;
  const rows = await repo.list({ order: byPosition });
  store.setState({ [key]: rows, [`${key}ById`]: indexById(rows) });
}

/** Resolver gắn với các map hiện tại. Rẻ, dựng lại mỗi lần gọi. */
function getResolver() {
  const s = store.getState();
  return createResolver({
    members: s.membersById,
    projects: s.projectsById,
    taskStatuses: s.taskStatusesById,
    priorities: s.prioritiesById,
    issueStatuses: s.issueStatusesById,
    issueTypes: s.issueTypesById,
  });
}

export const appStore = {
  ...store,
  loadReferenceData,
  refreshProjects,
  refreshLookup,
  getResolver,
};
