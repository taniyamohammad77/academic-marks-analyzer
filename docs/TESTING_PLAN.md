# Testing plan

The production build succeeds. Perform these hands-on checks before release.

## Assessment entry and calculations

- Create Unit 1 with five subjects and one shared maximum value.
- Confirm all five rows use that maximum and each subject percentage is calculated correctly.
- Confirm exam total, overall percentage, and CGPA estimate (percentage divided by 10).
- Reject missing subject names/marks, missing or nonpositive maximums, negative marks, and marks above the shared maximum.
- Create Unit 2. Confirm all previously saved subjects appear automatically.
- Increase the subject count and add a new subject. Confirm it appears by default in the next assessment.

## History and comparison

- Confirm exam history shows each subject's marks, percentage, and CGPA.
- Confirm repeated subjects compare by percentage across exams.
- Confirm different historical maximums do not cause raw marks to be compared.
- Confirm a subject not included in an exam is not shown as zero for that exam.
- Delete an exam and confirm the confirmation step and updated totals.
- Reload and confirm saved exams remain.

## Existing data and responsive review

- With v1 LocalStorage records present, confirm they are shown after a new assessment is saved and the original v1 value remains unchanged.
- With malformed v2 data, confirm the app reports the issue and does not overwrite it.
- Review keyboard operation, labels, visible focus, and screen-reader announcements.
- Review the form and history on desktop, tablet, and phone.
