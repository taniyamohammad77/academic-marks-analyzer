# Development Rules and Constraints

These constraints apply to the project implementation.

1. Build for one person managing their own academic marks and performance. Do not turn the product into a class or multi-student management system.
2. No authentication or multiple student accounts in the current version.
3. The current phase is frontend-only. Do not implement a backend, Express.js server, or MongoDB integration.
4. Use the planned React.js, JavaScript/React Hooks, and CSS direction; avoid unnecessary dependencies and overcomplicated architecture.
5. All presented controls must have working behavior when implemented; avoid dead buttons, forms, calculations, filters, or CRUD actions.
6. Keep code beginner-friendly, maintainable, and suitable for a GitHub repository.
7. Never silently overwrite existing project files. Inspect files first and preserve useful content when updating.
8. Keep documentation aligned with verified implementation. Clearly label planned work and do not claim features or tests are complete without evidence.
9. Passing thresholds and grading rules are configurable; do not encode an invented college policy as a fixed rule.
10. Assessment types are extensible user data; subjects and exams may have different structures.
11. Maximum marks must be explicitly configured for each subject in each exam structure. Never default to 100 or another value. Reuse saved structures without re-entering maxima, and snapshot them so edits do not mutate prior sessions.
12. Preserve history when editing/archiving subjects or structures; prevent silent cascading changes and duplicate result counting.
13. Missing results are not zero. Validate obtained marks against their explicitly configured maximum.
14. There is no assessment weightage: subject average is the simple mean of valid assessment percentages; overall and semester percentages use total obtained divided by corresponding total maximum.
15. Compare the same subject by percentage and percentage-point difference; distinguish percentage points from relative percentage change and do not claim score changes prove knowledge change.
16. Compare unrounded percentages exactly, without a tolerance. Round only displayed percentage-point differences to two decimals. Missing/invalid data cannot produce an improvement or decline claim.
17. Every valid correction to a saved result appends an audit event containing old/new marks, timestamp, result/subject/session identity, and associated maximum marks. Do not create history for unsaved changes or silently erase prior events.
18. Invalid corrections leave the existing result and audit history unchanged. A reversal of a saved correction is a new correction event.
19. LocalStorage is not tamper-proof; do not describe its history as a secure audit log. Do not add backend/authentication for this frontend requirement.
20. Recommendations require actual results and configured targets where relevant. Show insufficient evidence when needed; do not invent causes or outcomes.
21. User authorization determines implementation scope; the current authorized phase is frontend implementation only.
