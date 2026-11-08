import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

const BLANK = {
  title: '', description: '', difficulty: 'Easy', points: 100, timeLimitMs: 2000, tags: '',
  starterPython: '', starterJavascript: '',
  testCases: [{ input: '', expectedOutput: '', isHidden: false }]
};

export default function ProblemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    api.get(`/problems/${id}/admin`).then((p) => setForm({
      title: p.title, description: p.description, difficulty: p.difficulty, points: p.points,
      timeLimitMs: p.timeLimitMs, tags: p.tags.join(', '),
      starterPython: p.starterCode?.python || '', starterJavascript: p.starterCode?.javascript || '',
      testCases: p.testCases
    })).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setCase = (i, patch) => setForm({ ...form, testCases: form.testCases.map((t, n) => (n === i ? { ...t, ...patch } : t)) });
  const addCase = () => setForm({ ...form, testCases: [...form.testCases, { input: '', expectedOutput: '', isHidden: true }] });
  const removeCase = (i) => setForm({ ...form, testCases: form.testCases.filter((_, n) => n !== i) });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const body = {
      title: form.title, description: form.description, difficulty: form.difficulty,
      points: Number(form.points), timeLimitMs: Number(form.timeLimitMs),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      starterCode: { python: form.starterPython, javascript: form.starterJavascript },
      testCases: form.testCases
    };
    try {
      if (id) await api.put(`/problems/${id}`, body); else await api.post('/problems', body);
      navigate('/admin');
    } catch (err) { setError(err.message); setBusy(false); }
  };

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <form onSubmit={submit} noValidate>
      <div className="page-head">
        <h1>{id ? 'Edit problem' : 'New problem'}</h1>
        <div className="bar-actions">
          <button type="button" className="btn" onClick={() => navigate('/admin')}>Cancel</button>
          <button className="btn primary" disabled={busy}>{id ? 'Save changes' : 'Create problem'}</button>
        </div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}

      <div className="panel">
        <label>Title<input value={form.title} onChange={set('title')} /></label>
        <label>Description
          <textarea rows={8} value={form.description} onChange={set('description')}
                    placeholder="Explain the task, then describe the input and output format." />
        </label>
        <div className="row4">
          <label>Difficulty
            <select value={form.difficulty} onChange={set('difficulty')}><option>Easy</option><option>Medium</option><option>Hard</option></select>
          </label>
          <label>Points<input type="number" min="1" max="1000" value={form.points} onChange={set('points')} /></label>
          <label>Time limit (ms)<input type="number" min="500" max="10000" step="100" value={form.timeLimitMs} onChange={set('timeLimitMs')} /></label>
          <label>Tags (comma separated)<input value={form.tags} onChange={set('tags')} placeholder="arrays, math" /></label>
        </div>
      </div>

      <div className="panel">
        <h2>Starter code (optional)</h2>
        <div className="row2">
          <label>Python<textarea className="mono" rows={5} value={form.starterPython} onChange={set('starterPython')} /></label>
          <label>JavaScript<textarea className="mono" rows={5} value={form.starterJavascript} onChange={set('starterJavascript')} /></label>
        </div>
      </div>

      <div className="panel">
        <h2>Test cases</h2>
        <p className="muted small-text">Programs read the input from stdin and print the answer. Trailing spaces and blank lines are ignored when comparing. Visible cases are shown to students as examples; hidden cases only report pass or fail. Keep at least one visible case.</p>
        {form.testCases.map((t, i) => (
          <div className="case-row" key={i}>
            <label>Input<textarea className="mono" rows={3} value={t.input} onChange={(e) => setCase(i, { input: e.target.value })} /></label>
            <label>Expected output<textarea className="mono" rows={3} value={t.expectedOutput} onChange={(e) => setCase(i, { expectedOutput: e.target.value })} /></label>
            <div className="case-side">
              <label className="check"><input type="checkbox" checked={t.isHidden} onChange={(e) => setCase(i, { isHidden: e.target.checked })} /> Hidden</label>
              <button type="button" className="link danger" disabled={form.testCases.length === 1} onClick={() => removeCase(i)}>Remove</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn" onClick={addCase}>Add test case</button>
      </div>
    </form>
  );
}
