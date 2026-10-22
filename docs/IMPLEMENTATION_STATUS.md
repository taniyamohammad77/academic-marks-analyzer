# Implementation status

## Current scope

- Assessment entry asks for the exam name/date, subject count, one shared maximum, and obtained marks per subject.
- Subjects recorded in prior exams are prefilled for each new assessment. Increasing the count adds new subject rows.
- History shows per-subject marks, percentages, and estimated CGPA for each exam.
- Subject performance groups matching names across exams and shows the latest percentage-point change.
- Existing v1 LocalStorage records are imported on first save; the original v1 value remains untouched.

## Verification and review

- The production build succeeds.
- Manual browser walkthrough, keyboard/screen-reader checks, and desktop/tablet/phone review remain. See TESTING_PLAN.md.
- CGPA uses percentage divided by ten as a clearly labeled estimate; institutional rules vary.
