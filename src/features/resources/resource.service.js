/**
 * resource.service.js — business/data layer for resource allocations.
 * Joins are by ID; the view resolves member/project names via the resolver.
 */
import { createRepository, ApiError } from '../../core/api.js';
const repo = createRepository('allocations');
export const resourceService = {
  async list() { return repo.list({ order: { column: 'start_date', ascending: false } }); },
  async create(form) {
    if (!form.member_id || !form.project_id) throw new ApiError('Validation failed', { code: 'VALIDATION', cause: { member_id: !form.member_id ? 'Required' : '', project_id: !form.project_id ? 'Required' : '' } });
    return repo.create({
      member_id: form.member_id, project_id: form.project_id,
      allocation_pct: Number(form.allocation_pct) || 100,
      start_date: form.start_date || new Date().toISOString().slice(0, 10),
      end_date: form.end_date || null,
    });
  },
  async remove(id) { return repo.remove(id); },
};
