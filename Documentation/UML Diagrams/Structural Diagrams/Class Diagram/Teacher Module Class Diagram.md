# Class Diagram — Teacher Module Main Classes

## Purpose

This class diagram shows the main data classes related to the Teacher module. It focuses on the relationships between teacher, course offering, students, materials, assignments, attendance, and grades.

## Mermaid Diagram

```mermaid
classDiagram
    class Teacher {
        +int id
        +string name
        +string email
        +string role
        +viewDashboard()
        +viewAssignedCourses()
    }

    class Course {
        +int id
        +string title
        +int credits
    }

    class CourseOffering {
        +int id
        +string semester
        +string academicYear
        +string groupName
        +openCourseDetail()
    }

    class Student {
        +int id
        +string name
        +string email
        +string studyLevel
    }

    class Material {
        +int id
        +string title
        +string type
        +string status
        +uploadMaterial()
    }

    class Assignment {
        +int id
        +string title
        +date dueDate
        +string status
        +createAssignment()
    }

    class AttendanceRecord {
        +int id
        +date attendanceDate
        +string status
        +markAttendance()
    }

    class Grade {
        +int id
        +float midterm
        +float project
        +float quiz
        +float finalExam
        +float total
        +calculateFinalGrade()
    }

    Teacher "1" --> "many" CourseOffering : teaches
    Course "1" --> "many" CourseOffering : has
    CourseOffering "1" --> "many" Student : includes
    CourseOffering "1" --> "many" Material : contains
    CourseOffering "1" --> "many" Assignment : contains
    CourseOffering "1" --> "many" AttendanceRecord : has
    CourseOffering "1" --> "many" Grade : has
    Student "1" --> "many" AttendanceRecord : receives
    Student "1" --> "many" Grade : receives
```

## Explanation

The Teacher class is connected to CourseOffering because teachers teach assigned course offerings. Each course offering belongs to a course and includes enrolled students. Materials, assignments, attendance records, and grades are all connected to the course offering.

## Result

This class diagram helps explain the main structure of the Teacher module and how the academic data is connected.
