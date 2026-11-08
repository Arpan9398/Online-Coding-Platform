import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatTime, STATUS_LABEL } from '../api';
import { useAuth } from '../auth.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import Results from '../components/Results.jsx';

const FALLBACK = { python: '# Write your solution here\n', javascript: '// Write your solution here\n' };

export default function Problem() {
  const { id } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('python');
  const [codes, setCodes] = useState({ python: '', javascript: '' });
  const [busy, setBusy] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setProblem(null); setOutcome(null); setError('');
    api.get(`/problems/${id}`).then((p) => {
      setProblem(p);
      setCodes({ python: p.starterCode.python || FALLBACK.python, javascript: p.starterCode.javascript || FALLBACK.javascript });
    }).catch((e) => setError(e.message));
  }, [id]);

  const loadHistory = () => user && api.get(`/problems/${id}/submissions`).then(setHistory).catch(() => {});
  useEffect(() => { loadHistory(); }, [id, user]);

  const act = async (kind) => {
    setBusy(kind); setError('');
    try {
      const data = await api.post(`/problems/${id}/${kind}`, { language, code: codes[language] });
      setOutcome({ kind, data });
      if (kind === 'submit') loadHistory();
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  if (error && !problem) return <div className="error" role="alert">{error} <Link to="/problems">Back to problems</Link></div>;
  if (!problem) return <p className="muted">Loading problem…</p>;

  return (
    <div className="split">
      <section className="statement panel">
        <p className="crumb"><Link to="/problems">← All problems</Link></p>
        <h1>{problem.title}</h1>
        <p className="meta">
          <span className={`diff ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
          <span>{problem.points} points</span>
          <span>{problem.timeLimitMs / 1000}s time limit</span>
        </p>
        <div className="desc">{problem.description}</div>
        {problem.sampleCases.map((c, i) => (
          <div className="sample" key={i}>
            <h3>Example {i + 1}</h3>
            <div className="io">
              <div><span className="io-label">Input</span><pre>{c.input || '(empty)'}</pre></div>
              <div><span className="io-label">Output</span><pre>{c.expectedOutput}</pre></div>
            </div>
          </div>
        ))}
        {problem.hiddenCount > 0 && <p className="muted small-text">{problem.hiddenCount} more hidden tests are used when you submit.</p>}
      </section>

      <section className="workspace">
        <div className="panel">
          <div className="bar">
            <label className="inline">Language
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node.js)</option>
              </select>
            </label>
            <div className="bar-actions">
              <button className="btn" disabled={!user || Boolean(busy)} onClick={() => act('run')}>{busy === 'run' ? 'Running…' : 'Run samples'}</button>
              <button className="btn primary" disabled={!user || Boolean(busy)} onClick={() => act('submit')}>{busy === 'submit' ? 'Judging…' : 'Submit'}</button>
            </div>
          </div>
          <CodeEditor value={codes[language]} onChange={(v) => setCodes({ ...codes, [language]: v })} label={`${language} code`} />
          {!user && <p className="notice"><Link to="/login" state={{ from: `/problems/${id}` }}>Sign in</Link> to run and submit your code.</p>}
          {error && <div className="error" role="alert">{error}</div>}
        </div>

        {outcome && <div className="panel"><Results outcome={outcome} /></div>}

        {user && history.length > 0 && (
          <div className="panel">
            <h2>Your submissions</h2>
            <table>
              <thead><tr><th>When</th><th>Language</th><th>Result</th><th className="right">Score</th><th /></tr></thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id}>
                    <td className="nowrap">{formatTime(s.createdAt)}</td>
                    <td>{s.language === 'python' ? 'Python' : 'JavaScript'}</td>
                    <td><span className={'badge ' + (s.status === 'ACCEPTED' ? 'ok' : 'bad')}>{STATUS_LABEL[s.status] ?? s.status}</span> <span className="muted num">{s.passed}/{s.total}</span></td>
                    <td className="right num">{s.score}</td>
                    <td className="right"><button className="link" onClick={() => { setLanguage(s.language); setCodes({ ...codes, [s.language]: s.code }); }}>Load code</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
