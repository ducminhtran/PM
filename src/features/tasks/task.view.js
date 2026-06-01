/**
 * task.view.js — the Tasks screen, rendered as a Jira-style board.
 *
 * Columns map to task statuses. Cards resolve assignee_id -> member via the
 * global resolver. Moving a card calls taskStore.updateStatus (optimistic).
 * Orchestration only — no fetch, no inline handlers.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { AsyncSection } from '../../shared/components/async-section.js';
import { Badge } from '../../shared/components/badge.js';
import { Avatar } from '../../shared/components/avatar.js';
import { Modal } from '../../shared/components/modal.js';
import { toast } from '../../shared/components/toast.js';
import { TASK_STATUS, PRIORITY } from '../../core/config.js';
import { appStore } from '../../app.store.js';
import { taskStore } from './task.store.js';
import { TaskForm } from './components/task-form.js';

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];

export function TasksView({ outlet, setTitle, query }) {
  setTitle?.('Tasks');
  const projectId = query?.project ?? null;

  const section = AsyncSection({
    render: (rows) => buildBoard(rows),
    empty: () => buildBoard([]),
    onRetry: () => taskStore.load({ projectId, force: true }).catch(() => {}),
  });

  const header = el('div.page-header', {}, [
    el('h2.page-header__title', { text: 'Tasks' }),
    el('button.btn.btn--primary', { type: 'button', on: { click: openCreate } }, [
      el('i.ti.ti-plus', { 'aria-hidden': 'true' }), 'New task',
    ]),
  ]);

  mount(outlet, el('div.page', {}, [header, section.node]));

  function buildBoard(rows) {
    const r = appStore.getResolver();
    const board = el('div.board');
    for (const status of COLUMNS) {
      const cfg = TASK_STATUS[status];
      const colTasks = rows.filter((t) => t.status === status);
      const column = el('div.board__column', { dataset: { status } }, [
        el('div.board__column-head', {}, [
          el('span.board__column-title', { text: cfg.label }),
          el('span.board__column-count', { text: String(colTasks.length) }),
        ]),
        el('div.board__cards', {}, colTasks.map((t) => card(t, r))),
      ]);
      board.append(column);
    }
    return board;
  }

  function card(task, r) {
    const member = r.member(task.assignee_id);
    const prio = PRIORITY[task.priority] ?? PRIORITY.medium;
    const node = el('article.task-card', { dataset: { id: task.id } }, [
      el('p.task-card__title', { text: task.title }),
      el('div.task-card__meta', {}, [
        Badge({ label: prio.label, color: prio.color }),
        task.progress != null
          ? el('span.task-card__progress', {}, [
              el('span.progress', {}, [
                el('span.progress__bar', { style: { width: `${task.progress}%` } }),
              ]),
            ])
          : null,
      ]),
      el('div.task-card__footer', {}, [
        Avatar({ name: member?.full_name ?? 'Unassigned', url: member?.avatar_url, size: 24 }),
        el('select.task-card__status', {
          'aria-label': 'Change status',
          on: {
            change: (e) => moveTask(task.id, e.target.value),
          },
        }, COLUMNS.map((s) =>
          el('option', { value: s, text: TASK_STATUS[s].label, selected: s === task.status })
        )),
      ]),
    ]);
    return node;
  }

  async function moveTask(id, status) {
    try {
      await taskStore.updateStatus(id, status);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function openCreate() {
    const form = TaskForm({
      initial: { project_id: projectId },
      onCancel: () => modal.close(),
      onSubmit: async (payload, { setErrors }) => {
        form.setSubmitting(true);
        try {
          await taskStore.create(payload);
          toast('Task created', 'success');
          modal.close();
        } catch (err) {
          if (err.code === 'VALIDATION') setErrors(err.cause);
          else toast(err.message, 'error');
        } finally {
          form.setSubmitting(false);
        }
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
