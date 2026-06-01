/**
 * Central config. Reads from Vite env vars (import.meta.env).
 * Nothing else in the app reads import.meta.env directly — single source.
 *
 * Create a `.env.local` (gitignored) with:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 */
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  env: import.meta.env.MODE, // 'development' | 'production'
  isDev: import.meta.env.DEV,
};

/** Whether Supabase is configured. If not, the app runs in a degraded mode. */
export const hasSupabase = Boolean(config.supabase.url && config.supabase.anonKey);

// ---- Domain constants (mirror the DB enums; UI labels live here) ----
export const TASK_STATUS = {
  todo:        { label: 'To Do',       tone: 'neutral', color: 'var(--c-text-muted)' },
  in_progress: { label: 'In Progress', tone: 'amber',   color: 'var(--c-warning)' },
  in_review:   { label: 'In Review',   tone: 'blue',    color: 'var(--c-info)' },
  done:        { label: 'Done',        tone: 'green',   color: 'var(--c-success)' },
  blocked:     { label: 'Blocked',     tone: 'red',     color: 'var(--c-error)' },
};

export const ISSUE_STATUS = {
  open:        { label: 'Open',        tone: 'red',     color: 'var(--c-error)' },
  in_progress: { label: 'In Progress', tone: 'amber',   color: 'var(--c-warning)' },
  resolved:    { label: 'Resolved',    tone: 'green',   color: 'var(--c-success)' },
  closed:      { label: 'Closed',      tone: 'neutral', color: 'var(--c-text-muted)' },
  reopened:    { label: 'Reopened',    tone: 'blue',    color: 'var(--c-info)' },
};

export const PROJECT_STATUS = {
  planning:  { label: 'Planning',  tone: 'blue',    color: 'var(--c-info)' },
  active:    { label: 'Active',    tone: 'green',   color: 'var(--c-success)' },
  on_hold:   { label: 'On Hold',   tone: 'amber',   color: 'var(--c-warning)' },
  completed: { label: 'Completed', tone: 'neutral', color: 'var(--c-text-secondary)' },
  archived:  { label: 'Archived',  tone: 'neutral', color: 'var(--c-text-muted)' },
};

export const PRIORITY = {
  low:      { label: 'Low',      tone: 'neutral', icon: 'chevron-down',     color: 'var(--c-text-muted)' },
  medium:   { label: 'Medium',   tone: 'blue',    icon: 'equal',            color: 'var(--c-info)' },
  high:     { label: 'High',     tone: 'amber',   icon: 'arrow-up-right',   color: 'var(--c-warning)' },
  critical: { label: 'Critical', tone: 'red',     icon: 'arrow-up',         color: 'var(--c-error)' },
};

export const ISSUE_TYPE = {
  bug:         { label: 'Bug',         icon: 'bug' },
  improvement: { label: 'Improvement', icon: 'arrow-up' },
  task:        { label: 'Task',        icon: 'check' },
  incident:    { label: 'Incident',    icon: 'alert' },
};
