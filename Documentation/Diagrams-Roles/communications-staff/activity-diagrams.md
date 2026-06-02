# Communications Staff — Activity Diagrams

## A1 — Announcement lifecycle (draft → publish → withdraw)

```mermaid
flowchart TD
    Start([Open Communications hub]) --> Tab[Announcements tab]
    Tab --> New[Click New Announcement]
    New --> Fill[Fill title / body / scope]
    Fill --> Save[POST /communications/announcements<br/>is_published=false]
    Save --> Choice{Publish now or later?}
    Choice -- Schedule --> SetPub[Set publish_at = future]
    SetPub --> Wait[Wait until publish_at]
    Wait --> Visible[Visible to scoped students]
    Choice -- Now --> Publish[POST /publish<br/>flip is_published]
    Publish --> Visible
    Visible --> Need{Need to withdraw?}
    Need -- No --> End1([End])
    Need -- Yes --> Confirm[Confirm withdraw]
    Confirm --> Withdraw[PATCH is_published=false]
    Withdraw --> Audit[Audit log: WITHDRAW_ANNOUNCEMENT]
    Audit --> Hidden[Hidden from /student/news]
    Hidden --> End2([End])
```

## A2 — Event creation and registration management

```mermaid
flowchart TD
    Start([Events tab]) --> NewE[New Event]
    NewE --> EFill[Fill date / location / capacity / window]
    EFill --> ESave[POST /communications/events]
    ESave --> Listed[Listed in student /news]
    Listed --> StudentReg{Student registers?}
    StudentReg -- Yes --> CheckCap{Capacity reached?}
    CheckCap -- Yes --> RejectReg[400 capacity full]
    RejectReg --> StudentReg
    CheckCap -- No --> CheckWindow{Window open?}
    CheckWindow -- No --> RejectWin[400 closed]
    RejectWin --> StudentReg
    CheckWindow -- Yes --> InsertReg[INSERT event_registration]
    InsertReg --> StudentReg
    StudentReg -- No more --> Review[Review registrants]
    Review --> Decide{Cancel / edit?}
    Decide -- Edit --> EFill
    Decide -- Cancel --> Cancel[PATCH event status=cancelled]
    Cancel --> Notify[Notify registrants]
    Notify --> End1([End])
    Decide -- Keep --> Hold[Event runs]
    Hold --> End2([End])
```

## A3 — Club join approval

```mermaid
flowchart TD
    Start([Open Clubs tab]) --> Queue[List pending memberships]
    Queue --> Pick[Pick request]
    Pick --> Review[Review student profile]
    Review --> Decide{Approve?}
    Decide -- Yes --> Approve[PATCH status=active]
    Approve --> Notify[Notification: club joined]
    Notify --> StudentView[Student card flips to Member]
    StudentView --> End1([End])
    Decide -- No --> Reason[Optional reason]
    Reason --> Reject[PATCH status=rejected]
    Reject --> NotifyR[Notification: rejected w/ reason]
    NotifyR --> End2([End])
```

## A4 — Broadcast message

```mermaid
flowchart TD
    Start([Open Inbox, click New Message]) --> Toggle{Toggle Broadcast?}
    Toggle -- No --> Direct[Direct message flow]
    Direct --> End1([End])
    Toggle -- Yes --> Fill[Subject + body]
    Fill --> Send[POST /messages broadcast=true]
    Send --> RoleCheck{"Sender role ∈ academic_staff or system_admin?"}
    RoleCheck -- No --> Err[403 forbidden]
    Err --> End2([End])
    RoleCheck -- Yes --> Store[INSERT message<br/>is_broadcast=true, recipient_id=NULL]
    Store --> Inbox[Visible to all active users<br/>in their inbox with Broadcast badge]
    Inbox --> End3([End])
```
