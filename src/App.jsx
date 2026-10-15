import { useEffect, useRef, useState } from 'react';
import { aggregate, compareResults, createId, fmt, fmtPercentagePoints, isValidMarks, percent, subjectAverage } from './utils.js';

const KEY = 'academic-ledger-v1';
const initial = { semesters: [], subjects: [], results: [], structures: [], sessions: [], settings: { targetPercentage: null, gradeBands: [] } };
const nav = [{ id: 'Overview', icon: '◫' }, { id: 'Subjects', icon: '▤' }, { id: 'Semesters', icon: '▦' }, { id: 'Sessions', icon: 'S' }, { id: 'Comparisons', icon: 'C' }, { id: 'Reports', icon: 'R' }, { id: 'Settings', icon: '⚙' }];

function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { data: initial, error: '' };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.semesters) || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.results) ||
        (parsed.structures != null && !Array.isArray(parsed.structures)) || (parsed.sessions != null && !Array.isArray(parsed.sessions))) throw Error('Invalid data');
    const structures = parsed.structures || [];
    const sessions = parsed.sessions || [];
    const settings = parsed.settings || initial.settings;
    const gradeBands = settings.gradeBands || [];
    const validSettings = settings && typeof settings === 'object' && !Array.isArray(settings) &&
      (settings.targetPercentage == null || (Number.isFinite(settings.targetPercentage) && settings.targetPercentage >= 0 && settings.targetPercentage <= 100)) &&
      Array.isArray(gradeBands) && gradeBands.every(band => band && typeof band.label === 'string' && band.label.trim() && Number.isFinite(band.minimum) && Number.isFinite(band.maximum) && band.minimum >= 0 && band.maximum <= 100 && band.minimum <= band.maximum) &&
      gradeBands.every((band, index) => gradeBands.slice(index + 1).every(other => band.maximum < other.minimum || other.maximum < band.minimum));
    const valid = parsed.semesters.every(item => item && typeof item.id === 'string' && typeof item.name === 'string') &&
      parsed.subjects.every(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.semesterId === 'string') &&
      parsed.results.every(item => item && typeof item.id === 'string' && typeof item.subjectId === 'string' && typeof item.name === 'string' && isValidMarks(item.obtained, item.maximum) && (item.date == null || typeof item.date === 'string') && (item.semesterIdSnapshot == null || typeof item.semesterIdSnapshot === 'string') && (item.corrections == null || (Array.isArray(item.corrections) && item.corrections.every(event => event && typeof event.id === 'string' && typeof event.correctedAt === 'string')))) &&
      structures.every(item => item && typeof item.id === 'string' && typeof item.semesterId === 'string' && typeof item.examName === 'string' && typeof item.assessmentType === 'string' && Array.isArray(item.subjects) && item.subjects.every(subject => subject && typeof subject.subjectId === 'string' && typeof subject.subjectNameSnapshot === 'string' && Number.isFinite(subject.maximumMarks) && subject.maximumMarks > 0)) &&
      sessions.every(item => item && typeof item.id === 'string' && typeof item.semesterId === 'string' && typeof item.examName === 'string' && typeof item.assessmentType === 'string' && item.structureSnapshot && Array.isArray(item.structureSnapshot.subjects) && item.structureSnapshot.subjects.every(subject => subject && typeof subject.subjectId === 'string' && typeof subject.subjectNameSnapshot === 'string' && Number.isFinite(subject.maximumMarks) && subject.maximumMarks > 0)) && validSettings;
    if (!valid) throw Error('Invalid data');
    const results = parsed.results.map(result => {
      const subject = parsed.subjects.find(item => item.id === result.subjectId);
      return { ...result, subjectNameSnapshot: result.subjectNameSnapshot || subject?.name || 'Archived subject', semesterIdSnapshot: result.semesterIdSnapshot || subject?.semesterId || null };
    });
    return { data: { ...initial, ...parsed, structures, sessions, results, settings: { ...initial.settings, ...settings, gradeBands } }, error: '' };
  } catch {
    return { data: initial, error: 'Saved data could not be loaded. Saving is disabled to protect the existing browser data.' };
  }
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function App() {
  const [loadedState] = useState(loadData);
  const [data, setData] = useState(loadedState.data);
  const [page, setPage] = useState('Overview');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState('');
  const [editingResult, setEditingResult] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [toast, setToast] = useState('');
  const [storageLoadError] = useState(loadedState.error);
  const [reportSemesterId, setReportSemesterId] = useState('all');
  const [excludedSessionIds, setExcludedSessionIds] = useState([]);
  const [comparisonSubjectId, setComparisonSubjectId] = useState('');
  const [earlierResultId, setEarlierResultId] = useState('');
  const [laterResultId, setLaterResultId] = useState('');

  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 3200); return () => clearTimeout(id); } }, [toast]);

  const activeSubjects = data.subjects.filter(s => !s.archived);
  const selectedSubject = data.subjects.find(subject => subject.id === selectedSubjectId);
  const selectedSubjectResults = [...data.results].filter(result => result.subjectId === selectedSubjectId).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  const allPct = aggregate(data.results);
  const averages = activeSubjects.map(s => subjectAverage(s.id, data.results)).filter(v => v != null);
  const overallSubjectAverage = averages.length ? averages.reduce((a, b) => a + b, 0) / averages.length : null;
  const targetSubjectRows = activeSubjects.map(subject => ({ subject, average: subjectAverage(subject.id, data.results) }));
  const belowTargetSubjects = data.settings.targetPercentage == null ? [] : targetSubjectRows.filter(row => row.average != null && row.average < data.settings.targetPercentage);
  const rankedSubjects = [...targetSubjectRows].sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  const recent = [...data.results].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')).slice(0, 5);
  const upcomingSessions = (data.sessions || []).filter(session => {
    if (typeof session.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)) return false;
    const date = new Date(`${session.date}T00:00:00`);
    const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return Number.isFinite(date.getTime()) && localDate === session.date && session.date > todayKey();
  }).sort((a, b) => a.date.localeCompare(b.date));
  const reportSessions = (data.sessions || []).filter(session => reportSemesterId === 'all' || session.semesterId === reportSemesterId);
  const reportSessionIds = new Set(reportSessions.map(session => session.id));
  const reportResults = data.results.filter(result => {
    if (result.sessionId) {
      const session = (data.sessions || []).find(item => item.id === result.sessionId);
      return !!session && reportSessionIds.has(session.id) && !excludedSessionIds.includes(session.id);
    }
    const subject = data.subjects.find(item => item.id === result.subjectId);
    return !!subject && (reportSemesterId === 'all' || (result.semesterIdSnapshot || subject.semesterId) === reportSemesterId);
  }).filter((result, index, results) => results.findIndex(item => item.id === result.id) === index);
  const reportSubjects = (reportSemesterId === 'all' ? data.subjects : data.subjects.filter(subject => subject.semesterId === reportSemesterId || reportResults.some(result => result.subjectId === subject.id)));
  const reportSubjectAverages = reportSubjects.map(subject => subjectAverage(subject.id, reportResults)).filter(value => value != null);
  const reportOverallSubjectAverage = reportSubjectAverages.length ? reportSubjectAverages.reduce((sum, value) => sum + value, 0) / reportSubjectAverages.length : null;
  const comparisonResults = data.results.filter(result => result.subjectId === comparisonSubjectId);
  const earlierResult = comparisonResults.find(result => result.id === earlierResultId);
  const laterResult = comparisonResults.find(result => result.id === laterResultId);
  const comparison = compareResults(earlierResult, laterResult);

  function commitData(update, successMessage) {
    if (storageLoadError) { setToast('Saved data is unavailable; this change was not saved.'); return false; }
    const next = update(data);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setData(next);
      setToast(successMessage);
      return true;
    } catch {
      setToast('Could not save to this browser. The change was not applied; check available storage and try again.');
      return false;
    }
  }

  function saveSemester(name) {
    if (!name.trim()) return;
    if (commitData(d => ({ ...d, semesters: [...d.semesters, { id: createId(), name: name.trim() }] }), 'Semester added')) setModal('');
  }
  function updateSemester(semester) {
    if (!semester.name.trim()) return;
    if (commitData(d => ({ ...d, semesters: d.semesters.map(item => item.id === semester.id ? { ...item, name: semester.name.trim(), updatedAt: new Date().toISOString() } : item) }), 'Semester updated')) { setModal(''); setEditingSemester(null); }
  }
  function saveSubject(subject) {
    if (commitData(d => ({ ...d, subjects: [...d.subjects, { ...subject, id: createId(), createdAt: new Date().toISOString() }] }), 'Subject added')) setModal('');
  }
  function updateSubject(subject) {
    if (commitData(d => ({ ...d, subjects: d.subjects.map(item => item.id === subject.id ? { ...item, name: subject.name, semesterId: subject.semesterId, updatedAt: new Date().toISOString() } : item) }), 'Subject updated')) { setModal(''); setEditingSubject(null); }
  }
  function saveResult(result) {
    const subject = data.subjects.find(item => item.id === result.subjectId);
    const subjectNameSnapshot = subject?.name || 'Archived subject';
    const semesterIdSnapshot = subject?.semesterId || null;
    if (commitData(d => ({ ...d, results: [...d.results, { ...result, subjectNameSnapshot, semesterIdSnapshot, id: createId(), createdAt: new Date().toISOString(), corrections: [] }] }), 'Assessment saved')) setModal('');
  }
  function saveStructure(structure) {
    if (commitData(d => ({ ...d, structures: [...(d.structures || []), { ...structure, id: createId(), createdAt: new Date().toISOString() }] }), 'Exam structure saved')) setModal('');
  }
  function saveSession(session, entries) {
    const sessionId = createId();
    const createdAt = new Date().toISOString();
    const results = entries.filter(entry => entry.obtained !== '').map(entry => ({ ...entry, id: createId(), sessionId, sessionNameSnapshot: session.examName, createdAt, corrections: [] }));
    if (commitData(d => ({ ...d, sessions: [...(d.sessions || []), { ...session, id: sessionId, createdAt }], results: [...d.results, ...results] }), results.length ? 'Exam session saved' : 'Session saved with no marks entered')) setModal('');
  }
  function saveSettings(settings) {
    return commitData(d => ({ ...d, settings }), 'Grading settings saved');
  }
  function correctResult(resultId, marks) {
    const saved = data.results.find(result => result.id === resultId);
    if (!saved || saved.obtained === marks) { setModal(''); setEditingResult(null); return; }
    const correction = { id: createId(), resultId, subjectId: saved.subjectId, sessionId: saved.sessionId || null, previousObtainedMarks: saved.obtained, correctedObtainedMarks: marks, maximumMarks: saved.maximum, correctedAt: new Date().toISOString() };
    if (commitData(d => ({ ...d, results: d.results.map(result => result.id === resultId ? { ...result, obtained: marks, corrections: [...(result.corrections || []), correction] } : result) }), 'Correction saved to history')) { setModal(''); setEditingResult(null); }
  }
  function archiveSubject(subject) {
    if (!confirm(`Archive ${subject.name}? Existing assessment history will remain.`)) return;
    commitData(d => ({ ...d, subjects: d.subjects.map(s => s.id === subject.id ? { ...s, archived: true } : s) }), 'Subject archived');
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={() => setPage('Overview')}><span className="brand-mark">A</span><span>academic<span className="brand-light">ledger</span></span></a>
      <div className="nav-caption">WORKSPACE</div>
      <nav aria-label="Main navigation">{nav.map(item => { const selected = page === item.id || (page === 'Subject detail' && item.id === 'Subjects'); return <button key={item.id} className={`nav-item ${selected ? 'selected' : ''}`} aria-current={selected ? 'page' : undefined} onClick={() => setPage(item.id)}><span aria-hidden="true" className="nav-icon">{item.icon}</span>{item.id}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="privacy-icon">◉</div><div><b>Your space, your pace.</b><p>Your records stay in this browser.</p></div><small>PERSONAL EDITION · 0.1</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div><div className="top-actions"><span className="today">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</span><button className="avatar" aria-label="Profile">S</button></div></header>
      {storageLoadError && <div className="storage-warning" role="alert">{storageLoadError}</div>}
      <div className="page-content">
        {page === 'Overview' && <>
          <div className="welcome-row"><div><div className="eyebrow">YOUR ACADEMIC SPACE</div><h1>A clearer view of <em>your progress.</em></h1><p className="subheading">Every result tells part of your story. Here’s where you are right now.</p></div><button className="button primary" onClick={() => setModal(data.semesters.length ? 'result' : 'semester')}>ï¼‹ Add assessment</button></div>
          <section className="metric-grid">
            <Metric label="OVERALL PERCENTAGE" value={fmt(allPct)} hint="Across all recorded results" icon="↗" color="violet" />
            <Metric label="SUBJECT AVERAGE" value={fmt(overallSubjectAverage)} hint="Mean of subject averages" icon="◌" color="blue" />
            <Metric label="ACTIVE SUBJECTS" value={activeSubjects.length} hint={`Across ${data.semesters.length} ${data.semesters.length === 1 ? 'semester' : 'semesters'}`} icon="▤" color="amber" />
            <Metric label="RECORDED RESULTS" value={data.results.length} hint="Assessments with marks entered" icon="✳" color="green" />
          </section>
          <section className="panel target-insights">
            <div className="panel-heading"><div><h2>Progress against your target</h2><p>{data.settings.targetPercentage == null ? 'Set a target in Settings to see which subject averages are below it.' : `Subject averages compared with your ${fmt(data.settings.targetPercentage)} target.`}</p></div>{data.settings.targetPercentage == null && <button className="button secondary" onClick={() => setPage('Settings')}>Configure target</button>}</div>
            {data.settings.targetPercentage != null && (targetSubjectRows.some(row => row.average != null) ? <>
              <div className="target-summary"><span><b>{belowTargetSubjects.length}</b> {belowTargetSubjects.length === 1 ? 'subject average is' : 'subject averages are'} below target</span><span>{targetSubjectRows.filter(row => row.average == null).length} without results</span></div>
              {belowTargetSubjects.length > 0 && <div className="target-subject-list">{belowTargetSubjects.map(({ subject, average }) => <div key={subject.id}><span>{subject.name}<small>{data.semesters.find(semester => semester.id === subject.semesterId)?.name || 'No semester'}</small></span><b>{fmt(average)}</b></div>)}</div>}
              {!belowTargetSubjects.length && <p className="target-empty">All subjects with recorded results are at or above your configured target.</p>}
            </> : <p className="target-empty">No subject averages are available yet. Record a result to compare it with your target.</p>)}
          </section>
          {upcomingSessions.length > 0 && <section className="panel upcoming-panel"><div className="panel-heading"><div><h2>Upcoming exam sessions</h2><p>Based on dates you entered for saved sessions.</p></div><button className="text-button" onClick={() => setPage('Sessions')}>View sessions →</button></div><div className="upcoming-list">{upcomingSessions.slice(0, 4).map(session => <article key={session.id}><div className="upcoming-date"><b>{new Date(`${session.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric' })}</b><span>{new Date(`${session.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span></div><div><b>{session.examName}</b><span>{session.assessmentType} · {data.semesters.find(semester => semester.id === session.semesterId)?.name || 'Semester'}</span></div></article>)}</div></section>}
          <section className="panel structures-panel"><div className="panel-heading"><div><h2>Reusable exam structures</h2><p>Save subject maxima once, then use this setup for future exams.</p></div><button className="button secondary" disabled={!data.semesters.length || !activeSubjects.length} onClick={() => setModal('structure')}>+ New structure</button></div>{data.structures?.length ? <div className="structure-grid">{data.structures.map(structure => <article className="structure-card" key={structure.id}><div><b>{structure.examName}</b><span>{structure.assessmentType} · {data.semesters.find(s => s.id === structure.semesterId)?.name || 'Archived semester'}</span></div><div className="structure-summary"><span>{structure.subjects.length} subjects</span><b>{structure.totalMaximum} total marks</b></div><div className="structure-subjects">{structure.subjects.map(item => <span key={item.subjectId}>{item.subjectNameSnapshot}: {item.maximumMarks}</span>)}</div><button className="button secondary session-button" onClick={() => { setEditingResult(structure); setModal('session'); }}>Start session</button></article>)}</div> : <p className="structure-empty">No structures yet. Add a semester and subjects first, then create a reusable exam setup.</p>}</section>
          <section className="content-grid">
            <div className="panel results-panel"><div className="panel-heading"><div><h2>Recent results</h2><p>Your latest recorded assessments</p></div><button className="text-button" onClick={() => setPage('Reports')}>View all <span>→</span></button></div>
              {recent.length ? <div className="result-list">{recent.map(r => { const s = data.subjects.find(x => x.id === r.subjectId); const subjectName = r.subjectNameSnapshot || s?.name || 'Archived subject'; return <div className="result-row" key={r.id}><div className="subject-avatar">{subjectName.slice(0, 1).toUpperCase()}</div><div className="result-info"><b>{subjectName}</b><span>{r.name} · {r.date || 'No date'}</span></div><div className="result-score"><b>{r.obtained}<small> / {r.maximum}</small></b><span>{fmt(percent(r.obtained, r.maximum))}</span></div></div>; })}</div> : <Empty title="Your story starts here" text="Add a subject, then record an assessment to see your results here." action="Add your first subject" onClick={() => setModal(data.semesters.length ? 'subject' : 'semester')} />}
            </div>
            <div className="panel subjects-panel"><div className="panel-heading"><div><h2>Subjects</h2><p>Highest subject averages first</p></div><button className="icon-button" aria-label="Add subject" onClick={() => setModal(data.semesters.length ? 'subject' : 'semester')}>ï¼‹</button></div>
              {activeSubjects.length ? <div className="subject-list">{rankedSubjects.slice(0, 5).map(({ subject: s, average: avg }, i) => { const colors = ['violet', 'blue', 'amber', 'green', 'rose']; return <div className="subject-mini" key={s.id}><div className={`mini-icon ${colors[i % colors.length]}`}>{s.name.slice(0, 1).toUpperCase()}</div><div className="mini-main"><div><b>{s.name}</b><span>{data.semesters.find(x => x.id === s.semesterId)?.name || 'No semester'}</span></div><b className="mini-score">{fmt(avg)}</b></div></div>; })}<button className="full-link" onClick={() => setPage('Subjects')}>View all subjects <span>→</span></button></div> : <Empty title="No subjects yet" text="Add subjects to organize your assessments." action="Add a subject" onClick={() => setModal(data.semesters.length ? 'subject' : 'semester')} />}
            </div>
          </section>
          <div className="note-strip"><span>✦</span><p><b>A note on your numbers</b> &nbsp;Overall percentage uses total marks earned divided by total possible marks. Subject average is a simple mean of each subject’s assessment percentages.</p></div>
        </>}
        {page === 'Subjects' && <><div className="section-title"><div><div className="eyebrow">YOUR LEARNING, ORGANIZED</div><h1>My subjects</h1><p className="subheading">Keep the subjects you’re studying and their assessment history together.</p></div><button className="button primary" onClick={() => setModal(data.semesters.length ? 'subject' : 'semester')}>ï¼‹ Add subject</button></div><div className="toolbar"><label className="search"><span aria-hidden="true">⌕</span><input aria-label="Search subjects" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search subjects..." /></label><span className="muted">{activeSubjects.length} subjects</span></div><div className="subject-cards">{activeSubjects.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).map(s => { const rs = data.results.filter(r => r.subjectId === s.id); const sem = data.semesters.find(x => x.id === s.semesterId); return <article className="subject-card" key={s.id}><div className="card-top"><div className="mini-icon violet">{s.name.slice(0, 1).toUpperCase()}</div><div className="card-actions"><button className="quiet-button" onClick={() => { setEditingSubject(s); setModal('editSubject'); }}>Edit</button><button className="quiet-button" onClick={() => archiveSubject(s)}>Archive</button></div></div><h3>{s.name}</h3><p>{sem?.name || 'No semester'} · {rs.length} {rs.length === 1 ? 'assessment' : 'assessments'}</p><button className="text-button subject-history-link" onClick={() => { setSelectedSubjectId(s.id); setPage('Subject detail'); }}>View assessment history →</button><div className="card-divider"></div><div className="card-foot"><span>Subject average</span><b>{fmt(subjectAverage(s.id, data.results))}</b></div><button className="full-link" onClick={() => { setModal('result'); }}>ï¼‹ Add assessment</button></article>; })}{!activeSubjects.length && <div className="panel wide-empty"><Empty title="No subjects yet" text="Add a subject to start keeping track of your results." action="Add a subject" onClick={() => setModal(data.semesters.length ? 'subject' : 'semester')} /></div>}</div></>}
        {page === 'Semesters' && <><div className="section-title"><div><div className="eyebrow">YOUR ACADEMIC TIMELINE</div><h1>Semesters</h1><p className="subheading">Group subjects and results by semester.</p></div><button className="button primary" onClick={() => setModal('semester')}>ï¼‹ Add semester</button></div><div className="semester-grid">{data.semesters.map((sem, index) => { const subjects = activeSubjects.filter(s => s.semesterId === sem.id); const ids = subjects.map(s => s.id); const results = data.results.filter(r => ids.includes(r.subjectId)); return <article className="semester-card" key={sem.id}><div className="semester-number">0{index + 1}</div><div className="semester-card-title"><h2>{sem.name}</h2><button className="quiet-button" onClick={() => { setEditingSemester(sem); setModal('editSemester'); }}>Edit</button></div><p>{subjects.length} subjects · {results.length} results</p><div className="semester-stat"><span>Aggregate percentage</span><b>{fmt(aggregate(results))}</b></div></article>; })}{!data.semesters.length && <div className="panel wide-empty"><Empty title="A fresh start" text="Create a semester before adding subjects." action="Create semester" onClick={() => setModal('semester')} /></div>}</div></>}
        {page === 'Subject detail' && selectedSubject && <SubjectDetail subject={selectedSubject} results={selectedSubjectResults} semesterName={data.semesters.find(item => item.id === selectedSubject.semesterId)?.name || 'Archived semester'} settings={data.settings} onBack={() => setPage('Subjects')} onCorrect={result => { setEditingResult(result); setModal('correction'); }} />}
        {page === 'Sessions' && <><div className="section-title"><div><div className="eyebrow">EXAM HISTORY</div><h1>Sessions</h1><p className="subheading">Review each exam attempt with the structure and subject maxima saved at the time.</p></div></div>{data.sessions?.length ? <div className="session-history">{[...data.sessions].sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')).map(session => { const sessionResults = data.results.filter(r => r.sessionId === session.id); const snapshotSubjects = session.structureSnapshot?.subjects || []; return <article className="panel session-card" key={session.id}><div className="session-card-head"><div><div className="eyebrow">{data.semesters.find(s => s.id === session.semesterId)?.name || 'Semester history'}</div><h2>{session.examName}</h2><p>{session.assessmentType} · {session.date || 'No date recorded'}</p></div><div className="session-card-total"><b>{fmt(aggregate(sessionResults))}</b><span>{sessionResults.length} of {snapshotSubjects.length} results entered</span></div></div><div className="session-subject-list">{snapshotSubjects.map(item => { const result = sessionResults.find(r => r.subjectId === item.subjectId); return <div className="session-subject-row" key={item.subjectId}><span>{item.subjectNameSnapshot}<small>Maximum {item.maximumMarks}</small></span>{result ? <b>{result.obtained} / {result.maximum} <small>{fmt(percent(result.obtained, result.maximum))}</small></b> : <em>Marks not entered</em>}</div>; })}</div></article>; })}</div> : <div className="panel"><Empty title="No exam sessions yet" text="Start a session from a saved exam structure on the overview page. Its maxima and subject names will be kept with the session." /></div>}</>}
        {page === 'Comparisons' && <><div className="section-title"><div><div className="eyebrow">RECORDED PERFORMANCE</div><h1>Compare results</h1><p className="subheading">Compare two saved results for the same subject by percentage.</p></div></div><section className="panel comparison-picker"><label className="field"><span>Subject</span><select value={comparisonSubjectId} onChange={event => { setComparisonSubjectId(event.target.value); setEarlierResultId(''); setLaterResultId(''); }}><option value="">Choose a subject</option>{data.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}{subject.archived ? ' (archived)' : ''}</option>)}</select></label><div className="field-pair"><label className="field"><span>Earlier result</span><select value={earlierResultId} onChange={event => setEarlierResultId(event.target.value)} disabled={!comparisonSubjectId}><option value="">Choose a result</option>{comparisonResults.map(result => <option key={result.id} value={result.id}>{result.name} · {result.date || 'No date'} · {result.obtained}/{result.maximum}</option>)}</select></label><label className="field"><span>Later result</span><select value={laterResultId} onChange={event => setLaterResultId(event.target.value)} disabled={!comparisonSubjectId}><option value="">Choose a result</option>{comparisonResults.map(result => <option key={result.id} value={result.id}>{result.name} · {result.date || 'No date'} · {result.obtained}/{result.maximum}</option>)}</select></label></div><p className="form-hint">Choose the order explicitly. Dates are shown for context and are not used to guess which result came first.</p></section>{earlierResult && laterResult && <section className="panel comparison-result"><div className="comparison-values"><div><span>EARLIER SELECTED</span><b>{fmt(comparison.earlierPercent)}</b><small>{earlierResult.name} · {earlierResult.obtained} / {earlierResult.maximum}{earlierResult.date ? ` · ${earlierResult.date}` : ''}</small></div><div><span>LATER SELECTED</span><b>{fmt(comparison.laterPercent)}</b><small>{laterResult.name} · {laterResult.obtained} / {laterResult.maximum}{laterResult.date ? ` · ${laterResult.date}` : ''}</small></div></div>{comparison.status === 'insufficient' ? <p className="comparison-status">Insufficient data to compare.</p> : <><p className="comparison-status">{comparison.status === 'improved' ? 'Recorded percentage improved.' : comparison.status === 'declined' ? 'Recorded percentage declined.' : 'No change in recorded percentage.'}</p><p className="comparison-difference">{fmtPercentagePoints(comparison.percentagePointDifference)}</p></>}<p className="report-footnote">This compares recorded percentages only. Different exam formats, coverage, and difficulty do not establish a change in underlying knowledge.</p></section>}</>}
        {page === 'Settings' && <SettingsPage settings={data.settings} onSave={saveSettings} />}
        {page === 'Reports' && <><div className="section-title"><div><div className="eyebrow">YOUR RESULTS, IN CONTEXT</div><h1>Performance report</h1><p className="subheading">A transparent summary of the marks you’ve recorded.</p></div></div><section className="panel report-filter-panel"><div className="report-filter-controls"><label className="field"><span>Report period</span><select value={reportSemesterId} onChange={event => setReportSemesterId(event.target.value)}><option value="all">All semesters</option>{data.semesters.map(semester => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label><span className="report-scope-hint">Choose which exam sessions count in this report.</span></div>{reportSessions.length > 0 && <fieldset className="session-filter"><legend>Included exam sessions</legend>{reportSessions.map(session => <label key={session.id}><input type="checkbox" checked={!excludedSessionIds.includes(session.id)} onChange={event => setExcludedSessionIds(ids => event.target.checked ? ids.filter(id => id !== session.id) : [...ids, session.id])} /><span>{session.examName}<small>{session.assessmentType} · {session.date || 'No date'}</small></span></label>)}</fieldset>}</section><div className="report-summary"><Metric label="OVERALL PERCENTAGE" value={fmt(aggregate(reportResults))} hint="Total obtained ÷ total maximum" icon="↗" color="violet" /><Metric label="SUBJECT AVERAGE" value={fmt(reportOverallSubjectAverage)} hint="Mean of included subject averages" icon="◌" color="blue" /><Metric label="RESULTS INCLUDED" value={reportResults.length} hint="Each saved result counted once" icon="✳" color="green" /></div><div className="panel report-panel"><div className="panel-heading"><div><h2>Assessment details</h2><p>Individual results and percentages for this report scope</p></div></div>{reportResults.length ? <div className="table-wrap"><table><thead><tr><th>SUBJECT</th><th>ASSESSMENT</th><th>DATE</th><th>MARKS</th><th>PERCENTAGE</th><th>TARGET STATUS</th><th>GRADE</th><th>ACTION</th></tr></thead><tbody>{reportResults.map(r => <tr key={r.id}><td>{r.subjectNameSnapshot || data.subjects.find(s => s.id === r.subjectId)?.name || 'Archived subject'}</td><td>{r.name}</td><td>{r.date || '—'}</td><td>{r.obtained} / {r.maximum}</td><td><b>{fmt(percent(r.obtained, r.maximum))}</b></td><td>{data.settings.targetPercentage == null ? 'Not configured' : percent(r.obtained, r.maximum) == null ? 'Insufficient data' : percent(r.obtained, r.maximum) >= data.settings.targetPercentage ? 'At or above target' : 'Below target'}</td><td>{gradeFor(percent(r.obtained, r.maximum), data.settings.gradeBands)}</td><td><button className="quiet-button" onClick={() => { setEditingResult(r); setModal('correction'); }}>Correct</button></td></tr>)}</tbody></table>{reportResults.some(r => r.corrections?.length) && <div className="correction-list"><h3>Correction history</h3><p>Corrections stay in this browser and are not tamper-proof.</p>{reportResults.flatMap(r => (r.corrections || []).map(c => <div className="correction-row" key={c.id}><span>{r.subjectNameSnapshot || data.subjects.find(s => s.id === r.subjectId)?.name || 'Archived subject'} · {r.name}</span><b>{c.previousObtainedMarks} → {c.correctedObtainedMarks} / {c.maximumMarks}</b><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(c.correctedAt))}</time></div>))}</div>}</div> : <Empty title="No results in this report scope" text="Choose another semester or include an exam session with entered marks." />}</div><p className="report-footnote">This report reflects the selected records in this browser. It is a personal record, not an official transcript.</p></>}
      </div>
    </main>
    {modal && <Modal type={modal} data={data} result={editingResult} subject={editingSubject} semester={editingSemester} onClose={() => { setModal(''); setEditingResult(null); setEditingSubject(null); setEditingSemester(null); }} onSemester={saveSemester} onEditSemester={updateSemester} onSubject={saveSubject} onEditSubject={updateSubject} onResult={saveResult} onStructure={saveStructure} onSession={saveSession} onCorrection={correctResult} />}
    {toast && <div role="status" className="toast">{toast}</div>}
  </div>;
}

function SubjectDetail({ subject, results, semesterName, settings, onBack, onCorrect }) {
  const average = subjectAverage(subject.id, results);
  return <><div className="section-title"><div><div className="eyebrow">SUBJECT HISTORY · {semesterName}</div><h1>{subject.name}</h1><p className="subheading">Saved assessment results for this subject. Session names and marks remain tied to their saved records.</p></div><button className="button secondary" onClick={onBack}>Back to subjects</button></div><div className="report-summary"><Metric label="SUBJECT AVERAGE" value={fmt(average)} hint="Simple mean of valid assessment percentages" icon="◌" color="blue" /><Metric label="RESULTS RECORDED" value={results.length} hint="Saved results for this subject" icon="✳" color="green" /></div><section className="panel report-panel"><div className="panel-heading"><div><h2>Assessment history</h2><p>Each result retains its own maximum marks</p></div></div>{results.length ? <div className="table-wrap"><table><thead><tr><th>ASSESSMENT</th><th>DATE</th><th>MARKS</th><th>PERCENTAGE</th><th>TARGET</th><th>GRADE</th><th>ACTION</th></tr></thead><tbody>{results.map(result => { const resultPercent = percent(result.obtained, result.maximum); return <tr key={result.id}><td>{result.name}</td><td>{result.date || '—'}</td><td>{result.obtained} / {result.maximum}</td><td><b>{fmt(resultPercent)}</b></td><td>{settings.targetPercentage == null ? 'Not configured' : resultPercent == null ? 'Insufficient data' : resultPercent >= settings.targetPercentage ? 'At or above target' : 'Below target'}</td><td>{gradeFor(resultPercent, settings.gradeBands)}</td><td><button className="quiet-button" onClick={() => onCorrect(result)}>Correct</button></td></tr>; })}</tbody></table>{results.some(result => result.corrections?.length) && <div className="correction-list"><h3>Correction history</h3><p>Stored in this browser and not tamper-proof.</p>{results.flatMap(result => (result.corrections || []).map(correction => <div className="correction-row" key={correction.id}><span>{result.subjectNameSnapshot || subject.name} · {result.name}</span><b>{correction.previousObtainedMarks} → {correction.correctedObtainedMarks} / {correction.maximumMarks}</b><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(correction.correctedAt))}</time></div>))}</div>}</div> : <Empty title="No assessment history yet" text="Record an assessment to see this subject’s results here." />}</section></>;
}

function SettingsPage({ settings, onSave }) {
  const [targetValue, setTargetValue] = useState(settings.targetPercentage == null ? '' : String(settings.targetPercentage));
  const [bands, setBands] = useState((settings.gradeBands || []).map(band => ({ label: band.label, minimum: String(band.minimum), maximum: String(band.maximum) })));
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault(); setError('');
    let targetPercentage = null;
    if (targetValue !== '') {
      targetPercentage = Number(targetValue);
      if (!Number.isFinite(targetPercentage) || targetPercentage < 0 || targetPercentage > 100) { setError('Target must be a percentage from 0 to 100, or left blank.'); return; }
    }
    const gradeBands = [];
    for (const band of bands) {
      const label = band.label.trim(), minimum = Number(band.minimum), maximum = Number(band.maximum);
      if (!label || band.minimum === '' || band.maximum === '' || !Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum < 0 || maximum > 100 || minimum > maximum) {
        setError('Each grade needs a label and a valid range between 0 and 100.'); return;
      }
      gradeBands.push({ label, minimum, maximum });
    }
    if (new Set(gradeBands.map(band => band.label.toLowerCase())).size !== gradeBands.length) { setError('Grade labels must be unique.'); return; }
    for (let i = 0; i < gradeBands.length; i++) for (let j = i + 1; j < gradeBands.length; j++) {
      if (gradeBands[i].minimum <= gradeBands[j].maximum && gradeBands[j].minimum <= gradeBands[i].maximum) { setError('Grade ranges cannot overlap.'); return; }
    }
    onSave({ targetPercentage, gradeBands });
  }
  return <><div className="section-title"><div><div className="eyebrow">YOUR PREFERENCES</div><h1>Settings</h1><p className="subheading">Set your own target and grade ranges for reports.</p></div></div><section className="panel settings-panel"><form onSubmit={submit}><div className="panel-heading"><div><h2>Personal target</h2><p>No value is assumed. Target status appears only after you configure one.</p></div></div><label className="field settings-target-field"><span>Target percentage</span><div className="target-input-wrap"><input aria-describedby="target-help" aria-invalid={!!error} inputMode="decimal" type="number" min="0" max="100" step="any" placeholder="Not configured" value={targetValue} onChange={event => setTargetValue(event.target.value)} /><span>%</span></div></label><p id="target-help" className="form-hint">This personal comparison target does not imply a college grading rule. Leave blank to clear it.</p><fieldset className="grade-band-picker"><legend>Your grade ranges (optional)</legend><p className="form-hint">Set labels and inclusive percentage ranges. Gaps are allowed and show as “No grade configured.”</p>{bands.map((band, index) => <div className="grade-band-row" key={index}><label><span>Label</span><input aria-label={`Grade label ${index + 1}`} value={band.label} onChange={event => setBands(current => current.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} placeholder="e.g. Distinction" /></label><label><span>Minimum %</span><input aria-label={`Minimum percentage for grade ${index + 1}`} type="number" min="0" max="100" step="any" value={band.minimum} onChange={event => setBands(current => current.map((item, i) => i === index ? { ...item, minimum: event.target.value } : item))} /></label><label><span>Maximum %</span><input aria-label={`Maximum percentage for grade ${index + 1}`} type="number" min="0" max="100" step="any" value={band.maximum} onChange={event => setBands(current => current.map((item, i) => i === index ? { ...item, maximum: event.target.value } : item))} /></label><button type="button" className="quiet-button" aria-label={`Remove grade range ${index + 1}`} onClick={() => setBands(current => current.filter((_, i) => i !== index))}>Remove</button></div>)}<button type="button" className="text-button add-grade-button" onClick={() => setBands(current => [...current, { label: '', minimum: '', maximum: '' }])}>+ Add grade range</button></fieldset>{error && <div role="alert" className="form-error">{error}</div>}<div className="settings-actions"><button className="button primary">Save settings</button></div></form></section></>;
}

function gradeFor(value, bands) {
  if (value == null || !Number.isFinite(value)) return 'Insufficient data';
  if (!bands?.length) return 'Not configured';
  return bands.find(band => value >= band.minimum && value <= band.maximum)?.label || 'No grade configured';
}

function Metric({ label, value, hint, icon, color }) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${color}`}>{icon}</span></div><div className="metric-value">{value}</div><div className="metric-hint">{hint}</div></div>; }
function Empty({ title, text, action, onClick }) { return <div className="empty-state"><div className="empty-art">✳</div><h3>{title}</h3><p>{text}</p>{action && <button className="text-button" onClick={onClick}>{action} <span>→</span></button>}</div>; }

function Modal({ type, data, result, subject, semester, onClose, onSemester, onEditSemester, onSubject, onEditSubject, onResult, onStructure, onSession, onCorrection }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => type === 'editSubject' ? { name: subject?.name || '', semesterId: subject?.semesterId || '' } : type === 'editSemester' ? { name: semester?.name || '' } : {});
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector('input:not([disabled]), select:not([disabled])')?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const structureSubjects = data.subjects.filter(subject => !subject.archived && subject.semesterId === form.semesterId);
  const selectedStructureSubjects = structureSubjects.filter(subject => (form.subjectIds || []).includes(subject.id));
  const structureTotal = selectedStructureSubjects.reduce((total, subject) => total + (Number(form.maxima?.[subject.id]) || 0), 0);
  const structureComplete = selectedStructureSubjects.length > 0 && selectedStructureSubjects.every(subject => Number.isFinite(Number(form.maxima?.[subject.id])) && Number(form.maxima?.[subject.id]) > 0);
  const title = type === 'semester' ? 'Add a semester' : type === 'editSemester' ? 'Edit semester' : type === 'subject' ? 'Add a subject' : type === 'editSubject' ? 'Edit subject' : type === 'correction' ? 'Correct saved marks' : type === 'structure' ? 'New exam structure' : type === 'session' ? 'Start exam session' : 'Record an assessment';
  function submit(e) {
    e.preventDefault(); setError('');
    if (type === 'semester') { if (!form.name?.trim()) return setError('Enter a semester name.'); onSemester(form.name); return; }
    if (type === 'editSemester') { if (!form.name?.trim()) return setError('Enter a semester name.'); onEditSemester({ id: semester.id, name: form.name }); return; }
    if (type === 'subject') { if (!form.name?.trim() || !form.semesterId) return setError('Enter a subject name and choose a semester.'); onSubject({ name: form.name.trim(), semesterId: form.semesterId }); return; }
    if (type === 'editSubject') { if (!form.name?.trim() || !form.semesterId) return setError('Enter a subject name and choose a semester.'); onEditSubject({ id: subject.id, name: form.name.trim(), semesterId: form.semesterId }); return; }
    if (type === 'structure') {
      if (!form.semesterId || !form.examName?.trim() || !form.assessmentType?.trim()) return setError('Choose a semester and enter the exam name and type.');
      if (!selectedStructureSubjects.length) return setError('Select at least one subject.');
      const subjects = selectedStructureSubjects.map(subject => ({ subjectId: subject.id, subjectNameSnapshot: subject.name, maximumMarks: Number(form.maxima?.[subject.id]) }));
      if (subjects.some(subject => !Number.isFinite(subject.maximumMarks) || subject.maximumMarks <= 0)) return setError('Enter an explicit maximum greater than zero for every selected subject.');
      onStructure({ semesterId: form.semesterId, examName: form.examName.trim(), assessmentType: form.assessmentType.trim(), subjects, totalMaximum: subjects.reduce((total, subject) => total + subject.maximumMarks, 0) }); return;
    }
    if (type === 'correction') {
      const obtained = Number(form.obtained);
      if (form.obtained === '' || !Number.isFinite(obtained) || obtained < 0 || obtained > result.maximum) return setError(`Obtained marks must be between zero and ${result.maximum}.`);
      onCorrection(result.id, obtained); return;
    }
    if (type === 'session') {
      const entries = [];
      for (const item of result.subjects) {
        const value = form.marks?.[item.subjectId] ?? '';
        if (value === '') {
          entries.push({ subjectId: item.subjectId, subjectNameSnapshot: item.subjectNameSnapshot, name: `${result.examName} · ${result.assessmentType}`, date: form.date || '', maximum: item.maximumMarks, obtained: '' });
          continue;
        }
        const obtained = Number(value);
        if (!isValidMarks(obtained, item.maximumMarks)) return setError(`${item.subjectNameSnapshot}: marks must be between zero and a valid maximum (${item.maximumMarks}).`);
        entries.push({ subjectId: item.subjectId, subjectNameSnapshot: item.subjectNameSnapshot, name: `${result.examName} · ${result.assessmentType}`, date: form.date || '', maximum: item.maximumMarks, obtained });
      }
      onSession({ semesterId: result.semesterId, structureId: result.id, structureSnapshot: JSON.parse(JSON.stringify(result)), examName: result.examName, assessmentType: result.assessmentType, date: form.date || '' }, entries); return;
    }
    const maximum = Number(form.maximum), obtained = Number(form.obtained);
    if (!form.subjectId || !form.name?.trim()) return setError('Choose a subject and enter an assessment name.');
    if (form.maximum === '' || !Number.isFinite(maximum) || maximum <= 0) return setError('Maximum marks must be a number greater than zero.');
    if (form.obtained === '' || !Number.isFinite(obtained) || obtained < 0 || obtained > maximum) return setError('Obtained marks must be between zero and the maximum.');
    onResult({ subjectId: form.subjectId, name: form.name.trim(), date: form.date || '', maximum, obtained });
  }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><div className="eyebrow">ACADEMIC LEDGER</div><h2 id="modal-title">{title}</h2></div><button className="close-button" aria-label="Close" onClick={onClose}>×</button></div><form onSubmit={submit}>
    {(type === 'semester' || type === 'editSemester') && <Field label="Semester name" placeholder="e.g. Semester 1, Fall 2026" value={form.name || ''} onChange={v => set('name', v)} autoFocus />}
    {(type === 'subject' || type === 'editSubject') && <><Field label="Subject name" placeholder="e.g. Data Structures" value={form.name || ''} onChange={v => set('name', v)} autoFocus /><label className="field"><span>Semester</span><select value={form.semesterId || ''} onChange={e => set('semesterId', e.target.value)}><option value="">Choose a semester</option>{data.semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label></>}
    {type === 'structure' && <><label className="field"><span>Semester</span><select value={form.semesterId || ''} onChange={e => { set('semesterId', e.target.value); set('subjectIds', []); set('maxima', {}); }}><option value="">Choose a semester</option>{data.semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><Field label="Exam name" placeholder="e.g. Midterm 1" value={form.examName || ''} onChange={v => set('examName', v)} /><Field label="Assessment type" placeholder="e.g. Unit Test, Practical, Final" value={form.assessmentType || ''} onChange={v => set('assessmentType', v)} /><div className="structure-picker"><span className="picker-label">Subjects and maximum marks</span>{structureSubjects.length ? structureSubjects.map(subject => { const selected = (form.subjectIds || []).includes(subject.id); return <div className="structure-pick-row" key={subject.id}><label><input type="checkbox" checked={selected} onChange={e => set('subjectIds', e.target.checked ? [...(form.subjectIds || []), subject.id] : (form.subjectIds || []).filter(id => id !== subject.id))} />{subject.name}</label>{selected && <input aria-label={`Maximum marks for ${subject.name}`} type="number" min="0" step="any" placeholder="Maximum" value={form.maxima?.[subject.id] ?? ''} onChange={e => set('maxima', { ...(form.maxima || {}), [subject.id]: e.target.value })} />}</div>; }) : <p className="form-hint">Choose a semester with active subjects.</p>}</div><div className="structure-total"><span>Total maximum</span><b>{structureComplete ? structureTotal : '—'}</b></div><p className="form-hint">Maximum marks are never assumed. Enter a value for each selected subject.</p></>}
    {type === 'session' && <><p className="form-hint">Using saved maxima from {result?.examName}. Leave marks blank when a result is not available yet.</p><Field label="Exam date (optional)" type="date" value={form.date || ''} onChange={v => set('date', v)} /><div className="session-entry-list">{result?.subjects.map(item => <div className="session-entry" key={item.subjectId}><label htmlFor={`session-mark-${item.subjectId}`}>{item.subjectNameSnapshot}<span>Maximum {item.maximumMarks}</span></label><input id={`session-mark-${item.subjectId}`} type="number" min="0" max={item.maximumMarks} step="any" placeholder="Leave blank" value={form.marks?.[item.subjectId] ?? ''} onChange={e => set('marks', { ...(form.marks || {}), [item.subjectId]: e.target.value })} /></div>)}</div></>}
    {type === 'result' && <><label className="field"><span>Subject</span><select value={form.subjectId || ''} onChange={e => set('subjectId', e.target.value)}><option value="">Choose a subject</option>{data.subjects.filter(s => !s.archived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><Field label="Assessment name or type" placeholder="e.g. Unit Test 1, Lab work" value={form.name || ''} onChange={v => set('name', v)} autoFocus /><div className="field-pair"><Field label="Obtained marks" type="number" min="0" step="any" placeholder="e.g. 42" value={form.obtained ?? ''} onChange={v => set('obtained', v)} /><Field label="Maximum marks" type="number" min="0" step="any" placeholder="Enter explicitly" value={form.maximum ?? ''} onChange={v => set('maximum', v)} /></div><Field label="Assessment date (optional)" type="date" value={form.date || ''} onChange={v => set('date', v)} /><p className="form-hint">Missing results aren’t counted as zero. Enter the maximum for this assessment.</p></>}
    {type === 'correction' && <><p className="form-hint">{result?.name}: current saved marks are {result?.obtained} / {result?.maximum}. A changed value is added to correction history.</p><Field label="Corrected obtained marks" type="number" min="0" max={result?.maximum} step="any" value={form.obtained ?? result?.obtained ?? ''} onChange={v => set('obtained', v)} autoFocus /></>}
    {error && <div role="alert" className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary">Save</button></div>
  </form></section></div>;
}
function Field({ label, onChange, ...props }) { return <label className="field"><span>{label}</span><input {...props} onChange={e => onChange(e.target.value)} /></label>; }

export default App;
