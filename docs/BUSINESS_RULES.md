# Business and Calculation Rules

**Status:** Planned behavior. The rules below are requirements for the initial application. No assessment weightage, passing threshold, grade scale, or college policy is assumed.

## Semesters, subjects, and historical integrity

- A semester has a stable ID and name. A subject has a stable ID, name, and current semester association.
- A subject may appear in many exam sessions over time. Results refer to stable subject IDs and retain the subject name/context captured when the session was created.
- Editing a subject's name or semester must not rewrite or corrupt historical result records. Existing sessions retain their subject and semester snapshots; current subject details can show the updated name.
- Prefer archiving/inactivating a subject that has historical results over hard deletion. Archived subjects remain available in history but are excluded from new exam structures by default. If the user explicitly deletes historical data, explain the impact and require confirmation; never cascade silently.
- Editing/deleting a semester must likewise preserve the semester context in historical sessions. Behavior for a semester containing active subjects must be explicit (reassign, archive, or cancel); do not orphan records silently.

## Flexible exam structures and sessions

- Assessment type is user-extensible data, not a fixed enum. Examples include Unit Tests, Internal Assessments, Practical Exams, Assignments, Semester Exams, and other user-defined types.
- An **exam structure** is a reusable setup: semester, exam name/type, selected subjects, and an explicitly configured maximum mark for every included subject. Subjects and maxima can differ between structures.
- The user may enter one common maximum during setup and apply it to the selected subjects; the application stores that explicit maximum against each subject configuration. The user may instead set a different maximum for each subject.
- Structure total maximum marks equal the sum of configured maximum marks for its included subjects. A subject may appear only once in a given structure/session; prevent duplicate result counting.
- Never assume a maximum of 100 or any other value. A subject configuration without an explicitly entered maximum is incomplete and cannot be used for results or totals. Maximum marks must be greater than zero.
- An **exam session** is one occurrence created directly or from a saved structure. It has its own ID, semester, exam name/type snapshot, optional date, included subject configurations, and result state for each subject.
- Reusing a saved structure copies its selected subjects and configured maxima into a new session; it must not ask the user to re-enter those maxima. The user enters the new session's date when applicable and obtained marks. The new session starts with no results entered; missing results remain distinct from zero.
- A reused session is an independent historical snapshot. Editing a reusable structure affects future sessions only; it must not silently change prior sessions, maxima, or results. A user-initiated edit to a saved session must clearly indicate its historical impact.
- If the maximum differs by subject, configure each maximum explicitly. Session total maximum is the sum of those values.

## Marks validation and missing results

- Obtained marks and maximum marks must be finite numbers.
- Maximum marks must be greater than zero. Obtained marks must be at least zero and no greater than the configured maximum.
- Invalid entries are rejected with clear field-level feedback and are excluded from calculations.
- A missing result is not zero. In a session, result state must distinguish not entered/missing from entered `0` marks.
- Results with missing marks do not contribute to percentages, subject averages, overall/semester totals, or comparisons. Do not invent missing results.
- Decimal mark support and display precision remain to be selected; preserve calculation precision and do not let display rounding change comparison results.
- Invalid/missing maximum marks prevent result entry and total-maximum calculation for that exam structure/session until configured. No division by zero.

## Calculation rules

For each valid entered result `r`, `obtained(r)` is the obtained mark and `maximum(r)` is the explicitly configured positive maximum. Each stored exam-subject result is counted once.

- **Assessment percentage:** `(obtained(r) / maximum(r)) * 100`.
- **Exam/session total maximum:** sum of configured maximum marks for the distinct subjects included in that session. **Total obtained:** sum of obtained marks for valid entered results in the same selected session. Missing results remain excluded from total obtained and are reported separately; never present a partial obtained total as a complete result without indicating missing entries.
- **Subject average percentage:** simple arithmetic mean of valid assessment percentages for that subject: `sum(assessment percentages) / count(valid results)`. There is no assessment weightage. Missing results are excluded. Show which exams/results are included. If no valid result exists, show unavailable/empty rather than zero.
- **Overall percentage:** `(sum of obtained marks / sum of corresponding maximum marks) * 100` across the selected unique valid results. Clearly state the selected semester/academic period and included exam sessions. Avoid counting any result more than once.
- **Semester-wise percentage:** same aggregate formula, restricted to selected semester and selected unique valid results.
- **Subject average, overall percentage, semester percentage, and individual assessment percentage** are different metrics; label and display them separately. They may have different values.
- Reports should disclose whether results are missing and which result/session records are included, particularly for partial exams or periods.
- Empty selections or zero denominators yield an unavailable state, not a fabricated percentage.

## Recorded marks corrections and audit history

- A valid edit to an already saved result updates the current obtained-mark value and appends a correction event. Never invent a prior value or correction event for an entry that was not previously saved.
- Each event has its own ID and records the result/assessment ID, subject ID, exam-session ID, maximum marks associated with the correction, previous obtained marks, corrected obtained marks, and correction date/time as an ISO 8601 timestamp. The exam/session identity and maximum-mark snapshot remain associated with the result.
- The current result is displayed as the active value. Correction history is separately labeled and may be expanded for review; it must not be confused with the current value.
- Correction events are append-only during normal editing. A later correction appends another event; it does not replace or erase earlier events. Do not silently overwrite correction history.
- Keep routine marks entry simple. For an existing result, show a concise before/after confirmation when saving a correction. An accidental saved edit can be corrected by editing the value back; that reversal is recorded as a new correction event, preserving the original event.
- If corrected input fails validation (non-finite, negative, above maximum, or otherwise invalid), reject the edit, preserve the current saved value and all prior audit events, show a clear validation message, and append no event.
- Do not create an audit event for a new result's first valid entry. Only later edits to a saved result create correction events.
- If a result is archived, retain its correction events with the historical record. Permanently purging a result and its events requires an explicit user action and confirmation; never erase audit entries as a side effect of an ordinary edit.
- Store correction events with the result in LocalStorage. Browser storage is user-editable and can be cleared, corrupted, or removed; this audit history is an application record, not tamper-proof or a secure compliance log.

## Same-subject comparisons and change

- Compare only results for the same subject. Do not present unrelated subjects as a before/after comparison.
- For each selected earlier/later pair, show exam name and date when available, obtained/maximum marks, and percentage for both results.
- When maxima differ, compare percentages; never compare raw marks as if equivalent.
- Compute each percentage from stored obtained and maximum marks without display rounding. Compute **percentage-point difference** from those unrounded percentages: `later percentage - earlier percentage`. Round only the displayed difference to two decimal places. Example: 90% - 100% = -10 percentage points. This is not relative percentage change.
- Classify using exact comparison of the unrounded percentages, with no tolerance: equal means **"No change in recorded percentage."**; later greater means **"Recorded percentage improved."**; later lower means **"Recorded percentage declined."** A difference that only appears equal after display rounding is not unchanged.
- Example: Unit Test 18/20 = 90%; Semester Exam 45/50 = 90%. Result: **"No change in recorded percentage."** Difference: **0.00 percentage points**.
- If either result is missing or invalid, or its maximum is missing/invalid, do not claim improvement, decline, or no change; show **"Insufficient data to compare."**
- Assessment type, exam format, syllabus coverage, and difficulty may differ. The comparison describes recorded percentages only and does not prove a change in underlying knowledge. Show the exam context and a concise limitation where relevant.
- Use dates to establish earlier/later order when available. If dates are absent or ambiguous, require explicit user selection/order; do not invent dates or chronology.

## Performance insights and targets

- Insights may identify lower recorded percentages, improving/declining/unchanged recorded percentages, missing results, recent results, and semester comparisons only from actual stored records.
- “Lower” or “needs attention” must identify the metric and comparison basis. A low mark alone is not evidence of low ability or its cause.
- A below-target insight requires an applicable target explicitly configured by the user. Passing thresholds, grade bands, and performance targets are user-configurable; no default college rule is assumed.
- Broader trend windows and minimum result count are not specified here. Until approved, provide pairwise recorded-percentage comparisons and report insufficient data instead of broader trend claims. This does not alter the exact pairwise comparison rule above.
- Recommendations must be respectful, factual, and traceable to records/settings. Do not invent trends, marks, dates, causes, study behavior, or unsupported advice.
- Upcoming assessments appear only where the user entered a future date.

## Search, filters, persistence, and deletion

- Support search/filter over semesters, subjects, exam sessions, types, dates, and result status where applicable. Clearing filters restores the selected scope.
- Persist semesters, subjects, reusable structures, sessions, subject-maximum snapshots, results, and user settings in browser `localStorage`.
- Load and validate stored data before use. Handle missing, malformed, or unavailable storage with clear feedback; do not silently discard valid history or claim failed writes succeeded.
- Sample data must be distinguishable and removable without deleting user-created data.
- Deleting data affects the local browser dataset. Clearing browser data or using another device/browser may remove or isolate it; backup/sync is not established for the current phase.
