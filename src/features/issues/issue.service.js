/** issue.service.js — business/data layer for Issues. */
import { createRepository, ApiError } from '../../core/api.js';
import { toPayload, validateIssue } from './issue.model.js';
const repo = createRepository('issues');
export const issueService = {
  async list({ projectId } = {}) {
    return repo.list({ filters: projectId ? { project_id: projectId } : undefined, order: { column: 'created_at', ascending: false } });
  },
  async getById(id) { return repo.getById(id); },
  async create(form) {
    const { valid, errors } = validateIssue(form);
    if (!valid) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: errors });
    return repo.create(toPayload(form));
  },
  async update(id, form) {
    const { valid, errors } = validateIssue(form);
    if (!valid) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: errors });
    return repo.update(id, toPayload(form));
  },
  async patch(id, patch) { return repo.update(id, patch); },
  async remove(id) { return repo.remove(id); },
};
