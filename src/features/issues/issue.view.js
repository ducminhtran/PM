/**
 * issue.view.js — the Issues screen, rendered as a table (Jira issue list).
 * Resolves project/assignee IDs via the global resolver. Inline status change
 * flows through the store. Orchestration only.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Icon } from '../../shared/components/icon.js';
import { Table } from '../../shared/components/table.js';
import { Priority } from '../../shared/components/priority.js';
import { Avatar } from '../../shared/components/avatar.js';
import { AsyncSection } from '../../shared/components/async-section.js';
import { emptyState } from '../../shared/components/empty-state.js';
import { Modal } from '../../shared/components/modal.js';
import { toast } from '../../shared/components/toast.js';
import { ISSUE_STATUS, ISSUE_TYPE } from '../../core/config.js';
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
    return Table({
      columns: [
        { key: 'type', header: 'Type', width: '110px', render: (i) => {
          const t = ISSUE_TYPE[i.type] ?? { label: i.type };
          return el('span.cell-type', {}, [Icon(t.icon ?? 'circle', { size: 16 }), el('span', { text: t.label })]);
        } },
        { key: 'title', header: 'Summary', render: (i) => el('span.cell-strong', { text: i.title }) },
        { key: 'project_id', header: 'Project', width: '110px', render: (i) => el('span.mono', { text: r.projectKey(i.project_id) }) },
        { key: 'priority', header: 'Priority', width: '110px', render: (i) => {
          return Priority({ value: i.priority });
        } },
        { key: 'status', header: 'Status', width: '150px', render: (i) => {
          const cfg = ISSUE_STATUS[i.status] ?? { label: i.status };
          const sel = el('select.inline-select', { 'aria-label': 'Status',
            on: { click: (e) => e.stopPropagation(), change: (e) => changeStatus(i.id, e.target.value) } },
            Object.entries(ISSUE_STATUS).map(([v, c]) => el('option', { value: v, text: c.label, selected: v === i.status })));
          sel.style.setProperty('--badge-color', cfg.color);
          return sel;
        } },
        { key: 'assignee_id', header: 'Assignee', width: '150px', render: (i) => {
          const m = r.member(i.assignee_id);
          return el('span.cell-user', {}, [Avatar({ name: m?.full_name ?? 'Unassigned', url: m?.avatar_url, size: 24 }), el('span', { text: m?.full_name ?? 'Unassigned' })]);
        } },
      ],
      rows,
    });
  }

  async function changeStatus(id, status) {
    try { await issueStore.updateStatus(id, status); } catch (err) { toast(err.message, 'error'); }
  }

  function openCreate() {
    const form = IssueForm({
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

  const unsubscribe = issueStore.subscribe((state) => {
    if (state.status === 'loading') section.setLoading();
    else if (state.status === 'error') section.setError(state.error);
    else if (state.status === 'ready') section.setData(state.items);
  }, { immediate: true });
  issueStore.load({ projectId }).catch(() => {});
  return () => unsubscribe();
}
