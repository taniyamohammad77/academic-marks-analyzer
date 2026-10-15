# Development Roadmap

**Status:** Frontend implementation has started. The application includes subject/semester/assessment flows, scoped reports, same-subject comparisons, validated LocalStorage loading and writes, correction history, reusable structures, session entry and history, target-based summaries, ranked subject averages, future dated-session summaries, semester renaming, and historical semester snapshots for new standalone results. The current production build succeeds; behavior verification remains outstanding.

1. **Requirements and documentation** â€” review scope, reusable exam structures/sessions, historical integrity, exact calculation rules, and remaining trend/rounding semantics.
2. **UI/UX planning** â€” define dashboard, subject detail/history, exam setup/result entry, comparison, selected-period report, responsive behavior, and empty/validation states.
3. **React project setup** — React/Vite scripts and dependencies are installed; the production build completes successfully.
4. **Component and page development** - session entry/history, subject assessment history, pairwise comparison, settings, and semester/session-scoped reports are implemented.
5. **Calculation logic and validation** - core calculations, exact pairwise comparisons, personal targets, and user-defined non-overlapping grade ranges are implemented; behavior verification and broader edge-case review remain.
6. **LocalStorage integration** — malformed data is preserved and blocks writes; valid edits are persisted before success is shown. Deeper stored-record validation and broader failure handling remain to be verified. LocalStorage is not tamper-proof.
7. **Testing and bug fixing** â€” verify formulas, structure reuse, snapshot integrity, correction audit behavior, exact comparisons/rounding, result CRUD, filters, persistence, and edge cases against `TESTING_PLAN.md`.
8. **Responsive design and accessibility** — added mobile dialog scrolling, visible keyboard focus, named search, current-page navigation state, and dialog Escape/focus management; viewport and assistive-technology review remains outstanding.
9. **README and GitHub preparation** — README, UI/UX, TRD, PRD, and testing-plan status now reflect the partial implementation and unverified work; repository publication prep remains.
10. **Future MERN Stack integration** â€” separately specify and approve API, database, authentication, migration, security, and deployment work.

Backend integration remains out of scope for the current frontend work.

### Current build step

Dashboard and history phase: subject averages are ranked, comparisons use configured personal targets, future summaries use explicit future dates, and new standalone results retain their semester context if a subject moves later. Broader trend windows and recommendation criteria still need product rules before implementation.
