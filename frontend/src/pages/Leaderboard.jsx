import { useEffect, useState } from 'react';
import { api, formatTime } from '../api';
import { useAuth } from '../auth.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/leaderboard').then(setRows).catch((e) => setError(e.message)); }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Leaderboard</h1>
          <p className="muted">Your best submission on each problem counts. Ties go to whoever reached the score first.</p>
        </div>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {rows && (
        <div className="panel flush">
          {rows.length === 0 ? <p className="empty">Nobody has submitted yet. Be the first.</p> : (
            <table>
              <thead><tr><th>Rank</th><th>Name</th><th className="right">Score</th><th className="right">Solved</th><th className="right">Last improved</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className={user?.id === r.userId ? 'me' : ''}>
                    <td className="num rank">{r.rank}</td>
                    <td>{r.name}{user?.id === r.userId && <span className="muted"> (you)</span>}</td>
                    <td className="right num"><strong>{r.totalScore}</strong></td>
                    <td className="right num">{r.solved}</td>
                    <td className="right muted nowrap">{formatTime(r.lastImprovement)}</td>
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
