/**
 * task.view.js — the Tasks screen, rendered as a Jira-style board.
 *
 * Columns map to task statuses. Cards resolve assignee_id -> member via the
 * global resolver. Moving a card calls taskStore.updateStatus (optimistic).
 * Orchestration only — no fetch, no inline handlers.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { AsyncSection } from '../../shared/components/async-section.js';
import { Priority } from '../../shared/components/priority.js';
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
    // Tính "mã task" kiểu Jira: KEY-1, KEY-2... ổn định theo thứ tự tạo trong từng project.
    const seqByProject = new Map(); // projectId -> đếm
    const keyByTask = new Map();    // taskId -> "ATL-3"
    const ordered = [...rows].sort((a, b) =>
      String(a.created_at ?? a.id).localeCompare(String(b.created_at ?? b.id))
    );
    for (const t of ordered) {
      const n = (seqByProject.get(t.project_id) ?? 0) + 1;
      seqByProject.set(t.project_id, n);
      keyByTask.set(t.id, `${r.projectKey(t.project_id)}-${n}`);
    }

    const board = el('div.board');
    for (const status of COLUMNS) {
      const cfg = TASK_STATUS[status];
      const colTasks = rows.filter((t) => t.status === status);
      const column = el('div.board__column', { dataset: { status } }, [
        el('div.board__column-head', {}, [
          el('span.board__column-title', { text: cfg.label }),
          el('span.board__column-count', { text: String(colTasks.length) }),
        ]),
        el('div.board__cards', {}, colTasks.map((t) => card(t, r, keyByTask.get(t.id)))),
      ]);
      board.append(column);
    }
    return board;
  }

  function card(task, r, taskKey) {
    const member = r.member(task.assignee_id);
    const prio = PRIORITY[task.priority] ?? PRIORITY.medium;
    const isDone = task.status === 'done';
    const node = el('article.task-card', {
      dataset: { id: task.id },
      style: { '--prio-color': prio.color },
    }, [
      el('p.task-card__title', { text: task.title }),
      task.progress != null && task.progress > 0 && !isDone
        ? el('span.progress', {}, [
            el('span.progress__bar', { style: { width: `${task.progress}%` } }),
          ])
        : null,
      el('div.task-card__meta', {}, [
        Priority({ value: task.priority }),
        (task.progress != null && task.progress > 0 && !isDone)
          ? el('span', { class: 'task-card__key', text: `${task.progress}%` })
          : null,
      ]),
      el('div.task-card__footer', {}, [
        el('span.task-card__key', { text: taskKey ?? '' }),
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          el('select.task-card__status', {
            'aria-label': 'Change status',
            on: {
              click: (e) => e.stopPropagation(),
              change: (e) => moveTask(task.id, e.target.value),
            },
          }, COLUMNS.map((s) =>
            el('option', { value: s, text: TASK_STATUS[s].label, selected: s === task.status })
          )),
          Avatar({ name: member?.full_name ?? 'Unassigned', url: member?.avatar_url, size: 24 }),
        ]),
      ]),
    ]);
    if (isDone) node.classList.add('task-card--done');
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
