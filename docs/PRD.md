# Product Requirements Document

**Status:** These requirements describe the product target. A partial frontend is implemented and its production build succeeds; many planned capabilities are not yet implemented or behavior-verified.

## Purpose and problem

The Personal Academic Marks & Performance Analyzer is intended to give one student a clear place to record and review their own subjects, assessments, marks, and semesters. It should help the student understand subject-level strengths, areas needing attention, and changes over time—not only calculate totals. The application organizes entered records and derives transparent, evidence-based summaries.

## Target user and scope

The target user is one student managing their own academic marks. The current planned product is personal-use and frontend-only. It does not manage a class or multiple students. Authentication, accounts, backend services, and database storage are not part of the current phase.

## Goals

1. Record multiple flexible assessments for each subject and assign subjects to semesters.
2. Make subject, semester, and assessment records manageable and searchable.
3. Explain subject performance, historical changes, and semester/overall summaries.
4. Provide recommendations only when supported by entered marks, dates, and configured targets.
5. Support student-configurable passing and grading rules without assuming institutional policy.
6. Retain assessment history in the same browser using `localStorage`.
7. Present the information in a readable, responsive dashboard and report.

## Planned functional requirements

- Show a dashboard with overall and semester summaries, subject averages/comparisons, recent exam results, stronger subjects, subjects needing attention, recorded improvement/decline, missing results, and upcoming exams only when user-entered dates are available.
- Add, edit, archive/delete subjects with subject name and semester; marks belong to exam-subject results. Preserve subject identity and historical result references when names or active status change.
- Record multiple assessments per subject. Assessment type/name is user-extensible; examples include Unit Tests, Internal Assessments, Practical Exams, Assignments, Semester Exams, and user-defined types. Subjects need not share the same assessment structure.
- Record assessment date when known, obtained marks, and maximum marks. Support a planned assessment with no result yet so missing marks are distinct from zero.
- Create reusable exam structures: select a semester and extensible exam name/type (e.g. Unit Test 1), choose included subjects, and explicitly configure each subject's maximum marks. A common maximum may be entered once and applied to the selected subjects; different maxima may be set per subject. Calculate total maximum from the configured subject maxima.
- Reuse a saved structure for a new exam session with its configured maxima prefilled; request only new session information/results. Do not assume 100 or any other maximum. Snapshot the structure into each session so later template edits cannot alter history.
- Create exam sessions that contain their own semester, name/type, date when known, subject configurations, explicit maximum marks, and result state/obtained marks.
- Enter or edit obtained marks per included subject; preserve missing as distinct from zero.
- Organize subjects by semesters; manage semesters and view semester summaries.
- Calculate totals and percentages from valid marks and provide an average with a clearly stated definition.
- Identify highest-performing subjects using a clearly stated comparison metric.
- Show assessment-wise marks and percentages, subject-wise performance, and overall/semester comparisons with the metric and scope identified.
- Provide subject detail views with assessment history and per-exam comparisons.
- Preserve historical assessment records so new results do not overwrite earlier results; support same-subject and cross-semester comparisons.
- When editing a saved result, preserve append-only correction history with previous/corrected marks, correction timestamp, result/subject/session identity, and associated maximum marks. Show current marks separately from correction history.
- Analyze previous versus recent performance, trends, strengths, and improvement areas only when dated data is sufficient and comparisons are meaningful.
- Provide evidence-based recommendations using only actual marks, dates, assessment context, and configured targets. Never invent marks, results, or trends.
- Show assessments with missing marks and upcoming assessments only when dates were entered.
- Allow passing criteria and grade rules to be configured by the user.
- Search and filter subjects and semesters.
- Show a personal academic report card/performance report.
- Generate a personal report scoped to a selected semester or academic period; allow selection of included exam sessions to prevent duplicate counting.
- Persist records and settings in browser `localStorage`.
- Provide sample data for testing and a clear means to remove sample data.
- Adapt to desktop and mobile layouts, with appropriate loading and empty states.

## Non-functional requirements

- Responsive desktop and mobile presentation; tablet behavior should be considered during design and verification.
- Clear typography, readable contrast, keyboard-operable controls, and labeled forms.
- Calculations must be reproducible from valid input records.
- Errors in input or browser storage must not be presented as successful saves.
- Keep the planned solution maintainable and proportionate to a personal frontend application.

## User stories

- As a student, I can add a subject and its marks to a semester so I can keep my academic record organized.
- I can correct or remove a subject so the record stays current.
- I can view totals, percentages, averages, and highest-performing subjects so I can understand performance.
- I can configure passing and grading rules so displayed outcomes reflect my chosen criteria.
- I can filter/search subjects and review a semester report so I can find relevant results quickly.
- I can return to the app in the same browser and find my saved records.
- I can load and remove sample data to explore the planned experience.

## Acceptance criteria for the planned MVP

1. Subjects can have different numbers and kinds of assessments; new user-defined types are not blocked by a fixed type list.
2. Assessment results retain their own identity, subject, type/name, date when known, obtained marks, and maximum marks. Adding a later result does not replace an earlier one.
3. Required fields and marks constraints are validated; missing result data is not represented as zero.
4. Assessment percentage, simple arithmetic mean of valid subject assessment percentages, and overall/semester aggregate percentages follow `BUSINESS_RULES.md` and are labeled distinctly; empty/zero-denominator results are not misleading.
5. Historical comparisons use percentages when maxima differ and disclose assessment-type differences; raw marks are not compared across different maxima.
6. Trend and recommendation output is traceable to entered results and configured targets. Same-subject comparisons use exact unrounded percentage comparison, with no tolerance; display percentage-point change rounded to two decimals. Missing/invalid results produce an insufficient-data state, and different exam formats are not treated as proof of underlying knowledge change.
7. Passing and grade outcomes are shown only when the relevant user configuration is valid.
8. Semester views and search/filter results include only matching records and can return to the unfiltered view.
9. Reloading the same browser restores assessment history and settings.
10. Exam structures can be reused without re-entering maxima; template edits do not mutate existing session snapshots/results.
11. No maximum is assumed or filled automatically; an incomplete maximum configuration blocks result entry and calculation.
12. Editing or archiving a subject preserves historical exam/session context; result/session corrections affect only the explicitly selected record.
13. Reports for selected semesters/periods include only selected unique results and prevent duplicate counting.
14. Empty, missing-mark, no-results, loading (where applicable), validation, and storage-error states communicate what happened and a useful next step.
15. Sample-data removal preserves non-sample records.
16. Core flows remain usable on desktop and mobile and with keyboard navigation.
17. Valid corrections append an audit event with prior and corrected values, result/subject/session IDs, associated maximum, and timestamp; invalid edits preserve the current value and history, and a reversal is recorded as another event.
18. LocalStorage correction history is accurately described as browser-local and not tamper-proof.

## MVP boundary and later possibilities

The MVP is the planned personal frontend: dashboard, subject/semester management, reusable exam structures and sessions, historical results, calculations, configurable criteria/targets, same-subject comparisons and evidence-based insights, search/filter, selected-period report, local persistence, sample data, and responsive states. There is no assessment weightage. Subject average is the simple arithmetic mean of that subject's valid assessment percentages; overall/semester percentage is total obtained divided by total corresponding maximum. Exact comparison and two-decimal display rules are defined in `BUSINESS_RULES.md`. Backend integration is later work requiring separate approval. No import/export, cloud sync, authentication, institutional integration, or official transcript behavior is established.
