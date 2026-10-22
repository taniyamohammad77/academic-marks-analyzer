# Product requirements

## Purpose

Give one student a quick way to record exam marks and compare performance across exams, especially by subject.

## Core workflow

1. Create an assessment with a name and optional date.
2. Enter the number of subjects. Subjects used in earlier exams are prefilled automatically.
3. Enter one maximum mark value for the whole assessment.
4. Enter obtained marks for each subject. Add new subjects by increasing the count.
5. Review exam and subject percentages, CGPA estimates, and subject performance across exams.

## Requirements

- Support between 1 and 100 subjects in an assessment.
- Require a subject name and valid obtained marks for every included subject.
- Require one positive maximum mark for each assessment; apply it to every subject in that assessment.
- Reject negative marks and marks above the shared maximum.
- Calculate subject, exam, and overall percentages from explicit marks and maxima.
- Compare repeated subjects using percentages, even if historical maxima differ.
- Show CGPA as a percentage divided by 10 on a 10-point scale, labeled as an estimate.
- Save records in LocalStorage and retain them after reload.
- Keep the product to assessment entry, history, and subject comparison. Do not require semesters, reusable structures, grading settings, accounts, or a backend.
- Preserve v1 LocalStorage records and import them without overwriting the original value.

## Out of scope

Authentication, cloud sync, official institutional CGPA conversion, grade bands, teacher/class management, and server storage.
