# Technical Requirements Document

**Status:** React/Vite scaffold and browser-only frontend are implemented; the production build succeeds. This document describes the broader target architecture, which is only partially implemented.

## Planned frontend

- React.js with JavaScript and React Hooks.
- CSS for styling; the current interface uses a shared stylesheet and React application component.
- Browser `localStorage` for persistence in the current frontend phase.
- Responsive desktop and mobile layouts; include tablet review during design verification.
- No Express.js, Node.js backend, MongoDB, API server, or other backend implementation in this phase.

The repository uses npm with React, React DOM, Vite, and the Vite React plugin. `package-lock.json` records the resolved dependency versions. Keep the dependency set small and update it deliberately.

## Suggested project structure

This is a proposed structure, not a report of existing files:

```text
src/
  app/             application shell and shared state
  components/      reusable UI elements
  features/
    dashboard/
    subjects/
    semesters/
    assessments/
    exam-structures/
    performance/
    reports/
    settings/
  services/        persistence boundary
  utils/           calculations and validation
  styles/          global styles, tokens, responsive rules
  data/            optional sample dataset
```

## Data concepts

The conceptual data model needs semester, subject, reusable exam-structure/template, exam-session, exam-subject configuration, result, and settings records. A structure defines its semester/name/type and selected subject IDs with explicitly configured per-subject maximum marks. A session is a particular occurrence with date and a snapshot of the structure/configuration; each subject result stores obtained marks or a missing state. Reusing a structure copies maxima into a new session; editing the structure later must not mutate existing sessions/results. Exact field names and schema are proposed in `ARCHITECTURE.md`.

## State, data flow, and persistence

UI components should render from application state. Forms validate before invoking state changes. Derived totals, percentages, grades, trends, and recommendations should be calculated from valid result history and settings rather than stored independently in a way that can become stale. Reusable exam-structure, session, result-entry, history, and performance-analysis components should support extensible types. A small persistence service should own `localStorage` parsing, validation, and writes. Component state plus shared context/reducer may be sufficient; a state library is not required.

Planned persistence behavior: load the saved document at startup; validate parsed data before use; write after successful record or settings changes; handle parse, access, and quota errors with visible feedback. A versioned key and migration approach should be chosen if the data shape evolves. Browser storage is local to that browser profile and is not a backup or cross-device sync service.

## Validation and error handling

Validate required subject/semester/session data, selected subject references, explicitly supplied per-subject maxima greater than zero, finite obtained marks in range zero to maximum, and supplied date values. Never auto-fill maximum marks. A missing result is distinct from zero. Validate configured thresholds, grade bands, and targets. Keep invalid records out of calculations. Trend/recommendation logic must compare the same subject using percentages and dates where available, and state insufficient data. Handle empty data, malformed storage, missing references, and unavailable storage without false success or silent deletion.

## Assessment and analysis handling

Model exam types as extensible user data. A reusable structure/template contains exam name/type, semester, subject membership, and an explicit maximum per subject. Allow a common maximum to be entered once and applied to selected subjects, or individual maxima. A new session copies configuration into a historical snapshot, then accepts dates and obtained marks; template changes do not propagate to prior sessions. Never assume 100 or any other maximum. Prevent duplicate inclusion of a result in a report. Analysis follows `BUSINESS_RULES.md`: assessment percentage, simple arithmetic mean of valid assessment percentages for subject average, and total obtained divided by corresponding total maximum for overall/semester percentage. No weightage.

Historical integrity: retain stable subject/result IDs and session snapshots. Prefer archiving a subject that has results over hard deletion; renaming or moving a subject must not rewrite historical session labels/context. Any intentional correction/deletion of a saved result must target that result and clearly communicate the effect. An append-only audit trail for saved-mark corrections is required.

For comparisons, pair only the same subject's valid results. Compare unrounded recorded percentages exactly with no tolerance; classify equal/higher/lower using the specified labels. Calculate percentage-point difference from unrounded values and round only the displayed difference to two decimals. Missing/invalid results cannot produce an improvement/decline claim. Show both exam contexts; do not infer knowledge change from different formats.

## Correction history and LocalStorage limitations

When a previously saved result is validly edited, update the current obtained mark and append an audit event with its own ID containing result/assessment ID, subject ID, exam-session ID, associated maximum marks, previous and corrected values, and correction timestamp (ISO 8601). Keep current result separate from its correction events. An accidental saved edit is corrected by another edit, appended as a new event; do not erase or replace history. Validation failures preserve current data/history and append no event. A new result's first entry is not a correction. Keep normal entry straightforward; an existing-result edit may show a concise before/after confirmation.

Persist current results and correction events in LocalStorage. This provides browser-local persistence only: users or browser tools can modify or clear it, and it is not tamper-proof, encrypted audit storage, or a compliance log. Do not introduce a backend or authentication for this requirement.

## Future backend boundary

Keep presentation, calculation utilities, and persistence responsibilities separate. A future backend repository/API could replace the local persistence adapter while leaving most UI and calculation behavior intact. API contracts, Node.js/Express, MongoDB schema, authentication, migration, deployment, privacy, and security are future planning work, not current dependencies or implementation requirements.
