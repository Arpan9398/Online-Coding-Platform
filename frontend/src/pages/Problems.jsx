import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth.jsx';

const LEVELS = ['All', 'Easy', 'Medium', 'Hard'];

export default function Problems() {
  const { user } = useAuth();
  const [problems, setProblems] = useState(null);
  const [error, setError] = useState('');
  const [level, setLevel] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/problems').then(setProblems).catch((e) => setError(e.message));
  }, [user]);

  const visible = useMemo(() => (problems ?? []).filter((p) =>
    (level === 'All' || p.difficulty === level) &&
    (p.title + ' ' + p.tags.join(' ')).toLowerCase().includes(query.trim().toLowerCase())), [problems, level, query]);

  const solved = (problems ?? []).filter((p) => p.status === 'solved').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Problems</h1>
          {user && problems && <p className="muted">{solved} of {problems.length} solved</p>}
        </div>
        <div className="filters">
          <input aria-label="Search problems" placeholder="Search title or tag" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="seg" role="group" aria-label="Difficulty">
            {LEVELS.map((l) => (
              <button key={l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {problems && (
        <div className="panel flush">
          {visible.length === 0 ? <p className="empty">No problems match your search.</p> : (
            <table>
              <thead><tr><th>Status</th><th>Title</th><th>Difficulty</th><th>Tags</th><th className="right">Points</th></tr></thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>{p.status === 'solved' ? <span className="badge ok">Solved</span>
                       : p.status === 'attempted' ? <span className="badge warn">Attempted</span> : <span className="muted">–</span>}</td>
                    <td><Link to={`/problems/${p.id}`} className="title-link">{p.title}</Link></td>
                    <td><span className={`diff ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span></td>
                    <td className="muted">{p.tags.join(', ')}</td>
                    <td className="right num">{user && p.bestScore > 0 ? `${p.bestScore} / ` : ''}{p.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
