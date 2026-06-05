# System Admin — Sequence Diagrams

Sequence diagrams for the System Administrator access layer, traced to the
real backend (`/users/*`, `/semesters/*`) and the admin web pages (`/admin/*`).

| File | Contents |
|------|----------|
| [sequence-diagrams.md](sequence-diagrams.md) | Mermaid source for S1–S5 (renders on GitHub / VS Code preview) |
| sequence-diagrams-01.png | S1 — Approve a pending account |
| sequence-diagrams-02.png | S2 — Create a user |
| sequence-diagrams-03.png | S3 — Disable an account (admin guard rejects) |
| sequence-diagrams-04.png | S4 — Reset a user's password |
| sequence-diagrams-05.png | S5 — Activate a semester |

The PNGs are rendered from the Mermaid blocks in `sequence-diagrams.md`, so the
two are always kept in sync.
