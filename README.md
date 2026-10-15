# Personal Academic Marks & Performance Analyzer

A browser-based React app for one student to organize semesters, subjects, assessment marks, and personal performance. This is not a class or multi-student management system.

## Current implementation

The early UI includes a dashboard, subject and semester creation/editing, subject assessment history, assessment entry, a scoped report, same-subject result comparisons, optional user-configured percentage targets and grade ranges, browser LocalStorage persistence, saved-mark corrections with visible correction history, and reusable exam structures with explicit per-subject maximum marks. The dashboard ranks subjects by their recorded average, compares those averages with the user's configured target, and shows future exam sessions only when an explicit future date was saved. Reports can be scoped to one semester and include or exclude saved exam sessions. Comparisons use exact recorded percentages and display percentage-point differences to two decimals. Target status and grade labels appear only after valid settings are configured; no threshold or grading scale is assumed. A saved structure can start a session with its maxima snapshotted; marks can be recorded by subject, with blank values preserved as missing. A Sessions page lists attempts and uses the saved subject names and maxima. Assessment records retain subject and semester snapshots, so renaming or moving subjects preserves saved context. Semesters can be renamed without changing their identity. Writes are saved before the UI reports success; malformed saved data is preserved and blocks writes rather than being replaced with an empty dataset. Dialogs support Escape, focus placement, focus trapping, and focus return; keyboard focus is visibly indicated. Each correction records the prior and corrected mark, maximum marks, subject/result identity, and timestamp. LocalStorage can be edited or cleared, so correction history is not tamper-proof.

The product plans also cover broader trend insights, configurable grading criteria, additional validation, and responsive/accessibility review. These remain incomplete until implemented and verified.

## Technology

React, JavaScript, and CSS with Vite. Run `npm install` to install dependencies, `npm run dev` to start the development server, and `npm run build` to create the production bundle in `dist/`.

## Project documentation

See `docs/PRD.md` for product scope, `docs/BUSINESS_RULES.md` for calculation and data rules, `docs/ARCHITECTURE.md` for the proposed system design, and `docs/ROADMAP.md` for planned work.
