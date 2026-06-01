-- =====================================================================
-- Seed data — development only. Safe to re-run (uses fixed UUIDs).
-- =====================================================================

insert into public.members (id, full_name, email, role, capacity_hours_per_week) values
  ('11111111-1111-1111-1111-111111111111', 'An Nguyen',   'an@acme.dev',   'admin',  40),
  ('22222222-2222-2222-2222-222222222222', 'Binh Tran',   'binh@acme.dev', 'member', 40),
  ('33333333-3333-3333-3333-333333333333', 'Chi Le',      'chi@acme.dev',  'member', 32),
  ('44444444-4444-4444-4444-444444444444', 'Dung Pham',   'dung@acme.dev', 'member', 40)
on conflict (id) do nothing;

insert into public.projects (id, key, name, description, status, lead_id, start_date, end_date) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'ATL', 'Atlassian Revamp', 'Redesign of the core workspace UI', 'active',   '11111111-1111-1111-1111-111111111111', '2026-01-05', '2026-06-30'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'API', 'Public API v2',     'Versioned REST + webhooks',          'planning', '22222222-2222-2222-2222-222222222222', '2026-03-01', null)
on conflict (id) do nothing;

insert into public.tasks (id, project_id, title, status, priority, assignee_id, reporter_id, progress, estimate_hours, due_date, position) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Design token system',        'done',        'high',     '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 100, 16, '2026-02-01', 0),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Sidebar navigation',          'in_progress', 'medium',   '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 60,  12, '2026-02-15', 0),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Board drag-and-drop',         'todo',        'high',     '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 0,   20, '2026-03-01', 1),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', 'Auth & rate limiting',        'in_review',   'critical', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 80,  24, '2026-03-20', 0)
on conflict (id) do nothing;

insert into public.issues (id, project_id, task_id, title, type, status, priority, assignee_id, reporter_id) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'Sidebar overflows on small screens', 'bug',         'open',        'medium', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', null,                                   'Add idempotency keys to POST',        'improvement', 'in_progress', 'high',   '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into public.allocations (id, member_id, project_id, allocation_pct, start_date, end_date) values
  ('dddddddd-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', 100, '2026-01-05', '2026-06-30'),
  ('dddddddd-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-0000-0000-0000-000000000001', 50,  '2026-02-01', null),
  ('dddddddd-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000002', 100, '2026-03-01', null)
on conflict (id) do nothing;
