import { expect, test } from '@playwright/test';

const savedKey = 'academic-ledger-exams-v2';
const legacyKey = 'academic-ledger-v1';
const subjects = [
  ['Math', '40'],
  ['Physics', '35'],
  ['Chemistry', '45'],
  ['Biology', '30'],
  ['English', '50'],
];

async function openAssessment(page, { name = 'Unit 1', maximum = '50', rows = subjects } = {}) {
  await page.getByRole('button', { name: '+ Add assessment' }).click();
  await page.getByLabel('Exam / unit name').fill(name);
  await page.getByLabel('One maximum for every subject').fill(maximum);
  await page.getByLabel('Total subjects').fill(String(rows.length));
  for (let index = 0; index < rows.length; index += 1) {
    const [subjectName, marks] = rows[index];
    await page.getByLabel(`Subject ${index + 1} name`).fill(subjectName);
    await page.getByLabel(`Marks obtained in ${subjectName}`).fill(marks);
  }
  await page.getByRole('button', { name: 'Save assessment' }).click();
}

test('creates an assessment and calculates totals, percentages, and CGPA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No assessments yet')).toBeVisible();
  await openAssessment(page);

  await expect(page.getByText('80.0%', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('8.00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('200 / 250 total marks')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unit 1' })).toBeVisible();
  await expect(page.locator('.marks-row').filter({ hasText: 'Math' }).getByText('40 / 50', { exact: true })).toBeVisible();
  await expect(page.locator('.marks-row').filter({ hasText: 'English' }).getByText('100.0%', { exact: true })).toBeVisible();
  await expect(page.locator('.exam-score')).toContainText('CGPA 8.00');
  await expect(page.getByRole('status')).toBeHidden();
  await page.screenshot({ path: 'test-results/desktop-populated.png', fullPage: true });
});

test('rejects missing and out-of-range assessment values', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ Add assessment' }).click();
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter an exam or unit name');

  await page.getByLabel('Exam / unit name').fill('Invalid');
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await expect(page.getByRole('alert')).toContainText('maximum marks');

  await page.getByLabel('One maximum for every subject').fill('0');
  await page.getByRole('button', { name: 'Save assessment' }).click();
  expect(await page.getByLabel('One maximum for every subject').evaluate(input => input.validity.rangeUnderflow)).toBe(true);

  await page.getByLabel('One maximum for every subject').fill('50');
  await page.getByLabel('Subject 1 name').fill('');
  await page.getByLabel('Marks obtained in subject 1').fill('');
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await expect(page.getByRole('alert')).toContainText('name and valid obtained marks');

  await page.getByLabel('Subject 1 name').fill('Math');
  await page.getByLabel('Marks obtained in Math').fill('-1');
  expect(await page.getByLabel('Marks obtained in Math').evaluate(input => input.validity.rangeUnderflow)).toBe(true);

  await page.getByLabel('Marks obtained in Math').fill('51');
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await expect(page.getByRole('alert')).toContainText('cannot be negative or exceed');
});

test('reuses saved subjects and compares percentages with different maximums', async ({ page }) => {
  await page.goto('/');
  await openAssessment(page);
  await page.getByRole('button', { name: '+ Add assessment' }).click();
  await expect(page.getByLabel('Subject 1 name')).toHaveValue('Biology');
  await expect(page.getByLabel('Subject 4 name')).toHaveValue('Math');
  await expect(page.getByLabel('Subject 5 name')).toHaveValue('Physics');

  const unit2 = subjects.map(([name], index) => [name, String([70, 70, 90, 60, 80][index])]);
  await page.getByLabel('Exam / unit name').fill('Unit 2');
  await page.getByLabel('One maximum for every subject').fill('100');
  for (let index = 0; index < unit2.length; index += 1) {
    const [name, marks] = unit2[index];
    await page.getByLabel(`Marks obtained in ${name}`).fill(marks);
  }
  await page.getByRole('button', { name: 'Save assessment' }).click();

  const mathCard = page.locator('.comparison-card').filter({ has: page.getByRole('heading', { name: 'Math' }) });
  await expect(mathCard.getByText('80.0%', { exact: true })).toBeVisible();
  await expect(mathCard.getByText('70.0%', { exact: true })).toBeVisible();
  await expect(mathCard).toContainText('latest -10.0 percentage points');
  await expect(mathCard.getByText('Unit 1')).toBeVisible();
  await expect(mathCard.getByText('Unit 2')).toBeVisible();
  await expect(page.getByText('570 / 750 total marks')).toBeVisible();
  await expect(page.getByText('76.0%', { exact: true }).first()).toBeVisible();
});

test('adds a new subject and carries it into the following assessment', async ({ page }) => {
  await page.goto('/');
  await openAssessment(page, { rows: [['Math', '40']] });
  await page.getByRole('button', { name: '+ Add assessment' }).click();
  await page.getByLabel('Exam / unit name').fill('Unit 2');
  await page.getByLabel('One maximum for every subject').fill('50');
  await page.getByLabel('Total subjects').fill('2');
  await page.getByLabel('Subject 1 name').fill('Math');
  await page.getByLabel('Marks obtained in Math').fill('42');
  await page.getByLabel('Subject 2 name').fill('Chemistry');
  await page.getByLabel('Marks obtained in Chemistry').fill('38');
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await page.getByRole('button', { name: '+ Add assessment' }).click();
  await expect(page.getByLabel('Subject 1 name')).toHaveValue('Chemistry');
  await expect(page.getByLabel('Subject 2 name')).toHaveValue('Math');
});

test('keeps unrecorded subjects absent and asks before deleting an exam', async ({ page }) => {
  await page.goto('/');
  await openAssessment(page, { rows: [['Math', '40'], ['Physics', '35']] });
  await page.getByRole('button', { name: '+ Add assessment' }).click();
  await page.getByLabel('Exam / unit name').fill('Unit 2');
  await page.getByLabel('One maximum for every subject').fill('100');
  await page.getByLabel('Total subjects').fill('1');
  await page.getByLabel('Subject 1 name').fill('Math');
  await page.getByLabel('Marks obtained in Math').fill('80');
  await page.getByRole('button', { name: 'Save assessment' }).click();

  const physicsCard = page.locator('.comparison-card').filter({ has: page.getByRole('heading', { name: 'Physics' }) });
  await expect(physicsCard.getByText('Unit 2')).toHaveCount(0);
  let confirmation = '';
  page.once('dialog', async dialog => {
    confirmation = dialog.message();
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Delete Unit 1' }).click();
  expect(confirmation).toContain('Delete Unit 1 and its marks?');
  await expect(page.getByRole('heading', { name: 'Unit 1' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Unit 2' })).toBeVisible();
  await expect(page.getByText('80 / 100 total marks')).toBeVisible();
});

test('preserves valid records across reload and protects malformed saved data', async ({ page }) => {
  await page.goto('/');
  await openAssessment(page, { rows: [['Math', '40']] });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Unit 1' })).toBeVisible();

  await page.evaluate(key => localStorage.setItem(key, '{broken json'), savedKey);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Saved data could not be read');
  await page.getByRole('button', { name: '+ Add assessment' }).click();
  await page.getByLabel('Exam / unit name').fill('Should not save');
  await page.getByLabel('One maximum for every subject').fill('50');
  await page.getByLabel('Subject 1 name').fill('Math');
  await page.getByLabel('Marks obtained in Math').fill('40');
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await expect(page.evaluate(key => localStorage.getItem(key), savedKey)).resolves.toBe('{broken json');
});

test('migrates legacy records on first save without changing the original value', async ({ page }) => {
  await page.goto('/');
  const legacy = JSON.stringify({
    sessions: [{ id: 's1', examName: 'Old Unit', date: '', structureSnapshot: { subjects: [{ subjectId: 'math', subjectNameSnapshot: 'Math', maximumMarks: 50 }] } }],
    results: [{ sessionId: 's1', subjectId: 'math', obtained: 40 }],
    subjects: [],
  });
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: legacyKey, value: legacy });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Old Unit' })).toBeVisible();

  await openAssessment(page, { name: 'New Unit', rows: [['Math', '45']] });
  await expect(page.evaluate(key => localStorage.getItem(key), legacyKey)).resolves.toBe(legacy);
  await expect(page.getByRole('heading', { name: 'Old Unit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'New Unit' })).toBeVisible();
});

test('renders without page overflow at desktop, tablet, and phone widths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await openAssessment(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('body')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  await expect(page.getByRole('status')).toBeHidden();
  await page.screenshot({ path: 'test-results/tablet-populated.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('body')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole('status')).toBeHidden();
  await page.screenshot({ path: 'test-results/mobile-populated.png', fullPage: true });
});

test('supports keyboard focus, labeled inputs, and live validation announcements', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'A Academic Ledger' })).toBeFocused();
  expect(await page.getByRole('link', { name: 'A Academic Ledger' }).evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '+ Add assessment' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Exam / unit name')).toBeFocused();
  await page.getByRole('button', { name: 'Save assessment' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter an exam or unit name');
});
