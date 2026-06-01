/**
 * resource.view.js — resource management screen.
 *
 * Two parts: a workload summary per member (derived state, shows
 * overallocation) and the allocations table. Allocations link member_id ->
 * project_id; the resolver turns those into names at render time.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Table } from '../../shared/components/table.js';
import { Avatar } from '../../shared/components/avatar.js';
import { Badge } from '../../shared/components/badge.js';
import { AsyncSection } from '../../shared/components/async-section.js';
import { emptyState } from '../../shared/components/empty-state.js';
import { Modal } from '../../shared/components/modal.js';
import { toast } from '../../shared/components/toast.js';
import { formatDate } from '../../shared/utils/format.js';
import { appStore } from '../../app.store.js';
import { resourceStore } from './resource.store.js';
import { AllocationForm } from './components/allocation-form.js';

export function ResourcesView({ outlet, setTitle }) {
  setTitle?.('Resources');

  const section = AsyncSection({
    render: (rows) => buildContent(rows),
    empty: () => emptyState('No allocations yet', {
      icon: 'users', action: el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, ['Allocate resource']),
    }),
    onRetry: () => resourceStore.load({ force: true }).catch(() => {}),
  });

  const header = el('div.page-header', {}, [
    el('h2.page-header__title', { text: 'Resources' }),
    el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, [
      el('i.ti.ti-plus', { 'aria-hidden': 'true' }), 'Allocate',
    ]),
  ]);
  mount(outlet, el('div.page', {}, [header, section.node]));

  function buildContent(rows) {
    const r = appStore.getResolver();
    const workload = resourceStore.workloadByMember();
    const members = appStore.getState().members;

    const cards = el('div.workload-grid', {}, members.map((m) => {
      const total = workload.get(m.id) ?? 0;
      const over = total > 100;
      return el('div.workload-card', {}, [
        el('div.workload-card__head', {}, [
          Avatar({ name: m.full_name, url: m.avatar_url, size: 32 }),
          el('div', {}, [el('p.workload-card__name', { text: m.full_name }), el('p.workload-card__role', { text: m.role })]),
        ]),
        el('div.workload-card__bar', {}, [
          el('span.workload-card__fill', { class: over ? 'workload-card__fill--over' : '', style: { width: `${Math.min(total, 100)}%` } }),
        ]),
        el('p.workload-card__pct', { class: over ? 'is-over' : '', text: `${total}% allocated${over ? ' · overallocated' : ''}` }),
      ]);
    }));

    const table = Table({
      columns: [
        { key: 'member_id', header: 'Member', render: (a) => {
          const m = r.member(a.member_id);
          return el('span.cell-user', {}, [Avatar({ name: m?.full_name ?? '—', url: m?.avatar_url, size: 24 }), el('span', { text: m?.full_name ?? '—' })]);
        } },
        { key: 'project_id', header: 'Project', render: (a) => el('span', { text: r.projectName(a.project_id) }) },
        { key: 'allocation_pct', header: 'Allocation', width: '120px', render: (a) => Badge({ label: `${a.allocation_pct}%`, tone: a.allocation_pct > 100 ? 'red' : 'blue' }) },
        { key: 'start_date', header: 'From', width: '120px', render: (a) => formatDate(a.start_date) },
        { key: 'end_date', header: 'To', width: '120px', render: (a) => formatDate(a.end_date) },
      ],
      rows,
    });

    return el('div.resources', {}, [
      el('h3.section-title', { text: 'Team workload' }),
      cards,
      el('h3.section-title', { text: 'Allocations' }),
      table,
    ]);
  }

  function openCreate() {
    const form = AllocationForm({
      onCancel: () => modal.close(),
      onSubmit: async (payload, { setErrors }) => {
        form.setSubmitting(true);
        try { await resourceStore.create(payload); toast('Allocation added', 'success'); modal.close(); }
        catch (err) { if (err.code === 'VALIDATION') setErrors(err.cause); else toast(err.message, 'error'); }
        finally { form.setSubmitting(false); }
      },
    });
    const modal = Modal({ title: 'Allocate resource', content: form.node });
    modal.open();
  }

  const unsubscribe = resourceStore.subscribe((state) => {
    if (state.status === 'loading') section.setLoading();
    else if (state.status === 'error') section.setError(state.error);
    else if (state.status === 'ready') section.setData(state.items);
  }, { immediate: true });
  resourceStore.load().catch(() => {});
  return () => unsubscribe();
}
