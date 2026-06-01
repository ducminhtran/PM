/**
 * project.view.js — the Projects screen.
 *
 * Orchestration only: subscribes to the store, renders via shared components,
 * resolves relation IDs through appStore's resolver, and wires user actions to
 * store methods. No fetch, no business logic, no inline handlers.
 *
 * Returns a cleanup function (the router calls it on navigation) so the store
 * subscription is torn down — no leaks.
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
import { PROJECT_STATUS } from '../../core/config.js';
import { appStore } from '../../app.store.js';
import { projectStore } from './project.store.js';
import { ProjectForm } from './components/project-form.js';

export function ProjectsView({ outlet, navigate, setTitle }) {
  setTitle?.('Projects');

  const section = AsyncSection({
    render: (rows) => buildTable(rows),
    empty: () =>
      emptyState('No projects yet', {
        icon: 'folder-plus',
        action: el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, ['Create project']),
      }),
    onRetry: () => projectStore.load({ force: true }).catch(() => {}),
  });

  const header = el('div.page-header', {}, [
    el('div', {}, [el('h2.page-header__title', { text: 'Projects' })]),
    el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, [
      Icon('plus', { size: 16 }),
      'New project',
    ]),
  ]);

  mount(outlet, el('div.page', {}, [header, section.node]));

  function buildTable(rows) {
    const r = appStore.getResolver();
    return Table({
      columns: [
        { key: 'key', header: 'Key', width: '80px', render: (p) => el('span.mono', { text: p.key }) },
        { key: 'name', header: 'Name', render: (p) => el('span.cell-strong', { text: p.name }) },
        {
          key: 'status',
          header: 'Status',
          width: '130px',
          render: (p) => {
            const cfg = PROJECT_STATUS[p.status] ?? { label: p.status, color: 'var(--c-text-muted)' };
            return Badge({ label: cfg.label, tone: cfg.tone });
          },
        },
        {
          key: 'lead_id',
          header: 'Lead',
          width: '160px',
          render: (p) => {
            const m = r.member(p.lead_id);
            return el('span.cell-user', {}, [
              Avatar({ name: m?.full_name ?? 'Unassigned', url: m?.avatar_url, size: 24 }),
              el('span', { text: m?.full_name ?? 'Unassigned' }),
            ]);
          },
        },
        { key: 'end_date', header: 'Due', width: '120px', render: (p) => formatDate(p.end_date) },
      ],
      rows,
      onRowClick: (p) => navigate(`/projects/${p.id}`),
    });
  }

  function openCreate() {
    const form = ProjectForm({
      onCancel: () => modal.close(),
      onSubmit: async (payload, { setErrors }) => {
        form.setSubmitting(true);
        try {
          await projectStore.create(payload);
          toast('Project created', 'success');
          modal.close();
        } catch (err) {
          if (err.code === 'VALIDATION') setErrors(err.cause);
          else toast(err.message, 'error');
        } finally {
          form.setSubmitting(false);
        }
      },
    });
    const modal = Modal({ title: 'New project', content: form.node });
    modal.open();
  }

  // ---- reactive wiring ----
  const unsubscribe = projectStore.subscribe((state) => {
    if (state.status === 'loading') section.setLoading();
    else if (state.status === 'error') section.setError(state.error);
    else if (state.status === 'ready') section.setData(state.items);
  }, { immediate: true });

  projectStore.load().catch(() => {}); // errors surface via state

  return () => unsubscribe();
}
