# UI/UX Design Specification

**Status:** Design direction remains the target. The current interface includes overview, subject list/detail, semester, session, comparison, settings, and report pages plus reusable-structure and entry dialogs. Build succeeds; responsive viewport and assistive-technology review remain incomplete.

## Visual direction

Create a premium, modern dashboard with a dark navy background and purple accents. Use clear typography, readable contrast, restrained visual effects, and generous spacing. Exact colors, typeface, icon set, and motion timing are not yet specified and should be chosen during UI planning.

## Navigation and page layouts

- Persistent desktop sidebar with **Overview**, **My Subjects**, **Semesters**, **Sessions**, **Comparisons**, and **Reports**. Indicate the current page clearly.
- On mobile, provide a compact/collapsible navigation pattern that remains labeled and keyboard operable.
- **Dashboard:** distinguish overall, subject-average, and individual assessment percentages. Include semester summaries, recent results, stronger-performing subjects, subjects that may need attention, recorded improvement/decline, missing results, and upcoming assessments only when dated by the user.
- **My Subjects:** add-subject action, search, subject summaries, and saved assessment history are implemented. Per-subject trend and strength analysis remains planned.
- **Exam setup flow:** reusable structures can be created from the dashboard by selecting a semester and subjects and explicitly entering a maximum per subject. Common-maximum entry and setup from subject/semester pages remain planned. Show the calculated total maximum before save. Never prefill an assumed maximum.
- **Reuse flow:** choosing a saved structure copies subjects and configured maxima into a new session, then requests session-specific date and obtained marks. Edits to the reusable structure do not change previous sessions.
- **Exam results entry:** show each selected subject, its configured maximum, obtained-mark input, and missing state. Show session total maximum and clearly indicate partial/missing results.
- **Subject assessment history:** list exam name/type, date, marks/maxima, and percentage. Subjects and exams may have different structures. Missing marks are distinct from zero.
- **Exam comparison:** show earlier/later context and percentage-point difference. Label improved, declined, or unchanged recorded percentage; differing exam formats do not prove underlying knowledge change.
- **Correcting saved marks:** keep routine result entry simple. On editing an existing result, show the current value and a concise before/after confirmation before saving. Present the current mark separately from an expandable, clearly labeled correction history with previous value, corrected value, and correction date/time. An accidental saved change is reversed by editing again, which adds another history event rather than erasing the first.
- **Semesters:** semester list, subject counts or summaries, and create/rename actions. Explain the impact of deleting a semester containing subjects.
- **Reports:** personal report for a selected semester or academic period, with selected exam sessions, subject/exam details, totals, assessment percentages, subject average percentages, overall/semester percentage, missing results, and configured outcomes. Prevent duplicate inclusion of a result.
- **Forms:** explicit fields for subject, semester, exam name/type, optional date, per-subject maximum, and obtained marks. Present inline validation and explicit save/cancel actions.

## Components and interaction

Use reusable cards, tables/lists, buttons, fields, progress indicators, exam-structure/session forms, result rows, comparison summaries, correction-history view, recommendation callouts, status labels, filters, dialogs, and feedback. Show configured and total maximum marks during setup/entry. Recommendations must be grounded in stored results and configured targets; explain insufficient data or exam-format differences. Destructive actions should state their effect and require confirmation where appropriate.

## Responsive behavior and states

Adapt navigation and dense data layouts for desktop, tablet, and mobile. Avoid requiring horizontal scrolling for core tasks on a phone where practical. Show loading only for a real wait. Provide useful empty states for first use, no semesters/subjects/structures/sessions, no included subjects, missing marks, insufficient comparison data, empty correction history, empty report period, and no search/filter matches. Each state should give a next step. Invalid correction feedback must explain the issue and leave the current saved mark/history intact. Include LocalStorage failure states; never display missing marks as zero. If a maximum is unset, request it explicitly and show no default value.

## Accessibility

- Use semantic landmarks, ordered headings, labeled inputs, and accessible names for icon-only controls.
- Ensure keyboard operation and visible focus for navigation, forms, filters, and dialogs.
- Use text/icons as well as color to communicate pass/fail, errors, and progress.
- Maintain readable contrast, adequate touch targets, and reduced-motion support.
- Associate field errors with inputs and announce important save/error feedback to assistive technology.
- Give progress displays accessible text/value equivalents.
