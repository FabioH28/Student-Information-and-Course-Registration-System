from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import auth, students, courses, offerings, registrations, grades, attendance, finance, notifications, users, semesters

app = FastAPI(
    title="Campus Information System API",
    description="Backend API for the Student Information and Course Registration System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(offerings.router)
app.include_router(registrations.router)
app.include_router(grades.router)
app.include_router(attendance.router)
app.include_router(finance.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(semesters.router)

@app.get("/")
def root():
    return {"message": "CIS API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}
