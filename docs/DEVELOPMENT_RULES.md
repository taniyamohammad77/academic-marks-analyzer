# Development rules

1. Keep the app focused on recording exams, entering per-subject obtained marks, viewing history, and comparing subjects across exams.
2. Ask for one shared maximum mark value per new assessment and apply it to every included subject.
3. Prefill known subjects automatically. Increasing the subject count adds new subject rows.
4. Reject negative marks, nonnumeric marks, missing required values, zero maxima, and obtained marks above the maximum.
5. Treat missing legacy marks as missing, not zero.
6. Calculate percentages from saved marks and maxima. Label percentage-divided-by-ten CGPA as an estimate.
7. Keep data browser-local and preserve existing v1 data when migrating.
8. Keep code beginner-friendly and avoid dependencies unless the core workflow needs them.
9. Keep docs aligned with the implemented behavior.
