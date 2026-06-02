# Instructor — Activity Diagrams

## A1 — Weekly course setup (topic + material + assignment)

```mermaid
flowchart TD
    Start([Open course detail page]) --> Pick[Pick week tab]
    Pick --> Topic{Set / edit topic?}
    Topic -- Yes --> SetT[POST topic title + description]
    SetT --> Material
    Topic -- No --> Material
    Material{Add material?}
    Material -- Yes --> Upload[Upload file / link / text]
    Upload --> Scheduled{Scheduled<br/>publish?}
    Scheduled -- Yes --> SetPub[Set publish_at,<br/>status=scheduled]
    Scheduled -- No --> Publish[status=published]
    SetPub --> AssignBlock
    Publish --> AssignBlock
    Material -- No --> AssignBlock
    AssignBlock{Create assignment?}
    AssignBlock -- No --> End([End])
    AssignBlock -- Yes --> Sessions[GET sessions list<br/>filtered by week]
    Sessions --> PickSession[Pick class_session matching<br/>week_number]
    PickSession --> SubmitA[POST assignment<br/>+ class_session_id]
    SubmitA --> Validate{Session.week_id ==<br/>form.week_number?}
    Validate -- No --> Err[Reject 400]
    Err --> End
    Validate -- Yes --> Stored[INSERT assignment]
    Stored --> End
```

## A2 — Attendance marking (with date lock)

```mermaid
flowchart TD
    Start([Open /instructor/attendance]) --> PickCourse[Pick course offering]
    PickCourse --> ListSession[List sessions]
    ListSession --> PickSession[Pick session]
    PickSession --> CheckDate{Session date<br/>== today?}
    CheckDate -- No --> Locked[Show date-lock warning]
    Locked --> Recovery{Create fresh<br/>today-session?}
    Recovery -- No --> End1([End])
    Recovery -- Yes --> NewSession["POST /attendance/offering/{id}/sessions<br/>session_date=today"]
    NewSession --> ListSession
    CheckDate -- Yes --> Roster[Load roster]
    Roster --> Mark[Mark each student<br/>Present/Absent/Late]
    Mark --> Save["POST /attendance/sessions/{sid}/records"]
    Save --> Recalc[Backend recomputes<br/>absence percentage]
    Recalc --> RiskFlag{Any student<br/>≥ 25% absence?}
    RiskFlag -- Yes --> Trigger[Risk surfaces in<br/>student /risk page]
    RiskFlag -- No --> Done
    Trigger --> Done[Done]
    Done --> End2([End])
```

## A3 — Grade workflow (config → entry → publish)

```mermaid
flowchart TD
    Start([Open /instructor/grades]) --> PickC[Pick offering]
    PickC --> CheckConfig{Grade config<br/>exists?}
    CheckConfig -- No --> AutoCreate[Auto-create<br/>default config]
    AutoCreate --> ShowConfig
    CheckConfig -- Yes --> ShowConfig[Show current weights]
    ShowConfig --> EditWeights{Edit weights?}
    EditWeights -- Yes --> SaveW[PUT /grades/config]
    SaveW --> ValidateSum{Sum == 100?}
    ValidateSum -- No --> ErrSum[Reject]
    ErrSum --> ShowConfig
    ValidateSum -- Yes --> Roster
    EditWeights -- No --> Roster[Show roster]
    Roster --> Entry[Enter component scores<br/>per registration]
    Entry --> Save["PUT /grades/offering/{o}/registration/{r}"]
    Save --> More{More to grade?}
    More -- Yes --> Entry
    More -- No --> Review[Review summary]
    Review --> Publish{Publish?}
    Publish -- No --> End1([Draft saved])
    Publish -- Yes --> Confirm[Confirm dialog]
    Confirm --> Post[POST /grades/publish<br/>registration_ids]
    Post --> Flip[UPDATE grades SET<br/>is_published=true]
    Flip --> Visible[Students see scores<br/>at /student/grades]
    Visible --> End2([End])
```

## A4 — Reply to message

```mermaid
flowchart TD
    Start([Open /instructor/inbox]) --> Fetch[GET /messages/inbox]
    Fetch --> Unread{Unread messages?}
    Unread -- No --> Empty[Empty state]
    Empty --> End1([End])
    Unread -- Yes --> Pick[Click message]
    Pick --> Mark["PUT /messages/{id}/read"]
    Mark --> Reply{Reply?}
    Reply -- No --> End2([End])
    Reply -- Yes --> Compose[Compose with pre-filled<br/>recipient + Re: subject]
    Compose --> Send[POST /messages with parent_id]
    Send --> Sent[Appears in Sent tab]
    Sent --> Inbox[Recipient sees<br/>in their inbox]
    Inbox --> End3([End])
```
