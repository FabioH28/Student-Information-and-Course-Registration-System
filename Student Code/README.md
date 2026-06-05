# Student Code

This folder is a presentation-only copy of the student access level code.

The real application still runs from the original folders:

- `frontend/src/...`
- `backend/src/...`

Nothing in this folder is imported by the app. It exists so the student access level can be presented separately without changing functionality.

## How To Present It

1. Start with `frontend/src/components/RequireAuth.tsx` and `frontend/src/lib/authRoles.ts` to explain student route access.
2. Show `frontend/src/layouts/StudentLayout.tsx` and `frontend/src/components/layout/AppSidebar.tsx` to explain the student workspace.
3. Show `frontend/src/pages/student/` to explain the student screens.
4. Show `backend/src/utils/security.py` and `backend/src/routes/` to explain backend protection.
5. Show `backend/src/models/` and `backend/src/schemas/` to explain the main objects and API data shapes.
6. Use `MODULE_COMMENTS.md` as the speaking notes for what each module does.

## Verification

After creating this folder, the original test suites were run again:

- Frontend: `npm.cmd run test` - 8 passed
- Backend: `backend\.venv\Scripts\python.exe -m pytest "Code Tests/backend"` - 25 passed

