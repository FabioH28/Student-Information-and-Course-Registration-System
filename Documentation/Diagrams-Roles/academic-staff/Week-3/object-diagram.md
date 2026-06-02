# Object Diagram — Teacher with Course Offering and Students

## Purpose

This object diagram shows an example of how a teacher is connected to a course offering and enrolled students. It represents a real situation inside the Teacher module.

## Mermaid Diagram

```mermaid
flowchart TD
    A["Teacher: Instructor<br/>name = Dr. Arben Hoxha<br/>role = instructor"] --> B["Course Offering<br/>course = Software Engineering<br/>semester = Spring<br/>academic_year = 2025-2026"]

    B --> C["Course<br/>title = Software Engineering<br/>credits = 6"]

    B --> D["Student 1<br/>name = Student A<br/>status = enrolled"]
    B --> E["Student 2<br/>name = Student B<br/>status = enrolled"]
    B --> F["Student 3<br/>name = Student C<br/>status = enrolled"]

    B --> G["Weekly Material<br/>week = 3<br/>topic = Frontend Structure"]
    B --> H["Assignment<br/>title = React Components Task"]
    B --> I["Attendance Session<br/>date = class day"]
    B --> J["Grade Records<br/>components = midterm, project, quiz, final"]
```

## Explanation

This diagram shows one teacher assigned to one course offering. The course offering connects the teacher with the course and enrolled students. The same course offering is also connected to materials, assignments, attendance sessions, and grade records.

## Result

This object diagram helps explain how the Teacher module works with real data. It shows that most teacher actions are connected through the selected course offering.
