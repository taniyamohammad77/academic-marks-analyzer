# Academic Ledger

A small browser-only marks tracker. Create an exam such as Unit 1, enter one shared maximum mark, and record each subject's obtained marks. Subjects saved in earlier exams appear automatically in the next assessment. Increase the subject count to add new subjects.

## Run locally

Run npm install, then npm run dev. Create a production build with npm run build and serve it with npm run preview.

## Calculations

- Subject percentage: obtained marks divided by the assessment's shared maximum, times 100.
- Exam and overall percentage: total obtained marks divided by total maximum marks, times 100.
- CGPA estimate: percentage divided by 10 on a 10-point scale.

CGPA rules vary by institution. This is an estimate, not an official conversion. Each new assessment uses one maximum mark value for all its subjects.

## Data and privacy

Exam records are stored in this browser's LocalStorage. The app has no account, backend, or cloud sync. Existing Academic Ledger v1 records are copied into the new format when the first new assessment is saved; the original v1 data is left intact.

## Status

The production build succeeds. See docs/TESTING_PLAN.md for the hands-on checks still needed.
