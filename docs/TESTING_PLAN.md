# Testing plan

Run `npm run test:e2e` for automated Chromium checks. Run `npm run test:e2e:headed` to watch them interact with the app. Screenshots are written to `test-results/`.

## Automated checks

- Assessment entry with five subjects, shared maximum, percentages, totals, and CGPA.
- Missing and out-of-range values, including browser native validation for zero maximum and negative marks.
- Carry-forward of saved subjects, adding a subject, and comparing repeated subjects across different maximums.
- Omitted subjects, delete confirmation, updated totals, and persistence after reload.
- Legacy LocalStorage migration and protection of malformed v2 data.
- Keyboard focus, labeled fields, live validation messages, axe WCAG 2.1 A/AA scans, and layout overflow at desktop, tablet, and phone widths.

## Remaining manual checks

These were not verified in the automated run. Resume with this checklist before deployment:

- [ ] **Screen reader:** In Chrome or Edge, use Windows Narrator (or another available screen reader) to navigate the page, open the assessment form, move through its labeled fields, submit valid and invalid data, and confirm that validation errors and the save message are announced.
- [ ] **Physical phone/tablet:** On the target Android and/or iOS devices, review the form, assessment history, comparison cards, and horizontal marks-table scrolling in portrait and landscape. Confirm touch controls and text remain readable.
