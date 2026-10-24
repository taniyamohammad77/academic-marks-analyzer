import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'academic-ledger-exams-v2';
const LEGACY_KEY = 'academic-ledger-v1';

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function migrateLegacy() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (!legacy) return [];
    const exams = [];
    for (const session of legacy.sessions || []) {
      const results = (legacy.results || []).filter(result => result.sessionId === session.id);
      const rows = (session.structureSnapshot?.subjects || []).map(subject => {
        const result = results.find(item => item.subjectId === subject.subjectId);
        return { id: makeId(), name: subject.subjectNameSnapshot, obtained: result ? String(result.obtained) : '', maximum: String(subject.maximumMarks) };
      });
      exams.push({ id: makeId(), name: session.examName || 'Exam', date: session.date || '', subjects: rows });
    }
    for (const result of legacy.results || []) {
      if (result.sessionId) continue;
      const subject = (legacy.subjects || []).find(item => item.id === result.subjectId);
      exams.push({ id: makeId(), name: result.name || 'Assessment', date: result.date || '', subjects: [{ id: makeId(), name: result.subjectNameSnapshot || subject?.name || 'Subject', obtained: String(result.obtained), maximum: String(result.maximum) }] });
    }
    return exams;
  } catch {
    return [];
  }
}

function readExams() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored == null) return { exams: migrateLegacy(), error: '' };
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(exam => exam && typeof exam.id === 'string' && typeof exam.name === 'string' && typeof exam.date === 'string' && Array.isArray(exam.subjects) && exam.subjects.every(subject => subject && typeof subject.id === 'string' && typeof subject.name === 'string' && ['string', 'number'].includes(typeof subject.obtained) && ['string', 'number'].includes(typeof subject.maximum)))) throw new Error('Invalid saved exams');
    return { exams: parsed, error: '' };
  } catch {
    return { exams: [], error: 'Saved data could not be read. Existing browser data was left untouched and changes are disabled.' };
  }
}

function validExam(exam) {
  return exam.subjects.length > 0 && exam.subjects.every(subject =>
    subject.name.trim() && String(subject.obtained).trim() !== '' && Number.isFinite(Number(subject.obtained)) && Number(subject.obtained) >= 0 &&
    Number.isFinite(Number(subject.maximum)) && Number(subject.maximum) > 0 && Number(subject.obtained) <= Number(subject.maximum)
  );
}

function subjectPercent(subject) {
  if (String(subject.obtained).trim() === '' || !Number.isFinite(Number(subject.maximum)) || Number(subject.maximum) <= 0) return null;
  return Number(subject.obtained) / Number(subject.maximum) * 100;
}

function totals(exams) {
  const marks = exams.flatMap(exam => exam.subjects).filter(subject => validExam({ subjects: [subject] }));
  const obtained = marks.reduce((sum, subject) => sum + Number(subject.obtained), 0);
  const maximum = marks.reduce((sum, subject) => sum + Number(subject.maximum), 0);
  return { obtained, maximum, percentage: maximum ? obtained / maximum * 100 : null };
}

function displayPercent(value) {
  return value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}%`;
}

export default function App() {
  const stored = useMemo(readExams, []);
  const [exams, setExams] = useState(stored.exams);
  const [storageError, setStorageError] = useState(stored.error);
  const [showForm, setShowForm] = useState(false);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [subjectCount, setSubjectCount] = useState('1');
  const [maximumMarks, setMaximumMarks] = useState('');
  const [subjects, setSubjects] = useState([{ id: makeId(), name: '', obtained: '', maximum: '' }]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const subjectHistory = useMemo(() => {
    const names = new Map();
    for (const exam of exams) {
      for (const subject of exam.subjects) {
        const key = subject.name.trim().toLocaleLowerCase();
        if (!key) continue;
        const current = names.get(key) || { name: subject.name.trim(), exams: [] };
        current.exams.push({ exam, subject });
        names.set(key, current);
      }
    }
    return [...names.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [exams]);

  const overall = totals(exams);
  const knownSubjectNames = new Set(subjectHistory.map(item => item.name.toLocaleLowerCase()));

  function beginAssessment() {
    const defaults = subjectHistory.map(item => ({ id: makeId(), name: item.name, obtained: '', maximum: '' }));
    const rows = defaults.length ? defaults : [{ id: makeId(), name: '', obtained: '', maximum: '' }];
    setExamName(''); setExamDate(''); setMaximumMarks(''); setSubjectCount(String(rows.length)); setSubjects(rows); setError(''); setShowForm(true);
  }

  function changeCount(value) {
    const count = Math.min(100, Math.max(1, Number(value) || 1));
    setSubjectCount(String(count));
    setSubjects(current => Array.from({ length: count }, (_, index) => current[index] || { id: makeId(), name: '', obtained: '', maximum: '' }));
  }

  function updateSubject(id, field, value) {
    setSubjects(current => current.map(subject => subject.id === id ? { ...subject, [field]: value } : subject));
  }

  function persist(next, successMessage) {
    if (storageError) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setExams(next);
      setToast(successMessage);
      return true;
    } catch {
      setError('Could not save to this browser. Your existing records were not changed.');
      setToast('Could not save. Your existing records were not changed.');
      return false;
    }
  }

  function saveExam(event) {
    event.preventDefault();
    const names = subjects.map(subject => subject.name.trim().toLocaleLowerCase());
    if (!examName.trim()) return setError('Enter an exam or unit name.');
    if (!Number.isFinite(Number(maximumMarks)) || Number(maximumMarks) <= 0) return setError('Enter the maximum marks for this assessment. It will apply to every subject.');
    const examSubjects = subjects.map(subject => ({ ...subject, maximum: Number(maximumMarks) }));
    if (!validExam({ subjects: examSubjects })) return setError('Enter a name and valid obtained marks for every subject. Marks cannot be negative or exceed the shared maximum.');
    if (new Set(names).size !== names.length) return setError('Each subject can appear only once in an exam.');
    const next = [...exams, { id: makeId(), name: examName.trim(), date: examDate, subjects: examSubjects.map(subject => ({ ...subject, name: subject.name.trim(), obtained: Number(subject.obtained) })) }];
    if (persist(next, 'Assessment saved.')) {
      setShowForm(false); setExamName(''); setExamDate(''); setSubjectCount('1'); setSubjects([{ id: makeId(), name: '', obtained: '', maximum: '' }]); setMaximumMarks(''); setError('');
    }
  }

  function deleteExam(exam) {
    if (!window.confirm(`Delete ${exam.name} and its marks?`)) return;
    persist(exams.filter(item => item.id !== exam.id), 'Assessment deleted.');
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">A</span>Academic Ledger</a><span className="local-note">Saved in this browser</span></header>
    <main id="top" className="page-content">
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}
      <section className="intro"><div><p className="eyebrow">YOUR MARKS, IN ONE PLACE</p><h1>Track every unit.<br /><em>See your progress.</em></h1><p className="intro-copy">Add an exam, enter each subject’s marks, and compare your results across units.</p></div><button className="primary-button" onClick={() => showForm ? (setShowForm(false), setError('')) : beginAssessment()}>{showForm ? 'Close' : '+ Add assessment'}</button></section>

      <section className="summary-grid" aria-label="Overall results">
        <article className="summary-card"><span>OVERALL PERCENTAGE</span><strong>{displayPercent(overall.percentage)}</strong><small>{overall.obtained} / {overall.maximum} total marks</small></article>
        <article className="summary-card"><span>ESTIMATED CGPA</span><strong>{overall.percentage == null ? '—' : (overall.percentage / 10).toFixed(2)}</strong><small>Percentage ÷ 10 · 10-point scale estimate</small></article>
        <article className="summary-card"><span>ASSESSMENTS</span><strong>{exams.length}</strong><small>{exams.reduce((sum, exam) => sum + exam.subjects.length, 0)} subject results recorded</small></article>
      </section>
      <p className="cgpa-note">CGPA rules vary by institution. This is a simple 10-point estimate, not an official CGPA.</p>

      {showForm && <section className="panel form-panel"><div className="panel-heading"><div><p className="eyebrow">NEW ASSESSMENT</p><h2>Enter the exam and its subjects</h2></div></div><form onSubmit={saveExam}>
        <div className="form-top"><label className="field"><span>Exam / unit name</span><input autoFocus value={examName} onChange={event => setExamName(event.target.value)} placeholder="e.g. Unit 1" /></label><label className="field"><span>Exam date (optional)</span><input type="date" value={examDate} onChange={event => setExamDate(event.target.value)} /></label><label className="field count-field"><span>Total subjects</span><input type="number" min="1" max="100" value={subjectCount} onChange={event => changeCount(event.target.value)} /></label><label className="field shared-maximum"><span>One maximum for every subject</span><input type="number" min="0.01" step="any" value={maximumMarks} onChange={event => setMaximumMarks(event.target.value)} placeholder="e.g. 50" /></label></div>
        <div className="subject-list-heading"><div><h3>Subjects in this assessment</h3><p>{knownSubjectNames.size ? `${knownSubjectNames.size} saved subjects are filled in automatically.` : 'Add your subjects here for the first assessment.'} Increase the subject count above to add another.</p></div><span>{subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}</span></div>
        <div className="subject-entry-list"><div className="entry-heading"><span>SUBJECT NAME</span><span>MARKS OBTAINED</span></div>{subjects.map((subject, index) => <div className="entry-row" key={subject.id}><div className="subject-name-field"><label className="sr-only" htmlFor={`subject-name-${subject.id}`}>Subject {index + 1} name</label><input id={`subject-name-${subject.id}`} value={subject.name} onChange={event => updateSubject(subject.id, 'name', event.target.value)} placeholder={`Subject ${index + 1} name`} /><span className={`subject-origin ${knownSubjectNames.has(subject.name.trim().toLocaleLowerCase()) ? 'saved' : ''}`}>{knownSubjectNames.has(subject.name.trim().toLocaleLowerCase()) ? 'Saved subject' : 'New subject'}</span></div><label className="sr-only" htmlFor={`obtained-${subject.id}`}>Marks obtained in {subject.name || `subject ${index + 1}`}</label><input id={`obtained-${subject.id}`} type="number" min="0" step="any" value={subject.obtained} onChange={event => updateSubject(subject.id, 'obtained', event.target.value)} placeholder="e.g. 42" /></div>)}</div>
        {error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><p>All subjects in this assessment use the maximum marks entered above.</p><button className="primary-button">Save assessment</button></div>
      </form></section>}

      <section className="panel history-panel"><div className="panel-heading"><div><p className="eyebrow">EXAM BY EXAM</p><h2>Assessment history</h2></div><span className="count-pill">{exams.length} {exams.length === 1 ? 'exam' : 'exams'}</span></div>
        {exams.length ? <div className="exam-list">{[...exams].reverse().map(exam => { const result = totals([exam]); return <article className="exam-card" key={exam.id}><div className="exam-head"><div><h3>{exam.name}</h3><p>{exam.date || 'No date'} · {exam.subjects.length} {exam.subjects.length === 1 ? 'subject' : 'subjects'}</p></div><div className="exam-score"><strong>{displayPercent(result.percentage)}</strong><span>{result.obtained} / {result.maximum} · CGPA {result.percentage == null ? '—' : (result.percentage / 10).toFixed(2)}</span></div><button className="delete-button" onClick={() => deleteExam(exam)} aria-label={`Delete ${exam.name}`}>Delete</button></div><div className="marks-table"><div className="marks-header"><span>SUBJECT</span><span>OBTAINED / MAX</span><span>PERCENT</span><span>CGPA / 10</span></div>{exam.subjects.map(subject => { const percentage = subjectPercent(subject); return <div className="marks-row" key={subject.id}><strong>{subject.name}</strong><span>{subject.obtained === '' ? 'Missing' : `${subject.obtained} / ${subject.maximum}`}</span><span>{displayPercent(percentage)}</span><span>{percentage == null ? '—' : (percentage / 10).toFixed(2)}</span></div>; })}</div></article>; })}</div> : <div className="empty-state"><div className="empty-icon">✳</div><h3>No assessments yet</h3><p>Create Unit 1 or your next exam. Choose the subject count, then enter each subject’s marks.</p><button className="text-button" onClick={beginAssessment}>Add your first assessment →</button></div>}
      </section>

      {subjectHistory.length > 0 && <section className="panel comparison-panel"><div className="panel-heading"><div><p className="eyebrow">COMPARE ACROSS UNITS</p><h2>Subject performance</h2><p className="panel-subtitle">Each subject’s results across all exams, compared by percentage.</p></div></div><div className="comparison-list">{subjectHistory.map(({ name, exams: entries }) => { const valid = entries.filter(({ subject }) => subjectPercent(subject) != null); const max = valid.reduce((sum, item) => sum + Number(item.subject.maximum), 0); const obtained = valid.reduce((sum, item) => sum + Number(item.subject.obtained), 0); const latestPair = valid.slice(-2); const change = latestPair.length === 2 ? subjectPercent(latestPair[1].subject) - subjectPercent(latestPair[0].subject) : null; return <article className="comparison-card" key={name}><div className="comparison-subject"><h3>{name}</h3><span>{displayPercent(max ? obtained / max * 100 : null)} overall{change != null && ` · latest ${change > 0 ? '+' : ''}${change.toFixed(1)} percentage points`}</span></div><div className="comparison-exams">{entries.map(({ exam, subject }) => { const pct = subjectPercent(subject); return <div className="comparison-item" key={`${exam.id}-${subject.id}`}><span>{exam.name}</span><b>{subject.obtained === '' ? 'Marks missing' : `${subject.obtained} / ${subject.maximum}`}</b><strong>{displayPercent(pct)}</strong><small>CGPA {pct == null ? '—' : (pct / 10).toFixed(2)}</small></div>; })}</div></article>; })}</div></section>}
    </main>
    <footer className="footer">Your records are stored locally in this browser. Back them up separately if needed.</footer>
    {toast && <div role="status" className="toast">{toast}<button onClick={() => setToast('')} aria-label="Dismiss message">×</button></div>}
  </div>;
}
