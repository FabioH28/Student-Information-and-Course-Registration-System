USE cis;

INSERT INTO roles (code, name, description, is_system)
VALUES
  ('Student', 'Student', 'Accesses personal academic and financial information and self-service student workflows.', TRUE),
  ('Instructor', 'Instructor', 'Manages teaching workflows for assigned course offerings and students.', TRUE),
  ('Academic Staff', 'Academic Staff', 'Handles academic administration, registration, scheduling, and academic records.', TRUE),
  ('Finance Staff', 'Finance Staff', 'Manages tuition, manual invoices, payment records, and finance records.', TRUE),
  ('Communication Staff', 'Communication Staff', 'Manages announcements, events, media, and public communication content.', TRUE),
  ('System Admin', 'System Admin', 'Manages users, roles, settings, reports, and overall system oversight.', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_system = VALUES(is_system);

INSERT INTO permissions (code, name, description, resource, action)
VALUES
  ('profile.view.self', 'View Own Profile', 'Allows a user to view their own CIS profile.', 'profile', 'view_self'),
  ('profile.edit.self', 'Edit Own Profile', 'Allows a user to update their own CIS profile.', 'profile', 'edit_self'),
  ('students.self_service', 'Student Self-Service Workspace', 'Allows a student to use their academic, registration, finance, inbox, club, and chatbot workspace.', 'students', 'self_service'),
  ('instructors.workspace', 'Instructor Workspace', 'Allows an instructor to manage assigned courses, grades, attendance, and inbox items.', 'instructors', 'workspace'),
  ('instructors.timetable.view', 'View Instructor Timetable', 'Allows an instructor to view their assigned timetable.', 'instructors', 'view_timetable'),
  ('announcements.manage.instructor', 'Manage Course Announcements', 'Allows an instructor to create and update course-related announcements.', 'announcements', 'manage_instructor'),
  ('academic.dashboard.view', 'View Academic Dashboard', 'Allows academic staff to view academic administration dashboards.', 'academic', 'view_dashboard'),
  ('academic.records.manage', 'Manage Academic Records', 'Allows academic staff to manage student academic records and roster visibility.', 'academic_records', 'manage'),
  ('academic.grades.manage', 'Manage Grades', 'Allows academic staff to edit grades across academic workflows.', 'grades', 'manage'),
  ('academic.attendance.manage', 'Manage Attendance', 'Allows academic staff to record and update attendance across academic workflows.', 'attendance', 'manage'),
  ('academic.courses.manage', 'Manage Course Catalog and Offerings', 'Allows academic staff to manage course catalog and semester offerings.', 'courses', 'manage'),
  ('academic.terms.manage', 'Manage Terms', 'Allows academic staff to manage semesters, exam periods, and registration windows.', 'academic_terms', 'manage'),
  ('academic.registrations.manage', 'Manage Registrations', 'Allows academic staff to manage course registrations and enrollment statuses.', 'registrations', 'manage'),
  ('academic.schedule.manage', 'Manage Scheduling', 'Allows academic staff to manage timetables and scheduling workflows.', 'scheduling', 'manage'),
  ('academic.exams.manage', 'Manage Exam Scheduling', 'Allows academic staff to manage exam schedules.', 'exams', 'manage'),
  ('finance.dashboard.view', 'View Finance Dashboard', 'Allows finance staff to view finance dashboards and reports.', 'finance', 'view_dashboard'),
  ('finance.records.manage', 'Manage Finance Records', 'Allows finance staff to manage manual invoices, payment records, and holds.', 'finance', 'manage'),
  ('communications.dashboard.view', 'View Communications Dashboard', 'Allows staff to view announcement and event management dashboards.', 'communications', 'view_dashboard'),
  ('announcements.manage', 'Manage Announcements', 'Allows staff to create and update announcements and news items.', 'announcements', 'manage'),
  ('events.manage', 'Manage Events', 'Allows staff to create and update campus events and related club workflows.', 'events', 'manage'),
  ('announcements.media.upload', 'Upload Announcement Media', 'Allows staff to manage media assets used in public communications.', 'media', 'upload'),
  ('notifications.send', 'Send Notifications', 'Allows staff to issue notifications to relevant users.', 'notifications', 'send'),
  ('reports.view', 'View Reports', 'Allows access to dashboard and reporting summaries.', 'reports', 'view'),
  ('users.manage', 'Manage Users', 'Allows a System Admin to create and manage user accounts.', 'users', 'manage'),
  ('roles.manage', 'Manage Roles', 'Allows a System Admin to change role assignments.', 'roles', 'manage'),
  ('settings.manage', 'Manage Settings', 'Allows a System Admin to manage system settings.', 'settings', 'manage'),
  ('system.overview.view', 'View System Overview', 'Allows a System Admin to view global system dashboards.', 'system', 'view_overview')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  resource = VALUES(resource),
  action = VALUES(action);

DELETE rp
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
WHERE r.code IN ('Student', 'Instructor', 'Academic Staff', 'Finance Staff', 'Communication Staff', 'System Admin');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
  ON (
    (r.code = 'Student' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'students.self_service',
      'reports.view'
    ))
    OR
    (r.code = 'Instructor' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'instructors.workspace',
      'instructors.timetable.view',
      'announcements.manage.instructor',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Academic Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'academic.dashboard.view',
      'academic.records.manage',
      'academic.grades.manage',
      'academic.attendance.manage',
      'academic.courses.manage',
      'academic.terms.manage',
      'academic.registrations.manage',
      'academic.schedule.manage',
      'academic.exams.manage',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Finance Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'finance.dashboard.view',
      'finance.records.manage',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'Communication Staff' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view'
    ))
    OR
    (r.code = 'System Admin' AND p.code IN (
      'profile.view.self',
      'profile.edit.self',
      'system.overview.view',
      'academic.dashboard.view',
      'academic.records.manage',
      'academic.courses.manage',
      'academic.terms.manage',
      'academic.registrations.manage',
      'academic.schedule.manage',
      'academic.exams.manage',
      'finance.dashboard.view',
      'finance.records.manage',
      'communications.dashboard.view',
      'announcements.manage',
      'events.manage',
      'announcements.media.upload',
      'notifications.send',
      'reports.view',
      'users.manage',
      'roles.manage',
      'settings.manage'
    ))
  )
ON DUPLICATE KEY UPDATE
  granted_at = granted_at;

INSERT INTO fee_categories (code, name, description, default_amount, is_recurring, is_active)
VALUES
  ('TUITION', 'Tuition', 'Base tuition fee charged per academic term.', NULL, TRUE, TRUE),
  ('LAB', 'Laboratory Fee', 'Laboratory and equipment usage fee.', NULL, TRUE, TRUE),
  ('LIBRARY', 'Library Fee', 'Library access and materials fee.', NULL, TRUE, TRUE),
  ('EXAM', 'Examination Fee', 'Assessment and exam administration fee.', NULL, TRUE, TRUE),
  ('LATE', 'Late Penalty', 'Penalty applied for overdue balances.', NULL, FALSE, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  default_amount = VALUES(default_amount),
  is_recurring = VALUES(is_recurring),
  is_active = VALUES(is_active);

INSERT INTO club_categories (code, name, description, is_active)
VALUES
  ('ACADEMIC', 'Academic', 'Academic and professional development organizations.', TRUE),
  ('ENGINEERING', 'Engineering', 'Engineering and technology-focused organizations.', TRUE),
  ('ARTS', 'Arts', 'Creative arts, music, and design organizations.', TRUE),
  ('LEADERSHIP', 'Leadership', 'Leadership, debate, and student development clubs.', TRUE),
  ('SPORTS', 'Sports', 'Sports, recreation, and athletic clubs.', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO system_settings (setting_key, setting_label, value_type, value_text, description)
VALUES
  ('auth.email_login_only', 'Email Login Only', 'boolean', 'true', 'Only admin-provisioned email accounts can be used to sign in.'),
  ('finance.default_currency', 'Default Currency', 'string', 'USD', 'Default currency for invoices, payments, and finance displays.'),
  ('clubs.join_request_review_sla_hours', 'Club Join Review SLA', 'number', '72', 'Expected review turnaround for club join requests in hours.'),
  ('news.default_visibility_days', 'News Visibility Window', 'number', '14', 'Default number of days a published news post remains visible.'),
  ('chatbot.academic_assistant_enabled', 'Academic Assistant Enabled', 'boolean', 'true', 'Controls whether the AI academic assistant is enabled for students.')
ON DUPLICATE KEY UPDATE
  setting_label = VALUES(setting_label),
  value_type = VALUES(value_type),
  value_text = VALUES(value_text),
  description = VALUES(description);
