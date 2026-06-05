# System Admin — Activity Diagrams

Activity diagrams for the System Administrator access layer, traced to the
real backend (`/users/*`, `/semesters/*`) and the admin web pages (`/admin/*`).

| File | Contents |
|------|----------|
| [activity-diagrams.md](activity-diagrams.md) | Mermaid source for A1–A5 (renders on GitHub / VS Code preview) |
| activity-diagrams-01.png | A1 — Approve / refuse a pending account |
| activity-diagrams-02.png | A2 — Create a user with notification |
| activity-diagrams-03.png | A3 — Toggle account active (admin self-protection) |
| activity-diagrams-04.png | A4 — Reset a user's password |
| activity-diagrams-05.png | A5 — Activate a semester |
| [activity-system-admin-access-flow.md](activity-system-admin-access-flow.md) | Role-based access flow for the admin layer |

The PNGs are rendered from the Mermaid blocks in `activity-diagrams.md`, so the
two are always kept in sync.
