export const isValidMarks = (obtained, maximum) => Number.isFinite(obtained) && Number.isFinite(maximum) && maximum > 0 && obtained >= 0 && obtained <= maximum;
export const percent = (obtained, maximum) => isValidMarks(obtained, maximum) ? obtained / maximum * 100 : null;
export const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export const fmt = (value) => value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}%`;
export const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const fmtPercentagePoints = value => value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(2)} percentage points`;

function uniqueResults(results) {
  const ids = new Set();
  return results.filter(result => {
    if (!result || !isValidMarks(result.obtained, result.maximum)) return false;
    if (result.id == null) return true;
    if (ids.has(result.id)) return false;
    ids.add(result.id);
    return true;
  });
}

export function subjectAverage(subjectId, results) {
  return mean(uniqueResults(results).filter(r => r.subjectId === subjectId)
    .map(r => percent(r.obtained, r.maximum)));
}

export function aggregate(results) {
  const valid = uniqueResults(results);
  const max = valid.reduce((sum, r) => sum + r.maximum, 0);
  return max ? valid.reduce((sum, r) => sum + r.obtained, 0) / max * 100 : null;
}

export function compareResults(earlier, later) {
  if (!earlier || !later || earlier.id === later.id || earlier.subjectId !== later.subjectId ||
      !isValidMarks(earlier.obtained, earlier.maximum) || !isValidMarks(later.obtained, later.maximum)) {
    return { status: 'insufficient', earlierPercent: null, laterPercent: null, percentagePointDifference: null };
  }
  const earlierPercent = percent(earlier.obtained, earlier.maximum);
  const laterPercent = percent(later.obtained, later.maximum);
  const status = laterPercent > earlierPercent ? 'improved' : laterPercent < earlierPercent ? 'declined' : 'unchanged';
  return { status, earlierPercent, laterPercent, percentagePointDifference: laterPercent - earlierPercent };
}
