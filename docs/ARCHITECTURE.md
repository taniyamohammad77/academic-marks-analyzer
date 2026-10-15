# System Architecture

**Status:** Proposed frontend architecture; an early React application exists, and several planned capabilities remain unimplemented.

## Overview

The planned system is a browser-only React application. It separates the user interface, application state/actions, pure domain calculations and validation, and a browser-storage adapter. This keeps the first version small and provides a boundary for possible future backend integration.

## Conceptual data model

```text
Semester
  id
  name

Subject
  id
  name
  semesterId

ExamStructure (reusable template)
  id
  semesterId
  examName
  assessmentType (extensible user-defined value)
  subjectConfigurations[] (subjectId, explicitly configured maximumMarks)

ExamSession (one occurrence, with structure snapshot)
  id
  structureId (optional source template)
  semesterId
  examNameSnapshot
  assessmentTypeSnapshot
  examDate (optional)
  subjectConfigurations[] (subjectId, subjectNameSnapshot, maximumMarksSnapshot)
  results[] (resultId, subjectId, currentObtainedMarks or missing result state,
            correctionHistory[])
  semesterNameSnapshot

CorrectionEvent (append-only child of a saved result)
  correctionEventId
  resultId
  subjectId
  examSessionId
  maximumMarksAtCorrection
  previousObtainedMarks
  correctedObtainedMarks
  correctedAt (ISO 8601 date/time)

Settings
  passingRule (user-configured; shape to be decided)
  gradeBands (user-configured; shape to be decided)
  performanceTargets (optional user-configured targets)
```

The conceptual model separates reusable setup from a historical occurrence. A structure stores chosen subjects and explicit maximum marks once. Reusing it creates a session with copied configuration; results are attached to that session. Each session is a snapshot, so future structure edits cannot change prior maxima or results. No maximum is assumed. Assessment type is user-extensible. A missing result is distinct from zero. Stable IDs and name/context snapshots allow subject rename/archive without silently rewriting historical reports. A valid correction updates the current result and appends an event containing previous/corrected values, timestamp, result/subject/session IDs, and associated maximum marks. Events are append-only during ordinary use. Exact schema and sample markers remain implementation choices.

## Suggested component hierarchy and responsibilities

```text
App
  AppShell
    SidebarNavigation / MobileNavigation
    MainContent
      DashboardPage
        PerformanceSummary
        HighestPerformers
        RecentProgress / SubjectsNeedingAttention
      MySubjectsPage
        SearchAndFilters
        SubjectList
        SubjectForm
        SubjectPerformanceDetail
          AssessmentHistory
          ExamComparison
          TrendAndInsights
      ExamSetupFlow
        ExamStructureSelector
        ExamStructureEditor
        ExamSessionCreator
        SessionResultsEntry
      SemestersPage
        SemesterList
        SemesterForm
      ReportsPage
        PerformanceReport
    SettingsForm
    ConfirmDialog / FeedbackMessage / EmptyState
    SharedState / PersistenceAdapter
```

- **App/AppShell:** initialize application data and render navigation, selected page, and shared feedback.
- **DashboardPage:** display overall/subject comparisons, assessment results, subjects needing attention or improving, recent progress, and dated upcoming assessments when available.
- **MySubjectsPage:** list, search, filter, and launch subject and assessment flows.
- **SubjectPerformanceDetail:** show assessment history, marks/percentages, missing results, comparisons, and evidence-qualified insights.
- **ExamSetupFlow:** make exam creation available from dashboard or subject/semester workflows, consistent with the four-item sidebar.
- **ExamStructureEditor:** select semester/type/name and subjects, set a common maximum once or configure per-subject maxima, calculate total maximum, and save/reuse a structure.
- **ExamSessionCreator/SessionResultsEntry:** copy a structure into a historical session snapshot, collect date and obtained marks, and preserve missing results. Reusing configured maxima requests only new result data.
- **AssessmentHistory/ExamComparison:** browse distinct historical sessions and compare a subject's percentages and percentage-point change.
- **CorrectionHistory:** show current marks separately from audit events and display each correction's old/new value and timestamp.
- **SubjectForm:** collect subject and semester; marks belong to assessment records rather than directly to the subject.
- **Subject lifecycle:** archive subjects with historical results by default; stable IDs and session snapshots preserve past context. Do not silently cascade subject edits/deletes into saved sessions.
- **SemestersPage:** manage semesters and present semester-level summaries.
- **ReportsPage:** present a personal academic performance report, optionally scoped to semester.
- **SettingsForm:** collect configurable passing and grading rules.
- **Calculation and analysis utilities:** pure functions for assessment percentage, simple arithmetic mean subject percentage, overall/semester aggregate percentages, percentage-point comparison, configurable pass/grade, and evidence-qualified insights, following `BUSINESS_RULES.md`.
- **Persistence adapter:** load, validate, and save data to `localStorage`; surface storage failures.

## Data flow

1. At startup, persistence adapter reads and validates the stored application document.
2. Valid data enters shared application state; missing data initializes an empty first-use state.
3. Forms collect input and validate it before dispatching a create/update action.
4. Successful subject, structure, session/result, or settings changes trigger derived calculations/analysis and a persistence write. Editing a reusable structure only affects future sessions. A valid correction appends an event; invalid edits preserve current data/history.
5. Pages render current records and derived results; transient search/filter/form state may remain local to the relevant page.
6. Errors from validation or storage are surfaced to the user and are not represented as successful saves.

Performance analysis should receive selected session results and configuration, and return insights with an explicit sufficiency status. Same-subject comparisons use percentages and percentage points, not raw marks across differing maxima. Do not infer a trend when history is inadequate. Keep recommendations derived rather than persisted so they update when marks or targets change.

For this scope, React Hooks with local state and, if shared state warrants it, Context plus `useReducer` are sufficient candidates. A routing or state-management dependency is not yet selected.

## Persistence and future boundary

Use a single persistence module/service as the boundary around `localStorage`; components should not read and write storage independently. Store semesters, subjects, reusable structures, session snapshots, per-subject maxima, current results, append-only correction events, and settings in a validated document. Load at startup and save after successful changes, with graceful handling for malformed JSON, unavailable storage, and quota errors. Treat a correction plus its event as one state change: do not report success or replace the current value if the corresponding document write fails. Archiving a result retains its correction events; permanently purging a result and its history requires an explicit user action and confirmation. LocalStorage is user-editable and clearable; this history is not tamper-proof. Prevent duplicate result inclusion; do not maintain derived totals as independent persisted facts unless a future design proves a need.

A later backend could implement the same repository boundary with API calls. Backend endpoints, database model, authentication, migration, security, and deployment are out of current scope and must be specified separately before that phase.

## Proposed source layout

```text
src/
  app/
  components/
  features/dashboard/
  features/subjects/
  features/semesters/
  features/exams/
  features/performance/
  features/reports/
  features/settings/
  services/
  utils/
  styles/
  data/
```

This layout is guidance for a future implementation, not an existing project tree.
