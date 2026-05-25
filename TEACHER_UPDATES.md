# Teacher Features - Current State & Updates Needed

## Overview

This document outlines the current teacher/instructor features in the Student Information and Course Registration System, and highlights critical updates needed to enhance session management through topic-material-assignment correlation.

---

## Part 1: What is Currently Implemented for Teachers

### ✅ 1. INSTRUCTOR ACCOUNT & COURSE ASSIGNMENT

- Instructor profiles with user accounts
- Assignment to courses via **Offering** system (course + semester)
- Department and title information
- One-to-many relationship with students and courses

**Location:**

- Backend Model: [backend/src/models/instructor.py](backend/src/models/instructor.py)
- Routes: [backend/src/routes/instructors.py](backend/src/routes/instructors.py)

---

### ✅ 2. TIMETABLE & CLASS SESSION MANAGEMENT

Teachers can view and manage their teaching schedule:

#### Features:

- **Weekly Timetable View** - See all scheduled classes by day/week
- **Class Sessions** - Each timetable entry generates class sessions
- **Room & Building Info** - Location details for each session
- **Session Status Tracking** - planned → in_progress → completed
- **Topic Assignment** - Add topic title and description per session

#### Models:

- `TimetableEntry` - Scheduled class blocks
- `ClassSession` - Individual class instances with status and topics

#### Interfaces:

- **InstructorDashboard.tsx** - Weekly timetable with merged consecutive classes
- **TeacherCourseDetailPage.tsx** - Course-specific schedule view

**Locations:**

- Models: [backend/src/models/timetable.py](backend/src/models/timetable.py)
- Routes: [backend/src/routes/offerings.py](backend/src/routes/offerings.py)
- Frontend: [frontend/src/pages/instructor/InstructorDashboard.tsx](frontend/src/pages/instructor/InstructorDashboard.tsx)

---

### ✅ 3. ATTENDANCE & ABSENCE MANAGEMENT

Complete attendance system with absence tracking:

#### Features:

- **Bulk Attendance Marking** - Mark all students in a session at once
- **Individual Record Updates** - Edit attendance for specific students
- **Status Options** - present, absent, late, excused
- **Week-Based Organization** - Attendance tracked by week number
- **Absence Calculation** - Automatic percentage tracking
- **Exam Blocking Policy** - Students with >15% absence cannot take final exam
- **Session Topics** - Topic recorded when creating attendance sessions

#### Models:

- `AttendanceSession` - Session-level attendance tracking
- `AttendanceRecord` - Individual student attendance per session

#### Teacher Routes:

- `GET /teacher/attendance/sessions` - List all sessions for a course
- `GET /teacher/attendance/session/{timetable_entry_id}` - Get session with student list
- `POST /teacher/attendance/session/{timetable_entry_id}/bulk-save` - Save attendance
- `PUT /teacher/attendance/{attendance_id}` - Update individual record

#### Interface:

- **AttendancePage.tsx** - Course/week/session filtering with bulk marking

**Locations:**

- Models: [backend/src/models/attendance.py](backend/src/models/attendance.py)
- Routes: [backend/src/routes/attendance.py](backend/src/routes/attendance.py)
- Frontend: [frontend/src/pages/instructor/AttendancePage.tsx](frontend/src/pages/instructor/AttendancePage.tsx)

---

### ✅ 4. COURSE MATERIALS MANAGEMENT

Comprehensive content delivery system:

#### Features:

- **Multiple Content Types** - Files, links, videos, text content
- **Week-Based Organization** - Materials grouped by week number
- **Publishing Options** - Published, draft, or scheduled content
- **Visibility Control** - Toggle visibility to students
- **File Management** - Upload, store, and track file metadata (size, MIME type)
- **Descriptive Content** - Title, description, classwork/homework descriptions
- **Meta Tracking** - Teacher, course offering, upload timestamps

#### Models:

- `CourseMaterial` - Primary material storage with multiple content types

#### Teacher Routes:

- `GET /teacher/materials` - List materials with filters
- `GET /teacher/materials/{material_id}` - Get single material
- `POST /teacher/materials` - Create new material
- `PUT /teacher/materials/{material_id}` - Update material
- `PATCH /teacher/materials/{material_id}/visibility` - Toggle visibility
- `DELETE /teacher/materials/{material_id}` - Delete material
- `GET /teacher/materials/{material_id}/download` - Download file

#### Interface:

- **WeeklyMaterialsPage.tsx** - Create/edit materials by week with preview

**Locations:**

- Model: [backend/src/models/course_material.py](backend/src/models/course_material.py)
- Routes: [backend/src/routes/materials.py](backend/src/routes/materials.py)
- Frontend: [frontend/src/pages/instructor/WeeklyMaterialsPage.tsx](frontend/src/pages/instructor/WeeklyMaterialsPage.tsx)

---

### ✅ 5. ASSIGNMENTS & SUBMISSION MANAGEMENT

Assignment creation and grading system:

#### Features:

- **Assignment Creation** - Title, description, instructions, attachments
- **Date & Time Control** - Start date, due date, due time
- **Grading** - Maximum points (default 100), score tracking
- **File Attachments** - Attach reference materials to assignments
- **Publishing Control** - Draft or published status
- **Visibility Control** - Show/hide from students
- **Student Submissions** - Text or file uploads
- **Feedback System** - Score and written feedback per submission
- **Submission Tracking** - View submitted vs. missing submissions

#### Models:

- `Assignment` - Assignment metadata
- `AssignmentSubmission` - Student submissions with scores

#### Teacher Routes:

- `GET /teacher/assignments` - List assignments
- `POST /teacher/assignments` - Create assignment
- `PUT /teacher/assignments/{assignment_id}` - Update assignment
- `DELETE /teacher/assignments/{assignment_id}` - Delete assignment
- View and grade submissions

#### Interface:

- **TeacherAssignmentsPage.tsx** - Create, manage, and grade assignments

**Locations:**

- Model: [backend/src/models/course_material.py](backend/src/models/course_material.py)
- Routes: [backend/src/routes/materials.py](backend/src/routes/materials.py)
- Frontend: [frontend/src/pages/instructor/TeacherAssignmentsPage.tsx](frontend/src/pages/instructor/TeacherAssignmentsPage.tsx)

---

### ✅ 6. TOPIC MANAGEMENT (Three-Level Structure)

Teachers can organize content across three topic levels:

#### Level 1: Weekly Topics

- **Model:** `WeeklyTopic`
- **Scope:** Entire week (e.g., "Week 5: Database Design")
- **Info:** Topic title + description
- **Usage:** Overall course planning

#### Level 2: Daily/Scheduled Topics

- **Model:** `CourseWeekTopic`
- **Scope:** Specific date within week
- **Info:** Topic date, day of week, title, description
- **Usage:** More granular planning

#### Level 3: Session Topics

- **Model:** ClassSession fields (`topic_title`, `topic_description`)
- **Scope:** Individual class session
- **Usage:** Session-specific teaching focus

#### Current Routes:

- `GET /teacher/course-offerings/{offering_id}/weeks/{week_number}/topic` - Get week topic
- `POST /teacher/course-offerings/{offering_id}/weeks/{week_number}/topic` - Create week topic
- `PATCH /teacher/sessions/{session_id}/topic` - Update session topic

**Locations:**

- Model: [backend/src/models/course_material.py](backend/src/models/course_material.py)
- Routes: [backend/src/routes/materials.py](backend/src/routes/materials.py)

---

### ✅ 7. GRADES & SCORING

Grade management with absence policy enforcement:

#### Features:

- **Component Scores** - Midterm, project, quiz, final exam
- **Automatic Calculation** - Final grade computed from components
- **Absence Policy** - Blocks final exam if absence > 15%
- **Bulk Entry** - Enter grades for all students in a course
- **Student Filtering** - Search and filter students

#### Interface:

- **GradesManagement.tsx** - Bulk grade entry interface

**Locations:**

- Model: [backend/src/models/grade.py](backend/src/models/grade.py)
- Routes: [backend/src/routes/grades.py](backend/src/routes/grades.py)
- Frontend: [frontend/src/pages/instructor/GradesManagement.tsx](frontend/src/pages/instructor/GradesManagement.tsx)

---

## Part 2: Critical Update Needed ⚠️

### Problem

Currently, when a teacher:

1. **Opens Attendance** - Marks student attendance for a session
2. **Views Materials** - Sees course materials organized by week
3. **Creates Assignments** - Sets up homework/tasks for the week

These three activities are **disconnected**. There's no clear linkage between:

- The **topic** being covered in that specific attendance session
- The **materials** students should use for that topic
- The **assignments** related to that topic

This causes:

- ❌ Lack of coherence in student learning
- ❌ Topics aren't properly documented with materials
- ❌ Assignments don't link to what was actually taught
- ❌ Students don't know what materials to review for an assignment
- ❌ No record of "in this session, we covered X, with materials Y, and assignment Z"

---

### Solution: Session Topic-Material-Assignment Correlation

#### What Needs to be Added:

##### **1. Enhanced Attendance Session Start Flow**

When teacher clicks to start a session in the attendance page:

**Current Flow:**

```
Click Session → View Attendance List → Mark Attendance → Save
```

**New Flow:**

```
Click Session
  ↓
Popup/Modal appears asking:
  • [Existing] Mark Attendance
  • [NEW] Confirm/Add Topic for this session
      - Show week topic (prefilled if exists)
      - Allow teacher to modify topic
      - Allow teacher to add specific session topic (if different from week)
  ↓
Attendance List shown
  ↓
Option to view/link Materials for this topic
  ↓
Option to view/link Assignments for this topic
  ↓
Save Attendance + Topic Correlation
```

##### **2. Backend Changes Needed**

**A. Create Session Topic Correlation Model:**

```python
class SessionTopicCorrelation(Base):
    __tablename__ = "session_topic_correlation"

    id = Column(Integer, primary_key=True)
    class_session_id = Column(Integer, ForeignKey("class_session.id"))
    attendance_session_id = Column(Integer, ForeignKey("attendance_session.id"))

    # Topic information
    topic_title = Column(String)
    topic_description = Column(String)

    # Linked resources
    material_ids = Column(JSON)  # List of CourseMaterial IDs
    assignment_ids = Column(JSON)  # List of Assignment IDs

    teacher_id = Column(Integer, ForeignKey("instructor.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    class_session = relationship("ClassSession")
    attendance_session = relationship("AttendanceSession")
    teacher = relationship("Instructor")
```

**B. New/Updated Routes:**

```
PATCH /teacher/attendance/session/{session_id}/start-with-topic
  Body: {
    topic_title: string,
    topic_description: string,
    material_ids: [int],
    assignment_ids: [int]
  }
  Response: { success, session_id, topic_correlation_id }

GET /teacher/attendance/session/{session_id}/linked-materials
  Response: [CourseMaterial objects]

GET /teacher/attendance/session/{session_id}/linked-assignments
  Response: [Assignment objects]

GET /teacher/course-offerings/{offering_id}/week/{week_number}/materials-assignments
  Response: { materials: [...], assignments: [...] }
  (Useful for populating selection modal)
```

##### **3. Frontend Changes Needed**

**A. Update AttendancePage.tsx:**

```typescript
// When session is clicked to start:
// 1. Show SessionTopicModal before displaying attendance
// 2. Allow topic confirmation/modification
// 3. Show available materials and assignments for selection
// 4. Display linked resources in attendance view

<SessionTopicModal
  session={session}
  weekNumber={week}
  offeringId={offering}
  onSave={(topic, materials, assignments) => handleStartSession()}
/>
```

**B. Create New Component: SessionTopicModal.tsx**

- Display week topic (if exists) as default
- Allow editing topic title/description
- Show list of available materials for that week
- Show list of available assignments for that week
- Multi-select checkboxes for materials & assignments
- Save button that creates correlation record

**C. Display Linked Resources in Attendance View**

- Show which topic is being tracked for this session
- Display linked materials (optional collapsible section)
- Display linked assignments (optional collapsible section)
- Allow quick navigation to full material/assignment details

##### **4. Data Flow Diagram**

```
Teacher starts attendance session
  ↓
SessionTopicModal appears
  ↓
Teacher confirms/edits topic
  ↓
System fetches available materials for that week
  ↓
Teacher selects relevant materials
  ↓
System fetches available assignments for that week
  ↓
Teacher selects relevant assignments
  ↓
Teacher saves → Creates SessionTopicCorrelation record
  ↓
Attendance records linked to this correlation
  ↓
Students can see: "In session X, topics covered were Y with materials Z"
  ↓
Students can see: "Assignment A is related to topic B covered in session X"
```

##### **5. Benefits**

✅ **For Teachers:**

- Clear record of what was taught in each session
- Automatic documentation of session-material-assignment links
- Better organization and planning

✅ **For Students:**

- Know exactly what materials to review for an assignment
- Understand how materials relate to actual classroom teaching
- Clear correlation between attendance, content, and assessments

✅ **For Administrators:**

- Track course coherence
- Audit alignment between teaching and assessment
- Generate reports on topic coverage

---

### Implementation Priority

**Phase 1 - CRITICAL:**

- [ ] Create `SessionTopicCorrelation` model
- [ ] Add database migration
- [ ] Create attendance session start route with topic capture
- [ ] Create SessionTopicModal component
- [ ] Update AttendancePage to use modal

**Phase 2 - HIGH:**

- [ ] Add material linking endpoints
- [ ] Add assignment linking endpoints
- [ ] Display linked resources in attendance view
- [ ] Add quick navigation from materials/assignments to related sessions

**Phase 3 - MEDIUM:**

- [ ] Create reports showing topic-material-assignment alignment
- [ ] Add historical view of past sessions and their correlations
- [ ] Create student-facing view of session topics and materials

**Phase 4 - NICE-TO-HAVE:**

- [ ] Bulk topic assignment for multiple sessions
- [ ] Topic templates by course
- [ ] AI-powered material recommendations based on topics
- [ ] Automated assignment suggestions based on topics

---

## Part 3: File Structure Reference

### Backend Models

- [backend/src/models/instructor.py](backend/src/models/instructor.py) - Instructor profile
- [backend/src/models/timetable.py](backend/src/models/timetable.py) - Timetable & ClassSession
- [backend/src/models/attendance.py](backend/src/models/attendance.py) - Attendance tracking
- [backend/src/models/course_material.py](backend/src/models/course_material.py) - Materials, Assignments, Topics

### Backend Routes

- [backend/src/routes/attendance.py](backend/src/routes/attendance.py) - Attendance endpoints
- [backend/src/routes/materials.py](backend/src/routes/materials.py) - Materials & Topics endpoints
- [backend/src/routes/grades.py](backend/src/routes/grades.py) - Grade management

### Frontend Pages

- [frontend/src/pages/instructor/InstructorDashboard.tsx](frontend/src/pages/instructor/InstructorDashboard.tsx) - Timetable view
- [frontend/src/pages/instructor/AttendancePage.tsx](frontend/src/pages/instructor/AttendancePage.tsx) - **MAIN UPDATE HERE**
- [frontend/src/pages/instructor/WeeklyMaterialsPage.tsx](frontend/src/pages/instructor/WeeklyMaterialsPage.tsx) - Materials management
- [frontend/src/pages/instructor/TeacherAssignmentsPage.tsx](frontend/src/pages/instructor/TeacherAssignmentsPage.tsx) - Assignment management
- [frontend/src/pages/instructor/GradesManagement.tsx](frontend/src/pages/instructor/GradesManagement.tsx) - Grading

---

## Summary Table

| Component                     | Status        | Notes                                        |
| ----------------------------- | ------------- | -------------------------------------------- |
| Instructor Accounts           | ✅ Complete   | Fully functional                             |
| Timetable Management          | ✅ Complete   | Weekly view, session tracking                |
| Attendance Marking            | ✅ Complete   | Bulk & individual, absence tracking          |
| Course Materials              | ✅ Complete   | Multi-format, week-based, publishing         |
| Assignments                   | ✅ Complete   | Creation, submission, grading                |
| Topic Management              | ✅ Partial    | 3 levels exist, but not linked to attendance |
| **Session-Topic Correlation** | ❌ **NEEDED** | **CRITICAL FEATURE**                         |
| Material-Topic Linking        | ✅ Partial    | Materials exist, need linking to sessions    |
| Assignment-Topic Linking      | ✅ Partial    | Assignments exist, need linking to sessions  |
| Grades                        | ✅ Complete   | Component scores, absence blocking           |

---

## Next Steps

1. **Review** this document with development team
2. **Prioritize** Phase 1 implementation
3. **Create** database migration for SessionTopicCorrelation
4. **Develop** backend routes and endpoints
5. **Build** SessionTopicModal component
6. **Integrate** with existing AttendancePage
7. **Test** end-to-end workflow
8. **Gather** teacher feedback and iterate

---

**Last Updated:** May 18, 2026
**Document Purpose:** Guide teacher feature development and track implementation progress
