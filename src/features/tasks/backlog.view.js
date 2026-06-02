/**
 * backlog.view.js — danh sách task của project dạng list (bảng), khác Board.
 * Dùng chung taskStore (load theo projectId). Orchestration only.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Icon } from '../../shared/components/icon.js';
import { Table } from '../../shared/components/table.js';
import { Badge } from '../../shared/components/badge.js';
import { Avatar } from '../../shared/components/avatar.js';
import { AsyncSection } from '../../shared/components/async-section.js';
import { emptyState } from '../../shared/components/empty-state.js';
import { Modal } from '../../shared/components/modal.js';
import { toast } from '../../shared/components/toast.js';
import { formatDate } from '../../shared/utils/format.js';
import { appStore } from '../../app.store.js';
import { taskStore } from './task.store.js';
import { TaskForm } from './components/task-form.js';

export function BacklogView({ outlet, setTitle, projectId }) {
  setTitle?.('Backlog');

  const section = AsyncSection({
    render: (rows) => buildTable(rows),
    empty: () => emptyState('No tasks in this project yet', {
      icon: 'checklist',
      action: el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, ['Create task']),
    }),
    onRetry: () => taskStore.load({ projectId, force: true }).catch(() => {}),
  });

  const header = el('div.page-header', {}, [
    el('h2.page-header__title', { text: 'Backlog' }),
    el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, [
      Icon('plus', { size: 16 }), 'New task',
    ]),
  ]);
  mount(outlet, el('div.page', {}, [header, section.node]));

  function buildTable(rows) {
    const r = appStore.getResolver();
    return Table({
      columns: [
        { key: 'title', header: 'Title', render: (t) => el('span.cell-strong', { text: t.title }) },
        { key: 'status', header: 'Status', width: '130px', render: (t) => { const s = r.taskStatus(t.status_id); return s ? Badge({ label: s.label, tone: s.tone }) : '—'; } },
        { key: 'priority', header: 'Priority', width: '120px', render: (t) => { const p = r.priority(t.priority_id); return p ? Badge({ label: p.label, tone: p.tone, icon: p.icon }) : '—'; } },
        { key: 'assignee_id', header: 'Assignee', width: '170px', render: (t) => {
          const m = r.member(t.assignee_id);
          return el('span.cell-user', {}, [Avatar({ name: m?.full_name ?? 'Unassigned', url: m?.avatar_url, size: 24 }), el('span', { text: m?.full_name ?? 'Unassigned' })]);
        } },
        { key: 'due_date', header: 'Due', width: '120px', render: (t) => formatDate(t.due_date) },
      ],
      rows,
    });
  }

  function openCreate() {
    const form = TaskForm({
      initial: { project_id: projectId },
      onCancel: () => modal.close(),
      onSubmit: async (payload, { setErrors }) => {
        form.setSubmitting(true);
        try { await taskStore.create(payload); toast('Task created', 'success'); modal.close(); }
        catch (err) { if (err.code === 'VALIDATION') setErrors(err.cause); else toast(err.message, 'error'); }
        finally { form.setSubmitting(false); }
      },
    });
    const modal = Modal({ title: 'New task', content: form.node });
    modal.open();
  }

  const unsubscribe = taskStore.subscribe((state) => {
    if (state.status === 'loading') section.setLoading();
    else if (state.status === 'error') section.setError(state.error);
    else if (state.status === 'ready') section.setData(state.items);
  }, { immediate: true });
  taskStore.load({ projectId }).catch(() => {});
  return () => unsubscribe();
}
