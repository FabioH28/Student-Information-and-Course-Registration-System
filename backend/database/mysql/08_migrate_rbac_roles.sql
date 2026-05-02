USE cis;

-- RBAC now lives directly on users.role, so no join-table migration is needed.

SELECT 'rbac migration skipped for lean schema' AS status;
