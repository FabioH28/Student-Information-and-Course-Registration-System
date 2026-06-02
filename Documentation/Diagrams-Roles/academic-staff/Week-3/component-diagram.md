# Component Diagram — Frontend Teacher Pages

This component diagram shows the main frontend pages and reusable components of the Teacher module. It explains how the instructor area is organized in the frontend.

## Component Diagram

```mermaid
flowchart TD
    A[Instructor Layout] --> B[Instructor Dashboard]
    A --> C[My Courses]
    A --> D[Teacher Course Detail Page]
    A --> E[Weekly Materials Page]
    A --> F[Teacher Assignments Page]
    A --> G[Attendance Page]
    A --> H[Grades Management Page]
    A --> I[Students Section]
    A --> J[Instructor Profile Page]

    B --> K[Dashboard Cards]
    B --> L[Weekly Schedule]
    B --> M[Notifications]

    C --> N[Course Cards]
    C --> O[Course Filters]

    D --> P[Course Header]
    D --> Q[Tabs Navigation]
    Q --> R[Materials Tab]
    Q --> S[Assignments Tab]
    Q --> T[Attendance Tab]
    Q --> U[Grades Tab]
    Q --> V[Students Tab]

    E --> W[Material Form]
    F --> X[Assignment Form]
    G --> Y[Attendance Table]
    H --> Z[Grades Table]
    I --> AA[Student List]
```

The Instructor Layout acts as the main wrapper for all teacher pages. The teacher can access the dashboard, assigned courses, course detail page, materials, assignments, attendance, grades, students, and profile.

The Teacher Course Detail Page is important because it connects several academic actions under one selected course. From this page, the teacher can move between materials, assignments, attendance, grades, and students using tab navigation.
