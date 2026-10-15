# Testing Plan

**Status:** Planned test coverage. The production build succeeds; the behavior and acceptance checks below have not yet been run or verified.

## Functional and calculation cases

- Add valid subjects with one and multiple semesters; confirm records appear in the correct views.
- Verify assessment percentage as obtained / explicitly configured maximum * 100 (e.g. 18/20 = 90%).
- Verify subject average is the simple arithmetic mean of that subject's valid assessment percentages, with missing results excluded (e.g. 80%, 90%, 100% = 90%).
- Verify overall and semester percentage as sum of obtained marks / sum of corresponding maxima * 100 over the selected unique valid results.
- Verify session total maximum is the sum of configured maxima for included subjects and total obtained includes entered valid results only; make partial/missing results visible.
- Use different maxima for subjects and sessions; confirm no maximum is auto-filled and raw marks with different maxima are not compared directly.
- Verify semester summaries and reports include only selected semester/period/session results.
- Verify configured pass threshold equality and values above/below it; verify unconfigured behavior.
- Verify grade-band boundaries and rejection/handling of invalid, overlapping, or incomplete configuration according to the agreed rules.
- Verify assessment, subject, overall, and semester percentages are separately calculated and labeled; missing results are excluded rather than counted as zero.
- Give different subjects different assessment types/counts and verify no fixed pattern/type list blocks entry.
- Add a later assessment and verify earlier records remain unchanged; compare same-subject assessments with unequal maxima using percentages.
- Compare different assessment types and verify context is visible and unsupported equivalence/trend is not asserted.
- Verify previous/recent selection uses entered dates; missing, tied, or insufficient dates/history yield an insufficient-evidence state.
- Verify improving/declining/stable classifications only occur when the approved history minimum and thresholds are met.
- Verify recommendations use only entered results/dates and configured targets; absent target/evidence yields no unsupported target recommendation.
- Verify cross-semester comparisons identify scope and use percentages when maxima differ, not raw marks.
- Verify upcoming assessment display depends on an entered future date.
- Set up a six-subject exam structure with a common maximum of 20; confirm each subject receives 20 and total maximum is 120.
- Set up an exam structure with different per-subject maxima; confirm the saved total maximum is their sum.
- Reuse a saved structure; confirm subject membership and maxima are prepopulated and only new result/date information is requested.
- Edit a reusable structure after a session exists; verify the existing session snapshot, maxima, and results do not change.
- Attempt to save a structure with an unset, zero, or negative maximum; confirm save/result entry is blocked with a clear message. Confirm no default maximum such as 100 appears.
- Confirm duplicate subject inclusion or duplicate result selection cannot inflate exam or report totals.
- Compare Java 20/20 with 45/50; verify 100%, 90%, and a decline of 10 percentage points despite the higher raw marks. Verify positive, negative, and zero point differences and that point change is not labeled relative percent change.
- Compare Unit Test 18/20 and Semester Exam 45/50 for the same subject; verify both are 90%, status is exactly "No change in recorded percentage.", and displayed difference is 0.00 percentage points.
- Verify exact unrounded equality determines no change with no tolerance; values that display identically after rounding but differ internally must classify as improved or declined by their actual order.
- Verify percentage-point difference is calculated before display rounding and only the displayed difference is rounded to two decimal places; test positive and negative differences with more than two decimal places.
- Verify a missing or invalid earlier/later result or maximum yields "Insufficient data to compare" and never an improvement, decline, or no-change claim.
- Compare only the same subject; verify comparisons across different exam formats describe recorded percentages and do not claim underlying knowledge change.

## Forms, CRUD, and filters

- Submit empty required fields and confirm save is blocked with clear errors.
- Reject nonnumeric, non-finite, negative, over-maximum, and zero/negative maximum marks.
- Edit a subject and confirm the existing record changes without duplication or historical session/name-context corruption.
- Edit a previously saved mark validly; verify current value updates and one audit event records result/subject/session IDs, associated maximum, previous/corrected marks, and ISO 8601 correction time.
- Verify first-time entry of a result creates no correction event and no historical correction is fabricated for edits made before saving.
- Change a new result in the form before its first save; verify no correction event is created for either unsaved value.
- Correct a mark accidentally saved; verify the reversal appends another event and the original correction event remains visible.
- Submit an invalid correction (negative, non-finite, or over maximum); verify current value and correction history remain unchanged, a validation message appears, and no event is appended.
- Verify current mark is clearly separated from the audit history and normal first-time entry does not require audit-specific steps.
- Simulate LocalStorage write failure during a correction; verify the UI does not claim success or replace the persisted current result without its matching audit event.
- Cancel an edit and confirm saved data remains unchanged.
- Archive/delete a subject with historical results; confirm history remains intact and subject is excluded from new exam setup unless explicitly restored. Confirm intentional purge requires clear confirmation.
- Create/rename semesters; test the approved behavior for deleting a semester containing subjects.
- Search and combine/clear semester and result filters; verify empty search results and restoration of the full list.

## Persistence and edge cases

- Save subjects, semesters, structures, sessions, subject maximum snapshots, results, and settings; reload in the same browser and verify history and dates are restored.
- Reload after multiple corrections; verify current marks and the full ordered correction history persist without an event being overwritten.
- Verify UI/documentation describes LocalStorage correction history as editable/clearable and not tamper-proof; no backend or authentication is required for it.
- Test missing storage, malformed JSON, invalid stored shapes, missing semester references, and storage write/quota errors; no false save success or silent data loss.
- Verify no-subject, no-semester, no-assessment, missing-mark, insufficient-history, empty-semester, and zero-denominator views are clear and do not display misleading grades, percentages, or trend conclusions.
- Load sample data and remove it; confirm user-created records remain.
- Confirm configured rule changes recalculate results without changing entered marks.

## Responsive, accessibility, and acceptance checks

- Review dashboard, navigation, forms, lists/tables, and report at desktop, tablet, and mobile viewport sizes.
- Verify keyboard navigation, visible focus, labels, error associations, dialog operation, status announcements, contrast, and reduced-motion behavior.
- Confirm loading indicators appear only for actual wait states and all empty/error states suggest a useful next step.
- Run the acceptance criteria in `PRD.md` against the implemented MVP and record actual results before marking any feature complete.
