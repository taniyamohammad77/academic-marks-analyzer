# Testing plan

Run `npm run test:e2e` for automated Chromium checks. Run `npm run test:e2e:headed` to watch them interact with the app. Screenshots are written to `test-results/`.

## Automated checks

- Assessment entry with five subjects, shared maximum, percentages, totals, and CGPA.
- Missing and out-of-range values, including browser native validation for zero maximum and negative marks.
- Carry-forward of saved subjects, adding a subject, and comparing repeated subjects across different maximums.
- Omitted subjects, delete confirmation, updated totals, and persistence after reload.
- Legacy LocalStorage migration and protection of malformed v2 data.
- Keyboard focus, labeled fields, live validation messages, and layout overflow at desktop, tablet, and phone widths.

## Remaining manual checks

- Check announcements with an actual screen reader.
- Review the app in the target deployment browsers and on physical phones/tablets.
