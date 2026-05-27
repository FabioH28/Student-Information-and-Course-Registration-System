# Student — Activity Diagrams

All diagrams are rendered with Mermaid and display natively on GitHub.

## A1 — Login + First-time password change

```mermaid
flowchart TD
    Start([Student opens portal]) --> EnterCreds[Enter email + password]
    EnterCreds --> Submit[Submit login]
    Submit --> Validate{Credentials valid?}
    Validate -- No --> Lockout{5+ failed attempts<br/>in 15 min?}
    Lockout -- Yes --> Block[Show lockout message]
    Block --> End1([End])
    Lockout -- No --> EnterCreds
    Validate -- Yes --> First{is_first_login?}
    First -- Yes --> ForcePW[Redirect to<br/>/change-password]
    ForcePW --> NewPW[Enter current + new password]
    NewPW --> Hash[Backend hashes &<br/>clears is_first_login]
    Hash --> Audit[Audit: CHANGE_PASSWORD]
    Audit --> Dash[Redirect to dashboard]
    First -- No --> Dash
    Dash --> End2([End])
```

## A2 — Course registration (selection → approval)

```mermaid
flowchart TD
    Start([Open /student/registration]) --> Load[Load eligible offerings<br/>filtered by program/year/semester]
    Load --> Pick[Student clicks Add on offering]
    Pick --> CheckWin{Selection window<br/>open?}
    CheckWin -- No --> ErrWin[Reject: window closed]
    ErrWin --> End1([End])
    CheckWin -- Yes --> CheckHold{Finance hold?}
    CheckHold -- Yes --> ErrHold[Reject: hold in place]
    ErrHold --> End2([End])
    CheckHold -- No --> CheckPrereq{Prerequisite met?<br/>required only}
    CheckPrereq -- No --> ErrPre[Reject: prereq missing]
    ErrPre --> End3([End])
    CheckPrereq -- Yes --> CheckConflict{Timetable conflict?}
    CheckConflict -- Yes --> ErrConf[Reject: conflict]
    ErrConf --> End4([End])
    CheckConflict -- No --> Insert[INSERT selection<br/>status=requested]
    Insert --> Notify[Notify academic staff]
    Notify --> Pending[Show Pending badge on UI]
    Pending --> StaffReview{Academic staff<br/>approves?}
    StaffReview -- No --> Reject[Update status=rejected,<br/>store reason]
    Reject --> End5([End])
    StaffReview -- Yes --> Approve[Update status=approved]
    Approve --> CreateReg[Create registrations row]
    CreateReg --> Visible[Course appears in<br/>timetable + dashboard]
    Visible --> End6([End])
```

## A3 — Drop course

```mermaid
flowchart TD
    Start([Click Drop on /student/courses]) --> Confirm[Confirmation dialog]
    Confirm --> Cancel{Cancel?}
    Cancel -- Yes --> End1([End])
    Cancel -- No --> Post[POST /registrations/drop]
    Post --> CheckOwner{Registration<br/>belongs to me?}
    CheckOwner -- No --> Err403[403 Forbidden]
    Err403 --> End2([End])
    CheckOwner -- Yes --> CheckDate{Today ≤<br/>drop_deadline?}
    CheckDate -- No --> Err400[400: deadline passed]
    Err400 --> End3([End])
    CheckDate -- Yes --> Update[Update status=dropped]
    Update --> Recalc[Recompute GPA & progression]
    Recalc --> Hide[Remove from timetable view]
    Hide --> End4([End])
```

## A4 — Submit assignment

```mermaid
flowchart TD
    Start([Open /student/assignments]) --> Fetch[GET assignment list]
    Fetch --> Pick[Pick an Open assignment]
    Pick --> Detail[View brief + due date]
    Detail --> Compose[Enter content / attach file]
    Compose --> Validate{Within<br/>start_at..end_at?}
    Validate -- No --> ErrTime[Reject: window closed]
    ErrTime --> End1([End])
    Validate -- Yes --> Submit[POST /api/student/<br/>assignment-submissions]
    Submit --> Store[INSERT submission<br/>is_published=false]
    Store --> Move[Move to Submitted tab]
    Move --> WaitGrade{Instructor<br/>grades + publishes}
    WaitGrade --> ShowGrade[Score + feedback<br/>appear in /student/grades]
    ShowGrade --> End2([End])
```

## A5 — Send direct message

```mermaid
flowchart TD
    Start([Click New Message in Inbox]) --> Load[GET /messages/contacts]
    Load --> Filter[Backend filters contacts:<br/>only instructor + academic_staff<br/>for students]
    Filter --> Pick[Pick recipient + write subject + body]
    Pick --> Send[POST /messages]
    Send --> ValidateRole{Recipient role<br/>allowed?}
    ValidateRole -- No --> Err403[403: students may only<br/>message instructor / academic_staff]
    Err403 --> End1([End])
    ValidateRole -- Yes --> Insert[INSERT message row<br/>recipient_id=recipient]
    Insert --> Sent[Appears in my Sent tab]
    Sent --> Deliver[Appears in recipient's inbox<br/>with Unread badge]
    Deliver --> End2([End])
```

## A6 — View risk warnings

```mermaid
flowchart TD
    Start([Open /student/risk]) --> Compose[Page composes data client-side]
    Compose --> Att[Fetch attendance per course]
    Att --> Grades[Fetch published grades]
    Grades --> Prog[Fetch progression summary]
    Prog --> CalcAtt[For each course:<br/>absence% ≥ 25?]
    CalcAtt -- Yes --> FlagA[Add to Attendance risk]
    CalcAtt -- No --> SkipA[Skip]
    FlagA --> CalcGrade
    SkipA --> CalcGrade
    CalcGrade[For each grade:<br/>score < 60/100?]
    CalcGrade -- Yes --> FlagG[Add to Grades risk]
    CalcGrade -- No --> SkipG[Skip]
    FlagG --> Render
    SkipG --> Render
    Render[Render risk cards] --> End([End])
```
