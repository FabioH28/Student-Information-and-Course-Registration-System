# CIS Full System Task Breakdown

This file lists the major tasks required to design, build, validate, document, and launch the full `CIS - Campus Information System`.

It is intentionally written without team-role assignments. The purpose is to show the complete work scope of the system.

## 1. Product Definition and Scope

- define the problem statement for a campus information system
- define the intended institutional users and stakeholders
- define the business goals of the platform
- define the scope boundaries of the first release
- identify which features are core, secondary, and future work
- define success criteria for student, teacher, and admin workflows
- define the main business rules for academic, finance, and engagement processes

## 2. Requirements Engineering

- gather and structure functional requirements
- gather and structure non-functional requirements
- define role-based permissions for students, teachers, admins, and staff
- define acceptance criteria for major flows
- define assumptions and constraints
- define system risks and mitigation assumptions
- maintain traceability from requirements to implementation

## 3. Domain Analysis and Conceptual Modelling

- identify the main domain entities
- model the relationships between users, profiles, courses, offerings, enrollments, grades, invoices, clubs, events, and notifications
- define bounded contexts such as:
  - identity and access
  - academic administration
  - finance
  - student engagement
  - communication and notifications
- define lifecycle states for critical business objects
- define business rules for prerequisites, registration, grading, attendance, and financial holds

## 4. Database Design and Data Management

- design the full relational schema
- define primary keys, foreign keys, constraints, and indexes
- create tables for:
  - roles, permissions, users, and profiles
  - departments, programs, courses, prerequisites, and offerings
  - enrollments, attendance, grades, and academic records
  - invoices, payments, holds, and aid
  - clubs, memberships, join requests
  - news, announcements, events, registrations
  - notifications and recipients
  - chat sessions and messages
  - settings and audit logs
- normalize the schema appropriately
- create seed/reference data
- create curriculum seed data
- define data dictionary entries
- define migration strategy
- define backup and recovery assumptions

## 5. Authentication, Authorization, and Security

- design institutional login flow
- implement password hashing
- implement access tokens and refresh tokens
- implement role-based authorization
- implement protected routes in frontend and protected endpoints in backend
- implement password reset flow
- implement forced password-change flow for first login or temporary credentials
- implement account lockout or throttling for repeated failed logins
- implement secure secret and environment management
- implement audit logging for sensitive actions
- review session handling and token revocation behavior

## 6. Frontend Foundation

- define route structure for public, student, teacher, and admin areas
- implement role-aware navigation and route guards
- implement global auth/session provider
- implement shared API client and error handling
- implement responsive layouts
- implement theme support including dark mode
- implement shared UI components and states
- implement loading, empty, success, and error states consistently
- implement mobile responsiveness for all major pages

## 7. Backend Foundation

- define backend package structure
- implement API router organization
- implement configuration loading
- implement database connection management
- implement security utilities
- implement shared request dependencies
- implement request and response schemas
- implement service layer organization
- implement consistent API error handling
- implement role-aware authorization checks across endpoints

## 8. Student Workspace

- build student dashboard
- build student profile view and profile update flow
- build selected courses page
- build registration page showing available offerings
- build timetable page
- build grades page
- build inbox page
- build finance page
- build news and announcements page
- build clubs page
- build student chatbot page
- connect every student page to real backend data
- ensure students can only access their own data

## 9. Teacher Workspace

- build teacher dashboard
- build assigned courses view
- build teacher student-roster view
- build attendance management page
- build gradebook page
- build teacher inbox page
- connect teacher pages to real backend data
- ensure teachers only see allowed students and offerings

## 10. Admin Workspace

- build admin dashboard
- build student management page
- build teacher and staff management page
- build course management page
- build semester or academic term management page
- build registration overview page
- build finance management page
- build club management page
- build news and event management page
- build analytics page
- build settings page
- connect admin pages to real backend data
- ensure admin operations are audited and validated

## 11. Academic Management Features

- create and manage departments
- create and manage programs
- create and manage courses
- define curriculum mapping between programs and courses
- define prerequisites
- create and manage academic terms
- create and manage course offerings
- assign teachers to offerings
- define schedule meetings for offerings
- validate room and timetable structure where needed
- support registration rules such as:
  - capacity
  - duplicates
  - term status
  - prerequisite satisfaction
- support enrollment status transitions

## 12. Registration and Enrollment Workflows

- load student registration workspace
- show selected courses
- show available offerings
- show curriculum guidance and recommendations
- support add or drop actions
- validate registration server-side
- support registration status review on the admin side
- handle waitlist, approval, rejection, and cancellation states if used
- record audit events for registration changes

## 13. Attendance Management

- create attendance sessions for an offering
- load enrolled student roster
- mark attendance status per student
- save attendance records
- display attendance history for students
- support teacher updates and corrections where allowed
- ensure attendance actions are linked to the correct session and enrollment

## 14. Grading and Academic Results

- create grade components for an offering
- define grade weights
- record student scores
- validate score ranges and total weights
- calculate final grade outcomes
- publish final grades
- expose grades to students after publication
- preserve auditability for grade changes

## 15. Finance Module

- define fee categories
- create and edit student invoice records
- create and edit invoice items
- record staff-entered payment information
- optionally link recorded payments to invoices for balance tracking
- calculate outstanding balances from staff-maintained records
- apply, edit, and release financial holds
- track financial aid or scholarship awards if in scope
- expose invoice and payment history to students
- expose finance controls to admins

## 16. Clubs, Events, and Student Engagement

- create and manage club categories
- create and manage clubs
- support club join requests
- approve or reject join requests
- maintain club memberships
- create and manage campus events
- define target audiences for events
- support event registration for students
- show club and event information in student workspace

## 17. News, Announcements, and Notifications

- create and manage news posts
- target news posts by audience
- create and manage announcements
- create and manage campus events
- generate in-app notifications for important actions
- build inbox views for student and teacher roles
- support read and archive behavior where needed
- ensure role-based visibility of communications

## 18. Chatbot and Advisory Features

- store chat sessions and chat messages
- build chatbot conversation interface
- connect chatbot requests to backend logic
- define the scope of chatbot guidance
- ensure chatbot uses only allowed student context
- log chatbot interactions if required
- define boundaries for future AI enhancement

## 19. Analytics and Reporting

- define analytics requirements for admin users
- aggregate key operational indicators
- build dashboard summary metrics
- build overview panels for registrations, finance, and user activity
- define export or reporting needs if required
- ensure analytics do not violate access control or privacy expectations

## 20. API Design and Integration Tasks

- design endpoint structure for auth, student, teacher, and admin modules
- define request and response contracts
- keep payloads consistent and role-appropriate
- handle validation errors clearly
- connect frontend actions to backend endpoints
- verify data shape consistency between backend and frontend
- eliminate mock-only flows where production behavior is expected

## 21. Validation and Testing

- test authentication flows
- test student workflows
- test teacher workflows
- test admin workflows
- test role-based access restrictions
- test responsive behavior on mobile and desktop
- test major integration points between frontend, backend, and database
- test invalid input and failure states
- test registration conflicts and edge cases
- test grade publication correctness
- test finance calculation correctness
- test password reset and lockout behavior
- prepare smoke tests and regression checks

## 22. Deployment and Operational Readiness

- define deployment topology for frontend, backend, and database
- define runtime environment variables
- define production database connection strategy
- define email provider integration for production
- define static asset and document storage approach if needed
- define logging strategy
- define monitoring and alerting expectations
- define backup and restore expectations
- define release checklist
- define post-launch support assumptions

## 23. Documentation and Modelling

- write system overview documentation
- maintain requirements documentation
- maintain use-case documentation
- maintain domain model
- maintain ER diagram
- maintain component architecture diagram
- maintain deployment diagram
- maintain sequence diagrams
- maintain activity diagrams
- maintain state diagrams
- maintain quality attribute scenarios
- maintain traceability matrix
- maintain setup and usage documentation

## 24. Presentation and Submission Preparation

- prepare final report structure
- align report with actual implemented system
- export diagrams to presentation-ready images
- prepare demo accounts and demo data
- prepare demo script for student, teacher, and admin flows
- rehearse explanation of architecture and tradeoffs
- prepare answers for likely technical questions
- ensure documentation, diagrams, and running system tell the same story

## 25. Final Launch-Readiness Review

- verify that every main role can log in and use its workspace
- verify that critical academic workflows work end to end
- verify that finance workflows work end to end
- verify that communication and engagement features work end to end
- verify that audit, security, and access restrictions behave correctly
- verify that the documentation reflects the actual product
- identify remaining gaps before production launch
- distinguish between:
  - must-fix issues
  - acceptable limitations
  - future improvements

## Definition of Completion

The system can be considered fully built only when:

- the database, backend, and frontend are consistently integrated
- student, teacher, and admin workspaces all function correctly
- core academic workflows work end to end
- finance and communication modules work end to end
- security and role restrictions are enforced
- documentation and diagrams match the real implementation
- testing and operational readiness are strong enough to support deployment
