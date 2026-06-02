# Reusable Components Notes — Teacher Module

## Purpose

This document describes the reusable frontend components planned for the Teacher module. Reusable components help keep the user interface consistent and reduce repeated code across instructor pages.

## Main Reusable Components

The main reusable components used or planned in the Teacher module include:

- Dashboard cards
- Course cards
- Page headers
- Tables
- Forms
- Filters
- Tabs
- Status badges
- Loading states
- Empty states
- Error messages
- Action buttons

## Component Usage Diagram

```mermaid
flowchart TD
    A[Reusable Components] --> B[Dashboard Cards]
    A --> C[Course Cards]
    A --> D[Tables]
    A --> E[Forms]
    A --> F[Filters]
    A --> G[Tabs]
    A --> H[Status Badges]
    A --> I[Loading and Error States]

    B --> J[Instructor Dashboard]
    C --> K[My Courses]
    D --> L[Attendance Page]
    D --> M[Grades Page]
    D --> N[Students Section]
    E --> O[Materials Page]
    E --> P[Assignments Page]
    F --> Q[Course Filters]
    G --> R[Teacher Course Detail Page]
    H --> S[Assignments, Attendance and Grades]
```

## Explanation

Reusable components are shared between different pages of the Teacher module. For example, tables are used in attendance, grades, and students pages. Forms are used for materials and assignments. Tabs are used in the Teacher Course Detail Page to organize course-related actions.

## Result

Using reusable components makes the Teacher module easier to maintain, more consistent, and more organized.
