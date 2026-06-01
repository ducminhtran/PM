/** task.service.js — business/data layer for Tasks. No DOM, no UI state. */
import { createRepository, ApiError } from '../../core/api.js';
import { toPayload, validateTask } from './task.model.js';

const repo = createRepository('tasks');
const SELECT = '*';

export const taskService = {
  async list({ projectId } = {}) {
    return repo.list({
      select: SELECT,
      filters: projectId ? { project_id: projectId } : undefined,
      order: { column: 'position', ascending: true },
    });
  },
  async getById(id) { return repo.getById(id, SELECT); },
  async create(form) {
    const { valid, errors } = validateTask(form);
    if (!valid) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: errors });
    return repo.create(toPayload(form));
  },
  async update(id, form) {
    const { valid, errors } = validateTask({ ...form, project_id: form.project_id ?? 'x' });
    if (!valid) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: errors });
    return repo.update(id, toPayload(form));
  },
  // Partial status/progress updates skip full validation (used by the board).
  async patch(id, patch) { return repo.update(id, patch); },
  async remove(id) { return repo.remove(id); },
};
