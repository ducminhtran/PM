/**
 * project-detail.view.js — a single project's overview + its tasks.
 *
 * Demonstrates cross-feature composition done right: it imports the task
 * store/service-backed data scoped to this project, but reuses the same
 * resolver and shared components. No new fetch patterns invented.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Badge } from '../../shared/components/badge.js';
import { Priority } from '../../shared/components/priority.js';
import { Avatar } from '../../shared/components/avatar.js';
import { Spinner } from '../../shared/components/spinner.js';
import { Table } from '../../shared/components/table.js';
import { emptyState } from '../../shared/components/empty-state.js';
import { toast } from '../../shared/components/toast.js';
import { formatDate } from '../../shared/utils/format.js';
import { PROJECT_STATUS, TASK_STATUS, PRIORITY } from '../../core/config.js';
import { appStore } from '../../app.store.js';
import { projectService } from './project.service.js';
import { taskService } from './../tasks/task.service.js';

export function ProjectDetailView({ outlet, params, navigate, setTitle }) {
  const wrap = el('div.page');
  mount(outlet, wrap);
  mount(wrap, el('div.state-center', {}, [Spinner({ label: 'Loading project…' })]));

  Promise.all([projectService.getById(params.id), taskService.list({ projectId: params.id })])
    .then(([project, tasks]) => render(project, tasks))
    .catch((err) => {
      toast(err.message, 'error');
      mount(wrap, emptyState('Project not found', { icon: 'folder-x' }));
    });

  function render(project, tasks) {
    setTitle?.(project.name);
    const r = appStore.getResolver();
    const lead = r.member(project.lead_id);
    const cfg = PROJECT_STATUS[project.status] ?? { label: project.status, color: 'var(--c-text-muted)' };

    const head = el('div.detail-head', {}, [
      el('button.btn.btn--ghost', { type: 'button', on: { click: () => navigate('/projects') } }, [
        el('i.ti.ti-arrow-left', { 'aria-hidden': 'true' }), 'Projects',
      ]),
      el('div.detail-head__main', {}, [
        el('span.mono.detail-head__key', { text: project.key }),
        el('h2.detail-head__title', { text: project.name }),
        Badge({ label: cfg.label, tone: cfg.tone }),
      ]),
      el('button.btn.btn--primary', { type: 'button', on: { click: () => navigate(`/tasks?project=${project.id}`) } }, [
        'Open board',
      ]),
    ]);

    const meta = el('div.detail-meta', {}, [
      metaItem('Lead', el('span.cell-user', {}, [Avatar({ name: lead?.full_name ?? 'Unassigned', url: lead?.avatar_url, size: 24 }), el('span', { text: lead?.full_name ?? 'Unassigned' })])),
      metaItem('Start', formatDate(project.start_date)),
      metaItem('End', formatDate(project.end_date)),
      metaItem('Tasks', String(tasks.length)),
    ]);

    const desc = project.description
      ? el('p.detail-desc', { text: project.description })
      : el('p.detail-desc.detail-desc--muted', { text: 'No description.' });

    const taskTable = tasks.length
      ? Table({
          columns: [
            { key: 'title', header: 'Title', render: (t) => el('span.cell-strong', { text: t.title }) },
            { key: 'status', header: 'Status', width: '130px', render: (t) => { const s = TASK_STATUS[t.status]; return Badge({ label: s.label, tone: s.tone }); } },
            { key: 'priority', header: 'Priority', width: '110px', render: (t) => { return Priority({ value: t.priority }); } },
            { key: 'assignee_id', header: 'Assignee', width: '160px', render: (t) => { const m = r.member(t.assignee_id); return el('span.cell-user', {}, [Avatar({ name: m?.full_name ?? 'Unassigned', url: m?.avatar_url, size: 24 }), el('span', { text: m?.full_name ?? 'Unassigned' })]); } },
            { key: 'progress', header: 'Progress', width: '120px', render: (t) => el('span.progress', {}, [el('span.progress__bar', { style: { width: `${t.progress ?? 0}%` } })]) },
          ],
          rows: tasks,
        })
      : emptyState('No tasks in this project yet', { icon: 'checklist' });

    mount(wrap, el('div.page', {}, [head, meta, desc, el('h3.section-title', { text: 'Tasks' }), taskTable]));
  }

  function metaItem(label, value) {
    return el('div.detail-meta__item', {}, [
      el('span.detail-meta__label', { text: label }),
      value instanceof Node ? value : el('span.detail-meta__value', { text: value }),
    ]);
  }
}
