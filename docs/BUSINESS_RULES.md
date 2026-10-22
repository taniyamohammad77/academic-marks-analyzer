# Calculation rules

- One assessment has one positive maximum mark value, shared by all subjects included in that assessment.
- Subject percentage = obtained marks divided by the assessment maximum, times 100.
- Exam percentage = sum of obtained marks divided by the sum of each subject's corresponding maximum, times 100.
- Overall percentage uses the same aggregate formula across all saved exam results.
- A subject's history matches trimmed names without case sensitivity and compares percentages, not raw marks across different maxima.
- CGPA estimate = percentage divided by 10. Display it on a 10-point scale and label it as an estimate.
- Obtained marks must be finite and between zero and the positive maximum, inclusive.
- Missing historical marks remain missing and are excluded from calculations, never treated as zero.
- All records stay in browser LocalStorage. Existing v1 storage is preserved during migration.
