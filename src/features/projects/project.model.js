/**
 * project.model.js — the schema/shape of a Project plus helpers.
 *
 * A "model" here is not an ORM class — it's the single source of truth for
 * what fields a project has, how to create a blank one, how to validate a
 * form payload, and how to shape data for the API. Keeping this separate from
 * the service means the schema is documented in one obvious place.
 */

/** Field whitelist that may be written to the DB (prevents leaking UI-only fields). */
export const PROJECT_WRITABLE = [
  'key', 'name', 'description', 'status', 'lead_id', 'start_date', 'end_date',
];

/** A blank project for "create" forms. */
export function emptyProject() {
  return {
    key: '',
    name: '',
    description: '',
    status: 'planning',
    lead_id: null,
    start_date: null,
    end_date: null,
  };
}

/** Pick only writable fields and normalize empty strings to null. */
export function toPayload(form) {
  const payload = {};
  for (const field of PROJECT_WRITABLE) {
    let v = form[field];
    if (v === '') v = null;
    if (v !== undefined) payload[field] = v;
  }
  if (payload.key) payload.key = payload.key.toUpperCase().trim();
  return payload;
}

/**
 * Validate a project form. Returns { valid, errors } where errors is a map
 * of field -> message. Pure function, trivially testable.
 */
export function validateProject(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Name is required';
  if (!form.key?.trim()) errors.key = 'Key is required';
  else if (!/^[A-Za-z][A-Za-z0-9]{1,9}$/.test(form.key.trim()))
    errors.key = 'Key must be 2–10 letters/digits, starting with a letter';
  if (form.start_date && form.end_date && form.start_date > form.end_date)
    errors.end_date = 'End date must be after start date';
  return { valid: Object.keys(errors).length === 0, errors };
}
