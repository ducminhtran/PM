/**
 * issue.view.js — màn Issues dạng bảng. Resolve type/status/priority/assignee
 * qua resolver (lấy từ DANH MỤC động). Đổi status inline qua store. Điều phối.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Icon } from '../../shared/components/icon.js';
import { Table } from '../../shared/components/table.js';
import { Badge } from '../../shared/components/badge.js';
import { Avatar } from '../../shared/components/avatar.js';
import { AsyncSection } from '../../shared/components/async-section.js';
import { emptyState } from '../../shared/components/empty-state.js';
import { Modal } from '../../shared/components/modal.js';
import { confirmDialog } from '../../shared/components/confirm.js';
import { toast } from '../../shared/components/toast.js';
import { appStore } from '../../app.store.js';
import { issueStore } from './issue.store.js';
import { IssueForm } from './components/issue-form.js';

export function IssuesView({ outlet, setTitle, projectId }) {
  setTitle?.('Issues');

  const section = AsyncSection({
    render: (rows) => buildTable(rows),
    empty: () => emptyState('No issues reported', {
      icon: 'bug', action: el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, ['Report issue']),
    }),
    onRetry: () => issueStore.load({ projectId, force: true }).catch(() => {}),
  });

  const header = el('div.page-header', {}, [
    el('h2.page-header__title', { text: 'Issues' }),
    el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, [
      Icon('plus', { size: 16 }), 'Report issue',
    ]),
  ]);
  mount(outlet, el('div.page', {}, [header, section.node]));

  function buildTable(rows) {
    const r = appStore.getResolver();
    const issueStatuses = appStore.getState().issueStatuses;
    return Table({
      columns: [
        { key: 'type', header: 'Type', width: '110px', render: (i) => {
          const t = r.issueType(i.type_id);
          return el('span.cell-type', {}, [Icon(t?.icon ?? 'circle', { size: 16 }), el('span', { text: t?.label ?? '—' })]);
        } },
        { key: 'title', header: 'Summary', render: (i) => el('span.cell-strong', { text: i.title }) },
        { key: 'project_id', header: 'Project', width: '110px', render: (i) => el('span.mono', { text: r.projectKey(i.project_id) }) },
        { key: 'priority', header: 'Priority', width: '110px', render: (i) => {
          const p = r.priority(i.priority_id);
          return p ? Badge({ label: p.label, tone: p.tone, icon: p.icon }) : '—';
        } },
        { key: 'status', header: 'Status', width: '150px', render: (i) => {
          const cur = r.issueStatus(i.status_id);
          const sel = el('select.inline-select', { 'aria-label': 'Status',
            on: { click: (e) => e.stopPropagation(), change: (e) => changeStatus(i.id, e.target.value) } },
            issueStatuses.map((s) => el('option', { value: s.id, text: s.label, selected: s.id === i.status_id })));
          if (cur?.color) sel.style.setProperty('--badge-color', cur.color);
          return sel;
        } },
        { key: 'assignee_id', header: 'Assignee', width: '150px', render: (i) => {
          const m = r.member(i.assignee_id);
          return el('span.cell-user', {}, [Avatar({ name: m?.full_name ?? 'Unassigned', url: m?.avatar_url, size: 24 }), el('span', { text: m?.full_name ?? 'Unassigned' })]);
        } },
        { key: '_actions', header: '', width: '80px', align: 'right', render: (i) =>
          el('div.row-actions', {}, [
            el('button.icon-btn', { type: 'button', title: 'Edit',
              on: { click: (e) => { e.stopPropagation(); openEdit(i); } } }, [Icon('check', { size: 15 })]),
            el('button.icon-btn.icon-btn--danger', { type: 'button', title: 'Delete',
              on: { click: (e) => { e.stopPropagation(); askDelete(i); } } }, [Icon('x', { size: 15 })]),
          ]) },
      ],
      rows,
    });
  }

  async function changeStatus(id, statusId) {
    try { await issueStore.updateStatus(id, statusId); } catch (err) { toast(err.message, 'error'); }
  }

  function openCreate() {
    const form = IssueForm({
      initial: { project_id: projectId },
      onCancel: () => modal.close(),
      onSubmit: async (payload, { setErrors }) => {
        form.setSubmitting(true);
        try { await issueStore.create(payload); toast('Issue reported', 'success'); modal.close(); }
        catch (err) { if (err.code === 'VALIDATION') setErrors(err.cause); else toast(err.message, 'error'); }
        finally { form.setSubmitting(false); }
      },
    });
    const modal = Modal({ title: 'Report issue', content: form.node });
    modal.open();
  }

  function openEdit(issue) {
    const form = IssueForm({
      initial: issue,
      onCancel: () => modal.close(),
      onSubmit: async (payload, { setErrors }) => {
        form.setSubmitting(true);
        try { await issueStore.update(issue.id, payload); toast('Issue updated', 'success'); modal.close(); }
        catch (err) { if (err.code === 'VALIDATION') setErrors(err.cause); else toast(err.message, 'error'); }
        finally { form.setSubmitting(false); }
      },
    });
    const modal = Modal({ title: 'Edit issue', content: form.node });
    modal.open();
  }

  function askDelete(issue) {
    confirmDialog({
      title: 'Delete issue',
      message: `Xóa issue "${issue.title}"?`,
      onConfirm: async () => {
        try { await issueStore.remove(issue.id); toast('Issue deleted', 'success'); }
        catch (err) { toast(err.message, 'error'); }
      },
    });
  }

  const unsubscribe = issueStore.subscribe((state) => {
    if (state.status === 'loading') section.setLoading();
    else if (state.status === 'error') section.setError(state.error);
    else if (state.status === 'ready') section.setData(state.items);
  }, { immediate: true });
  issueStore.load({ projectId }).catch(() => {});
  return () => unsubscribe();
}
