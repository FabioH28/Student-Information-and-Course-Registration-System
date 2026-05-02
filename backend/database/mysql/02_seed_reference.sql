USE cis;

-- Lean schema note:
-- Roles, permissions, club categories, and settings are now represented by
-- enum fields plus compatibility views in 03_views.sql. There is no physical
-- reference-data table to seed here.

SELECT 'reference data is supplied by lean schema views' AS status;
