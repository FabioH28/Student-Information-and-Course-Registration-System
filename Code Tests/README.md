# Code Tests

This folder contains the project's automated code tests.

## Frontend tests

Run from the project root:

```powershell
npm ci
npm run test
```

## Backend tests

Run from the project root:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
backend\.venv\Scripts\python.exe -m pytest "Code Tests/backend"
```
