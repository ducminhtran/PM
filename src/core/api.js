/**
 * api.js — the central data-access layer.
 *
 * This is the ONLY module that knows how to talk to Supabase tables.
 * Services call this; the UI never does. It exists so that:
 *   - fetch/CRUD logic lives in exactly one place (no duplication)
 *   - errors are normalized into one shape (ApiError)
 *   - swapping the backend later means changing only this file
 *
 * `createRepository(table)` returns a typed-ish CRUD surface for one table.
 * Services wrap these with domain logic + model mapping.
 */
import { supabase, hasSupabase } from './supabase.js';

export class ApiError extends Error {
  constructor(message, { code, status, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

function ensureClient() {
  if (!hasSupabase || !supabase) {
    throw new ApiError(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
      { code: 'NO_BACKEND' }
    );
  }
}

/** Translate a Supabase error into our normalized ApiError. */
function wrap(error, fallback) {
  if (!error) return null;
  return new ApiError(error.message || fallback, {
    code: error.code,
    status: error.status,
    cause: error,
  });
}

/**
 * Create a CRUD repository bound to a single table.
 * @param {string} table
 */
export function createRepository(table) {
  /**
   * @param {object} [opts]
   * @param {string} [opts.select='*']  - column/relation selection
   * @param {object} [opts.filters]     - { column: value } equality filters
   * @param {object} [opts.in]          - { column: [values] } membership filters
   * @param {{column:string, ascending?:boolean}} [opts.order]
   */
  async function list(opts = {}) {
    ensureClient();
    let q = supabase.from(table).select(opts.select ?? '*');
    if (opts.filters) {
      for (const [col, val] of Object.entries(opts.filters)) {
        if (val !== undefined && val !== null) q = q.eq(col, val);
      }
    }
    if (opts.in) {
      for (const [col, vals] of Object.entries(opts.in)) {
        if (Array.isArray(vals) && vals.length) q = q.in(col, vals);
      }
    }
    if (opts.order) {
      q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true });
    }
    const { data, error } = await q;
    if (error) throw wrap(error, `Failed to list ${table}`);
    return data ?? [];
  }

  async function getById(id, select = '*') {
    ensureClient();
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .single();
    if (error) throw wrap(error, `Failed to fetch ${table} ${id}`);
    return data;
  }

  async function create(payload) {
    ensureClient();
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();
    if (error) throw wrap(error, `Failed to create ${table}`);
    return data;
  }

  async function update(id, patch) {
    ensureClient();
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw wrap(error, `Failed to update ${table} ${id}`);
    return data;
  }

  async function remove(id) {
    ensureClient();
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw wrap(error, `Failed to delete ${table} ${id}`);
    return true;
  }

  return { table, list, getById, create, update, remove };
}
