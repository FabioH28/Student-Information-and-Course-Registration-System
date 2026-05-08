USE cis;

-- Compatibility views for names that used to be physical tables.
-- They do not store extra data; the 21 tables in 01_schema.sql remain the
-- only physical tables.

CREATE OR REPLACE VIEW roles AS
SELECT 1 AS id, 'Student' AS code, 'Student' AS name, 'Student workspace access.' AS description, TRUE AS is_system, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
UNION ALL SELECT 2, 'Instructor', 'Instructor', 'Instructor workspace access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 3, 'Academic Staff', 'Academic Staff', 'Academic administration access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 4, 'Finance Staff', 'Finance Staff', 'Finance workspace access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 5, 'Communication Staff', 'Communication Staff', 'Communications workspace access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 6, 'System Admin', 'System Admin', 'System administration access.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW user_roles AS
SELECT
  u.id AS user_id,
  r.id AS role_id,
  TRUE AS is_primary,
  u.created_by_user_id AS assigned_by_user_id,
  u.created_at AS assigned_at
FROM users u
JOIN roles r ON r.code = u.role
WHERE u.deleted_at IS NULL;

CREATE OR REPLACE VIEW permissions AS
SELECT 1 AS id, 'profile.view.self' AS code, 'View Own Profile' AS name, 'View own profile.' AS description, 'profile' AS resource, 'view_self' AS action, CURRENT_TIMESTAMP AS created_at
UNION ALL SELECT 2, 'profile.edit.self', 'Edit Own Profile', 'Edit own profile.', 'profile', 'edit_self', CURRENT_TIMESTAMP
UNION ALL SELECT 3, 'students.self_service', 'Student Self-Service Workspace', 'Student self-service.', 'students', 'self_service', CURRENT_TIMESTAMP
UNION ALL SELECT 4, 'instructors.workspace', 'Instructor Workspace', 'Instructor workspace.', 'instructors', 'workspace', CURRENT_TIMESTAMP
UNION ALL SELECT 5, 'instructors.timetable.view', 'View Instructor Timetable', 'Instructor timetable.', 'instructors', 'view_timetable', CURRENT_TIMESTAMP
UNION ALL SELECT 6, 'announcements.manage.instructor', 'Manage Course Announcements', 'Instructor announcements.', 'announcements', 'manage_instructor', CURRENT_TIMESTAMP
UNION ALL SELECT 7, 'academic.dashboard.view', 'View Academic Dashboard', 'Academic dashboard.', 'academic', 'view_dashboard', CURRENT_TIMESTAMP
UNION ALL SELECT 8, 'academic.records.manage', 'Manage Academic Records', 'Academic records.', 'academic_records', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 9, 'academic.grades.manage', 'Manage Grades', 'Academic grades.', 'grades', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 10, 'academic.attendance.manage', 'Manage Attendance', 'Academic attendance.', 'attendance', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 11, 'academic.courses.manage', 'Manage Course Catalog and Offerings', 'Academic courses.', 'courses', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 12, 'academic.terms.manage', 'Manage Terms', 'Academic terms.', 'academic_terms', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 13, 'academic.registrations.manage', 'Manage Registrations', 'Academic registrations.', 'registrations', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 14, 'academic.schedule.manage', 'Manage Scheduling', 'Academic scheduling.', 'scheduling', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 15, 'academic.exams.manage', 'Manage Exam Scheduling', 'Exam scheduling.', 'exams', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 16, 'finance.dashboard.view', 'View Finance Dashboard', 'Finance dashboard.', 'finance', 'view_dashboard', CURRENT_TIMESTAMP
UNION ALL SELECT 17, 'finance.records.manage', 'Manage Finance Records', 'Finance records.', 'finance', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 18, 'communications.dashboard.view', 'View Communications Dashboard', 'Communications dashboard.', 'communications', 'view_dashboard', CURRENT_TIMESTAMP
UNION ALL SELECT 19, 'announcements.manage', 'Manage Announcements', 'Announcements.', 'announcements', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 20, 'events.manage', 'Manage Events', 'Events.', 'events', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 21, 'announcements.media.upload', 'Upload Announcement Media', 'Media uploads.', 'media', 'upload', CURRENT_TIMESTAMP
UNION ALL SELECT 22, 'notifications.send', 'Send Notifications', 'Notifications.', 'notifications', 'send', CURRENT_TIMESTAMP
UNION ALL SELECT 23, 'reports.view', 'View Reports', 'Reports.', 'reports', 'view', CURRENT_TIMESTAMP
UNION ALL SELECT 24, 'users.manage', 'Manage Users', 'Users.', 'users', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 25, 'roles.manage', 'Manage Roles', 'Roles.', 'roles', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 26, 'settings.manage', 'Manage Settings', 'Settings.', 'settings', 'manage', CURRENT_TIMESTAMP
UNION ALL SELECT 27, 'system.overview.view', 'View System Overview', 'System overview.', 'system', 'view_overview', CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW role_permissions AS
SELECT r.id AS role_id, p.id AS permission_id, CURRENT_TIMESTAMP AS granted_at
FROM roles r
JOIN permissions p
  ON (
    (r.code = 'Student' AND p.code IN ('profile.view.self','profile.edit.self','students.self_service','reports.view'))
    OR (r.code = 'Instructor' AND p.code IN ('profile.view.self','profile.edit.self','instructors.workspace','instructors.timetable.view','announcements.manage.instructor','notifications.send','reports.view'))
    OR (r.code = 'Academic Staff' AND p.code IN ('profile.view.self','profile.edit.self','academic.dashboard.view','academic.records.manage','academic.grades.manage','academic.attendance.manage','academic.courses.manage','academic.terms.manage','academic.registrations.manage','academic.schedule.manage','academic.exams.manage','communications.dashboard.view','announcements.manage','events.manage','announcements.media.upload','notifications.send','reports.view'))
    OR (r.code = 'Finance Staff' AND p.code IN ('profile.view.self','profile.edit.self','finance.dashboard.view','finance.records.manage','notifications.send','reports.view'))
    OR (r.code = 'Communication Staff' AND p.code IN ('profile.view.self','profile.edit.self','communications.dashboard.view','announcements.manage','events.manage','announcements.media.upload','notifications.send','reports.view'))
    OR (r.code = 'System Admin' AND p.code IN ('profile.view.self','profile.edit.self','system.overview.view','academic.dashboard.view','academic.records.manage','academic.grades.manage','academic.attendance.manage','academic.courses.manage','academic.terms.manage','academic.registrations.manage','academic.schedule.manage','academic.exams.manage','finance.dashboard.view','finance.records.manage','communications.dashboard.view','announcements.manage','events.manage','announcements.media.upload','notifications.send','reports.view','users.manage','roles.manage','settings.manage'))
  );

CREATE OR REPLACE VIEW departments AS
SELECT
  p.department_id AS id,
  p.department_code AS code,
  p.department_name AS name,
  CONCAT('Department of ', p.department_name, '.') AS description,
  'active' AS status,
  MIN(p.created_at) AS created_at,
  MAX(p.updated_at) AS updated_at
FROM programs p
GROUP BY p.department_id, p.department_code, p.department_name;

CREATE OR REPLACE VIEW student_profiles AS
SELECT
  u.id,
  u.id AS user_id,
  u.student_number,
  u.department_id,
  u.program_id,
  u.date_of_birth,
  u.gender,
  u.admission_date,
  u.expected_graduation_date,
  u.current_semester,
  u.cumulative_gpa,
  u.earned_credits,
  u.academic_status AS status,
  u.address_line_1,
  u.address_line_2,
  u.city,
  u.state_region,
  u.postal_code,
  u.country,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.role = 'Student' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW teacher_profiles AS
SELECT
  u.id,
  u.id AS user_id,
  u.employee_number,
  u.department_id,
  u.title,
  u.hire_date,
  u.employment_status,
  u.specialization,
  u.office_location,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.role = 'Instructor' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW admin_profiles AS
SELECT
  u.id,
  u.id AS user_id,
  u.employee_number,
  u.title,
  u.office_location,
  u.employment_status,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.role IN ('Academic Staff','Finance Staff','Communication Staff','System Admin') AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW buildings AS
SELECT
  co.building_id AS id,
  COALESCE(co.building_code, 'CAMPUS') AS code,
  COALESCE(co.building_name, 'Campus') AS name,
  NULL AS description,
  MIN(co.created_at) AS created_at,
  MAX(co.updated_at) AS updated_at
FROM course_offerings co
WHERE co.building_id IS NOT NULL
GROUP BY co.building_id, co.building_code, co.building_name;

CREATE OR REPLACE VIEW rooms AS
SELECT
  co.room_id AS id,
  COALESCE(MIN(co.building_id), 1) AS building_id,
  COALESCE(MIN(co.room_code), CONCAT('ROOM-', co.room_id)) AS code,
  COALESCE(MIN(co.room_name), MIN(co.location_name), MIN(co.schedule_notes), 'Campus Room') AS name,
  MAX(co.capacity) AS capacity,
  COALESCE(MIN(co.room_type), 'lecture') AS room_type,
  MIN(co.created_at) AS created_at,
  MAX(co.updated_at) AS updated_at
FROM course_offerings co
WHERE co.room_id IS NOT NULL
GROUP BY co.room_id;

CREATE OR REPLACE VIEW course_meetings AS
SELECT
  co.id,
  co.id AS course_offering_id,
  co.room_id,
  co.meeting_day_of_week AS day_of_week,
  co.meeting_start_time AS start_time,
  co.meeting_end_time AS end_time,
  co.meeting_type,
  co.created_at,
  co.updated_at
FROM course_offerings co
WHERE co.meeting_day_of_week IS NOT NULL;

CREATE OR REPLACE VIEW program_courses AS
SELECT
  c.program_id,
  c.id AS course_id,
  c.recommended_term_number,
  c.requirement_type,
  c.is_active,
  c.created_at,
  c.updated_at
FROM courses c
WHERE c.program_id IS NOT NULL;

CREATE OR REPLACE VIEW course_prerequisites AS
SELECT
  c.id AS course_id,
  c.prerequisite_course_id,
  c.minimum_grade_required,
  c.created_at
FROM courses c
WHERE c.prerequisite_course_id IS NOT NULL;

CREATE OR REPLACE VIEW student_term_records AS
SELECT
  u.id,
  u.id AS student_id,
  at.id AS academic_term_id,
  u.current_semester AS semester_number,
  u.earned_credits AS registered_credits,
  u.earned_credits,
  u.cumulative_gpa AS term_gpa,
  u.cumulative_gpa,
  CASE WHEN u.cumulative_gpa < 2.0 THEN 'probation' ELSE 'good' END AS academic_standing,
  u.created_at,
  u.updated_at
FROM users u
JOIN academic_terms at ON at.is_current = TRUE
WHERE u.role = 'Student' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW final_grades AS
SELECT
  e.id,
  e.id AS enrollment_id,
  e.final_numeric_grade AS numeric_grade,
  e.final_letter_grade AS letter_grade,
  e.grade_points,
  e.final_grade_status AS status,
  e.final_grade_published_at AS published_at,
  e.final_grade_approved_by_teacher_id AS approved_by_teacher_id,
  e.created_at,
  e.updated_at
FROM enrollments e
WHERE e.final_numeric_grade IS NOT NULL OR e.final_letter_grade IS NOT NULL;

CREATE OR REPLACE VIEW student_risk_assessments AS
SELECT
  u.id,
  u.id AS student_id,
  at.id AS academic_term_id,
  CASE
    WHEN u.cumulative_gpa < 2.0 THEN 'high'
    WHEN u.cumulative_gpa < 2.7 THEN 'medium'
    ELSE 'low'
  END AS risk_level,
  CASE
    WHEN u.cumulative_gpa < 2.0 THEN 78.00
    WHEN u.cumulative_gpa < 2.7 THEN 46.00
    ELSE 18.00
  END AS risk_score,
  CASE
    WHEN u.cumulative_gpa < 2.0 THEN 'GPA requires immediate academic follow-up.'
    WHEN u.cumulative_gpa < 2.7 THEN 'Academic progress should be monitored this term.'
    ELSE 'Academic progress is currently stable.'
  END AS summary,
  NULL AS generated_by_user_id,
  CURRENT_TIMESTAMP AS generated_at
FROM users u
JOIN academic_terms at ON at.is_current = TRUE
WHERE u.role = 'Student' AND u.deleted_at IS NULL;

CREATE OR REPLACE VIEW student_recommendations AS
SELECT
  (u.id * 100000 + c.id) AS id,
  u.id AS student_id,
  at.id AS academic_term_id,
  c.id AS recommended_course_id,
  CONCAT('Recommended from the ', p.name, ' curriculum.') AS reason,
  COALESCE(c.recommended_term_number, 99) AS priority,
  'suggested' AS status,
  NULL AS created_by_user_id,
  CURRENT_TIMESTAMP AS created_at
FROM users u
JOIN programs p ON p.id = u.program_id
JOIN courses c ON c.program_id = p.id AND c.is_active = TRUE
JOIN academic_terms at ON at.is_current = TRUE
WHERE u.role = 'Student'
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.course_offering_id
    WHERE e.student_id = u.id
      AND co.course_id = c.id
      AND e.status IN ('pending','enrolled','waitlisted','completed')
  );

CREATE OR REPLACE VIEW financial_aid_awards AS
SELECT
  CAST(NULL AS UNSIGNED) AS id,
  CAST(NULL AS UNSIGNED) AS student_id,
  CAST(NULL AS UNSIGNED) AS academic_term_id,
  CAST(NULL AS CHAR(100)) AS award_name,
  CAST(NULL AS DECIMAL(10,2)) AS amount,
  CAST(NULL AS CHAR(20)) AS status,
  CAST(NULL AS DATETIME) AS awarded_at
WHERE 1 = 0;

CREATE OR REPLACE VIEW invoice_items AS
SELECT
  si.id,
  si.id AS invoice_id,
  CAST(NULL AS UNSIGNED) AS fee_category_id,
  COALESCE(si.description, si.notes, 'Student charge') AS description,
  1.00 AS quantity,
  si.total_amount AS unit_amount,
  si.total_amount AS line_total,
  si.created_at,
  si.updated_at
FROM student_invoices si;

CREATE OR REPLACE VIEW payment_allocations AS
SELECT
  p.id,
  p.id AS payment_id,
  p.invoice_id,
  p.amount AS amount_applied,
  p.created_at
FROM payments p
WHERE p.invoice_id IS NOT NULL;

CREATE OR REPLACE VIEW club_categories AS
SELECT 1 AS id, 'ACADEMIC' AS code, 'Academic' AS name, 'Academic and professional development organizations.' AS description, TRUE AS is_active, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
UNION ALL SELECT 2, 'ENGINEERING', 'Engineering', 'Engineering and technology organizations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 3, 'ARTS', 'Arts', 'Creative arts, music, and design organizations.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 4, 'LEADERSHIP', 'Leadership', 'Leadership and student development clubs.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
UNION ALL SELECT 5, 'SPORTS', 'Sports', 'Sports and recreation clubs.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW club_join_requests AS
SELECT
  cm.id,
  cm.club_id,
  cm.student_id,
  cm.member_role AS requested_role,
  cm.status,
  cm.request_message,
  COALESCE(cm.submitted_at, cm.created_at) AS submitted_at,
  cm.reviewed_at,
  cm.reviewed_by_admin_id,
  cm.review_notes,
  cm.created_at,
  cm.updated_at
FROM club_memberships cm
WHERE cm.status IN ('pending','waitlisted','rejected');

CREATE OR REPLACE VIEW news_post_audiences AS
SELECT
  CAST(NULL AS UNSIGNED) AS id,
  CAST(NULL AS UNSIGNED) AS news_post_id,
  CAST(NULL AS UNSIGNED) AS role_id,
  CAST(NULL AS UNSIGNED) AS department_id,
  CAST(NULL AS UNSIGNED) AS program_id,
  CAST(NULL AS UNSIGNED) AS academic_term_id
WHERE 1 = 0;

CREATE OR REPLACE VIEW campus_event_audiences AS
SELECT
  CAST(NULL AS UNSIGNED) AS id,
  CAST(NULL AS UNSIGNED) AS campus_event_id,
  CAST(NULL AS UNSIGNED) AS role_id,
  CAST(NULL AS UNSIGNED) AS department_id,
  CAST(NULL AS UNSIGNED) AS program_id,
  CAST(NULL AS UNSIGNED) AS academic_term_id
WHERE 1 = 0;

CREATE OR REPLACE VIEW notification_recipients AS
SELECT
  n.id,
  n.id AS notification_id,
  n.user_id,
  n.delivered_at,
  n.read_at,
  n.archived_at
FROM notifications n;

CREATE OR REPLACE VIEW ai_chat_sessions AS
SELECT
  m.conversation_id AS id,
  m.student_id,
  MIN(m.title) AS title,
  MIN(m.session_status) AS status,
  MIN(m.started_at) AS started_at,
  MAX(m.last_message_at) AS last_message_at
FROM ai_chat_messages m
GROUP BY m.conversation_id, m.student_id;

CREATE OR REPLACE VIEW auth_refresh_tokens AS
SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
FROM auth_tokens
WHERE token_type = 'refresh';

CREATE OR REPLACE VIEW password_reset_tokens AS
SELECT id, user_id, token_hash, expires_at, used_at, created_at
FROM auth_tokens
WHERE token_type = 'password_reset';

CREATE OR REPLACE VIEW audit_logs AS
SELECT
  n.id,
  n.created_by_user_id AS actor_user_id,
  COALESCE(n.source_entity_type, 'notification') AS entity_type,
  CAST(COALESCE(n.source_entity_id, n.id) AS CHAR(80)) AS entity_id,
  'notify' AS action,
  n.title AS summary,
  n.created_at
FROM notifications n
WHERE n.created_by_user_id IS NOT NULL;

CREATE OR REPLACE VIEW system_settings AS
SELECT 1 AS id, 'auth.email_login_only' AS setting_key, 'Email Login Only' AS setting_label, 'boolean' AS value_type, 'true' AS value_text, 'Only email/password accounts can sign in.' AS description, CURRENT_TIMESTAMP AS updated_at, NULL AS updated_by_user_id
UNION ALL SELECT 2, 'finance.default_currency', 'Default Currency', 'string', 'USD', 'Default finance currency.', CURRENT_TIMESTAMP, NULL
UNION ALL SELECT 3, 'clubs.join_request_review_sla_hours', 'Club Join Review SLA', 'number', '72', 'Expected club request review window.', CURRENT_TIMESTAMP, NULL
UNION ALL SELECT 4, 'news.default_visibility_days', 'News Visibility Window', 'number', '14', 'Default news visibility window.', CURRENT_TIMESTAMP, NULL
UNION ALL SELECT 5, 'chatbot.academic_assistant_enabled', 'Academic Assistant Enabled', 'boolean', 'true', 'Controls whether the student assistant is enabled.', CURRENT_TIMESTAMP, NULL;

-- Reporting views used by dashboards.

CREATE OR REPLACE VIEW vw_course_offering_enrollment_summary AS
SELECT
  co.id AS course_offering_id,
  c.code AS course_code,
  c.title AS course_title,
  at.name AS academic_term_name,
  co.section_code,
  co.capacity,
  SUM(CASE WHEN e.status = 'enrolled' THEN 1 ELSE 0 END) AS enrolled_count,
  SUM(CASE WHEN e.status = 'waitlisted' THEN 1 ELSE 0 END) AS waitlisted_count,
  SUM(CASE WHEN e.status IN ('dropped', 'withdrawn') THEN 1 ELSE 0 END) AS dropped_count,
  (co.capacity - SUM(CASE WHEN e.status = 'enrolled' THEN 1 ELSE 0 END)) AS seats_remaining
FROM course_offerings co
JOIN courses c ON c.id = co.course_id
JOIN academic_terms at ON at.id = co.academic_term_id
LEFT JOIN enrollments e ON e.course_offering_id = co.id
GROUP BY co.id, c.code, c.title, at.name, co.section_code, co.capacity;

CREATE OR REPLACE VIEW vw_student_financial_summary AS
SELECT
  u.id AS student_id,
  u.student_number,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  COUNT(DISTINCT si.id) AS invoice_count,
  COALESCE(SUM(si.total_amount), 0.00) AS total_invoiced,
  COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE 0 END), 0.00) AS total_paid,
  COALESCE(SUM(si.balance_amount), 0.00) AS outstanding_balance
FROM users u
LEFT JOIN student_invoices si ON si.student_id = u.id AND si.status <> 'void'
LEFT JOIN payments p ON p.invoice_id = si.id
WHERE u.role = 'Student'
GROUP BY u.id, u.student_number, u.first_name, u.last_name;

CREATE OR REPLACE VIEW vw_latest_student_risk AS
SELECT
  sra.student_id,
  sp.student_number,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  sra.academic_term_id,
  sra.risk_level,
  sra.risk_score,
  sra.summary,
  sra.generated_at
FROM student_risk_assessments sra
JOIN student_profiles sp ON sp.id = sra.student_id
JOIN users u ON u.id = sp.user_id;

CREATE OR REPLACE VIEW vw_club_summary AS
SELECT
  c.id AS club_id,
  c.code AS club_code,
  c.name AS club_name,
  c.category_name,
  c.status AS club_status,
  c.join_mode,
  COALESCE(SUM(CASE WHEN cm.status = 'active' THEN 1 ELSE 0 END), 0) AS active_members,
  COALESCE(SUM(CASE WHEN cm.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_requests,
  (
    SELECT COUNT(*)
    FROM campus_events ce
    WHERE ce.club_id = c.id
      AND ce.starts_at >= CURRENT_TIMESTAMP
      AND ce.status IN ('scheduled','open')
  ) AS upcoming_events
FROM clubs c
LEFT JOIN club_memberships cm ON cm.club_id = c.id
GROUP BY c.id, c.code, c.name, c.category_name, c.status, c.join_mode;

CREATE OR REPLACE VIEW vw_user_notification_summary AS
SELECT
  n.user_id,
  COUNT(*) AS total_notifications,
  SUM(CASE WHEN n.read_at IS NULL THEN 1 ELSE 0 END) AS unread_notifications,
  SUM(CASE WHEN n.severity IN ('warning', 'danger') AND n.read_at IS NULL THEN 1 ELSE 0 END) AS unread_action_items,
  MAX(n.created_at) AS latest_notification_at
FROM notifications n
GROUP BY n.user_id;

CREATE OR REPLACE VIEW vw_news_event_activity AS
SELECT
  'news_post' AS activity_type,
  np.id AS activity_id,
  np.title,
  np.status,
  np.priority AS descriptor,
  np.published_at AS activity_at
FROM news_posts np
UNION ALL
SELECT
  'campus_event' AS activity_type,
  ce.id AS activity_id,
  ce.title,
  ce.status,
  ce.event_type AS descriptor,
  ce.starts_at AS activity_at
FROM campus_events ce;
