/**
 * task.view.js — màn Tasks dạng board kiểu Jira.
 *
 * Cột sinh động từ DANH MỤC task_statuses (sắp theo position). Card resolve
 * status_id/priority_id/assignee_id qua resolver toàn cục. Kéo-thả hoặc đổi
 * dropdown -> taskStore.updateStatus(id, statusId) (optimistic). Chỉ điều phối.
 */
import { el, mount } from '../../shared/utils/dom.js';
import { Icon } from '../../shared/components/icon.js';
import { AsyncSection } from '../../shared/components/async-section.js';
import { Badge } from '../../shared/components/badge.js';
import { Avatar } from '../../shared/components/avatar.js';
import { Modal } from '../../shared/components/modal.js';
import { toast } from '../../shared/components/toast.js';
import { appStore } from '../../app.store.js';
import { taskStore } from './task.store.js';
import { TaskForm } from './components/task-form.js';

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
      Icon('plus', { size: 16 }), 'New task',
    ]),
  ]);

  mount(outlet, el('div.page', {}, [header, section.node]));

  function buildBoard(rows) {
    const r = appStore.getResolver();
    const columns = appStore.getState().taskStatuses; // sắp sẵn theo position

    // Mã task kiểu Jira: KEY-1, KEY-2... ổn định theo thứ tự tạo trong từng project.
    const seqByProject = new Map();
    const keyByTask = new Map();
    const ordered = [...rows].sort((a, b) =>
      String(a.created_at ?? a.id).localeCompare(String(b.created_at ?? b.id))
    );
    for (const t of ordered) {
      const n = (seqByProject.get(t.project_id) ?? 0) + 1;
      seqByProject.set(t.project_id, n);
      keyByTask.set(t.id, `${r.projectKey(t.project_id)}-${n}`);
    }

    const board = el('div.board');
    for (const col of columns) {
      const colTasks = rows.filter((t) => t.status_id === col.id);
      const cards = el('div.board__cards', {
        dataset: { statusId: col.id },
        on: {
          dragover: (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            cards.classList.add('board__cards--over');
          },
          dragleave: (e) => {
            if (!cards.contains(e.relatedTarget)) cards.classList.remove('board__cards--over');
          },
          drop: (e) => {
            e.preventDefault();
            cards.classList.remove('board__cards--over');
            const id = e.dataTransfer.getData('text/plain');
            if (id && col.id) moveTask(id, col.id);
          },
        },
      }, colTasks.map((t) => card(t, r, keyByTask.get(t.id), columns)));

      const column = el('div.board__column', { dataset: { statusId: col.id } }, [
        el('div.board__column-head', {}, [
          el('span.board__column-title', { text: col.label }),
          el('span.board__column-count', { text: String(colTasks.length) }),
        ]),
        cards,
      ]);
      board.append(column);
    }
    return board;
  }

  function card(task, r, taskKey, columns) {
    const member = r.member(task.assignee_id);
    const prio = r.priority(task.priority_id);
    const status = r.taskStatus(task.status_id);
    const isDone = status?.code === 'done';
    const node = el('article.task-card', {
      draggable: 'true',
      dataset: { id: task.id },
      style: { '--prio-color': prio?.color ?? 'var(--c-border-strong)' },
      on: {
        dragstart: (e) => {
          e.dataTransfer.setData('text/plain', task.id);
          e.dataTransfer.effectAllowed = 'move';
          node.classList.add('task-card--dragging');
        },
        dragend: () => node.classList.remove('task-card--dragging'),
      },
    }, [
      el('p.task-card__title', { text: task.title }),
      task.progress != null && task.progress > 0 && !isDone
        ? el('span.progress', {}, [el('span.progress__bar', { style: { width: `${task.progress}%` } })])
        : null,
      el('div.task-card__meta', {}, [
        prio ? Badge({ label: prio.label, tone: prio.tone, icon: prio.icon }) : null,
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
          }, columns.map((s) =>
            el('option', { value: s.id, text: s.label, selected: s.id === task.status_id })
          )),
          Avatar({ name: member?.full_name ?? 'Unassigned', url: member?.avatar_url, size: 24 }),
        ]),
      ]),
    ]);
    if (isDone) node.classList.add('task-card--done');
    return node;
  }

  async function moveTask(id, statusId) {
    const current = taskStore.getState().items.find((t) => t.id === id);
    if (!current || current.status_id === statusId) return; // không đổi -> bỏ qua
    try {
      await taskStore.updateStatus(id, statusId);
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
