/**
 * project.service.js — the business/data layer for projects.
 *
 * Responsibilities:
 *   - call the central api.js repository (never Supabase directly)
 *   - apply the model's payload shaping + validation
 *   - expose clean domain methods the store can call
 *
 * It NEVER touches the DOM and NEVER holds UI state. This is the "S" in the
 * UI -> State -> Service -> API -> Supabase flow.
 */
import { createRepository, ApiError } from '../../core/api.js';
import { toPayload, validateProject } from './project.model.js';

const repo = createRepository('projects');

/** A select that also pulls counts could go here later; keep it simple now. */
const SELECT = '*';

export const projectService = {
  async list() {
    return repo.list({ select: SELECT, order: { column: 'created_at', ascending: false } });
  },

  async getById(id) {
    return repo.getById(id, SELECT);
  },

  async create(form) {
    const { valid, errors } = validateProject(form);
    if (!valid) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: errors });
    return repo.create(toPayload(form));
  },

  async update(id, form) {
    const { valid, errors } = validateProject(form);
    if (!valid) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: errors });
    return repo.update(id, toPayload(form));
  },

  async remove(id) {
    return repo.remove(id);
  },
};
