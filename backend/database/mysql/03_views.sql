USE cis;

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
GROUP BY
  co.id,
  c.code,
  c.title,
  at.name,
  co.section_code,
  co.capacity;

CREATE OR REPLACE VIEW vw_student_financial_summary AS
SELECT
  sp.id AS student_id,
  sp.student_number,
  CONCAT(u.first_name, ' ', u.last_name) AS student_name,
  COUNT(DISTINCT si.id) AS invoice_count,
  COALESCE(SUM(si.total_amount), 0.00) AS total_invoiced,
  COALESCE(SUM(pa.amount_applied), 0.00) AS total_paid,
  COALESCE(SUM(si.balance_amount), 0.00) AS outstanding_balance
FROM student_profiles sp
JOIN users u ON u.id = sp.user_id
LEFT JOIN student_invoices si ON si.student_id = sp.id AND si.status <> 'void'
LEFT JOIN payment_allocations pa ON pa.invoice_id = si.id
GROUP BY
  sp.id,
  sp.student_number,
  u.first_name,
  u.last_name;

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
JOIN (
  SELECT student_id, MAX(generated_at) AS max_generated_at
  FROM student_risk_assessments
  GROUP BY student_id
) latest
  ON latest.student_id = sra.student_id
 AND latest.max_generated_at = sra.generated_at
JOIN student_profiles sp ON sp.id = sra.student_id
JOIN users u ON u.id = sp.user_id;

CREATE OR REPLACE VIEW vw_club_summary AS
SELECT
  c.id AS club_id,
  c.code AS club_code,
  c.name AS club_name,
  cc.name AS category_name,
  c.status AS club_status,
  c.join_mode,
  COALESCE(members.active_members, 0) AS active_members,
  COALESCE(requests.pending_requests, 0) AS pending_requests,
  COALESCE(events.upcoming_events, 0) AS upcoming_events
FROM clubs c
JOIN club_categories cc ON cc.id = c.category_id
LEFT JOIN (
  SELECT club_id, COUNT(*) AS active_members
  FROM club_memberships
  WHERE status = 'active'
  GROUP BY club_id
) members ON members.club_id = c.id
LEFT JOIN (
  SELECT club_id, COUNT(*) AS pending_requests
  FROM club_join_requests
  WHERE status = 'pending'
  GROUP BY club_id
) requests ON requests.club_id = c.id
LEFT JOIN (
  SELECT club_id, COUNT(*) AS upcoming_events
  FROM campus_events
  WHERE starts_at >= CURRENT_TIMESTAMP
    AND status IN ('scheduled', 'open')
  GROUP BY club_id
) events ON events.club_id = c.id;

CREATE OR REPLACE VIEW vw_user_notification_summary AS
SELECT
  nr.user_id,
  COUNT(*) AS total_notifications,
  SUM(CASE WHEN nr.read_at IS NULL THEN 1 ELSE 0 END) AS unread_notifications,
  SUM(CASE WHEN n.severity IN ('warning', 'danger') AND nr.read_at IS NULL THEN 1 ELSE 0 END) AS unread_action_items,
  MAX(n.created_at) AS latest_notification_at
FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
GROUP BY nr.user_id;

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
