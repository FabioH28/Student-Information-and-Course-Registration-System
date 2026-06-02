# Communications Staff Role

Communications Staff handles institutional broadcast surfaces — announcements, events, clubs, and broadcast messaging. While the backend role identifier is `academic_staff` (the same as [Academic Staff](../academic-staff/)), the responsibilities are split here to reflect organisational governance: in larger institutions these are owned by a dedicated communications team.

## Responsibilities

- Publish announcements (general or scoped to a faculty / program / cohort)
- Create and manage campus events (lectures, workshops, fairs, sports days)
- Approve / reject student club join requests
- Create club records, approve club proposals
- Manage event registration windows and capacity
- Broadcast institutional messages (system-wide messaging)
- Maintain news feed visible at `/student/news`

## Screens (Frontend Routes)

| Route | Page |
|---|---|
| `/academic-staff/communications` | Communications Hub (announcements / events / clubs tabs) |
| `/staff/communications` | Same hub (legacy `/staff` URL variant) |

The hub aggregates:

- **Announcements** — create, edit, schedule, publish, withdraw
- **Events** — create, edit, view registrations
- **Clubs** — review join requests, approve / reject

## Key API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET/POST/PATCH /communications/announcements` | Announcement CRUD |
| `POST /communications/announcements/{id}/publish` | Flip `is_published` |
| `GET/POST/PATCH /communications/events` | Event CRUD |
| `GET /communications/events/{id}/registrations` | List registrants |
| `GET/POST /communications/clubs` | Club records |
| `PATCH /communications/club-memberships/{id}` | Approve / reject join request |
| `POST /messages` (with `broadcast: true`) | Broadcast message (allowed for `academic_staff`, `system_admin`) |

## Permissions Matrix

| Action | Allowed? |
|---|---|
| Publish announcement | ✅ |
| Withdraw announcement | ✅ |
| Create event | ✅ |
| View event registration list | ✅ |
| Approve / reject club join | ✅ |
| Create club | ✅ |
| Broadcast message | ✅ (`broadcast: true` requires `academic_staff` or `system_admin` role) |
| Send direct messages | ✅ |
| Issue invoice | ❌ |
| Edit grades | ❌ |

## Business Rules

- **Publication metadata.** Every announcement / event carries `created_by_user_id`, `created_at`, and (on publish) `published_at`.
- **Scope.** Announcements can target all students, a specific faculty, a specific program, or a cohort. Scope is enforced server-side at fetch.
- **Broadcast restriction.** Broadcast messages (`is_broadcast = true`) only allowed for `academic_staff` and `system_admin`. Other roles get 403.
- **Club approval.** Until communications staff approves, `club_membership.status` stays `requested`. Approval flips to `active`. Rejection flips to `rejected` with optional reason.
- **Event capacity.** When `capacity` is set, the system rejects registrations beyond it.

## Related Diagrams

- [user-scenarios.md](user-scenarios.md)
- [use-cases.md](use-cases.md)
- [activity-diagrams.md](activity-diagrams.md)
- [sequence-diagrams.md](sequence-diagrams.md)
- [diagrams/](diagrams/) — rendered PNGs of every Mermaid diagram (auto-generated)
