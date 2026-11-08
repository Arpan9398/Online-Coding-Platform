import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Admin() {
  const [problems, setProblems] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get('/problems').then(setProblems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}" and all submissions for it? This cannot be undone.`)) return;
    try { await api.del(`/problems/${p.id}`); load(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <h1>Manage problems</h1>
        <Link className="btn primary" to="/admin/problems/new">New problem</Link>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {problems && (
        <div className="panel flush">
          <table>
            <thead><tr><th>Title</th><th>Difficulty</th><th className="right">Points</th><th /></tr></thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id}>
                  <td><Link className="title-link" to={`/problems/${p.id}`}>{p.title}</Link></td>
                  <td><span className={`diff ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span></td>
                  <td className="right num">{p.points}</td>
                  <td className="right nowrap">
                    <Link className="link" to={`/admin/problems/${p.id}`}>Edit</Link>
                    <button className="link danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
