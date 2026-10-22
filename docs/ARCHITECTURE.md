# Architecture

## Frontend

The app is a single React view built with Vite. Assessment entry, history, and subject comparisons stay together. Styling uses plain CSS.

## Record shape

Each exam stores an id, name, optional date, and subject rows. Each subject row stores its id, name, obtained marks, and the maximum applied to that assessment.

## Persistence

New data is saved under academic-ledger-exams-v2 in LocalStorage. The previous academic-ledger-v1 value is read for migration and is never overwritten or deleted. Percentages and CGPA estimates are derived from marks.

## Assessment defaults

Known subjects are collected from saved exams by trimmed, case-insensitive name. A new assessment starts with every known subject. Its one maximum mark value is copied to each saved subject result.
