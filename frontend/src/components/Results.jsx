import { STATUS_LABEL } from '../api';

export default function Results({ outcome }) {
  const { kind, data } = outcome;
  const ok = data.status === 'ACCEPTED';
  return (
    <div className="results" aria-live="polite">
      <div className={'verdict ' + (ok ? 'good' : 'bad')}>
        <strong>{STATUS_LABEL[data.status] ?? data.status}</strong>
        <span>
          {data.passed} of {data.total} {kind === 'run' ? 'sample ' : ''}tests passed
          {kind === 'submit' && <> · Score {data.score} / {data.maxScore}</>}
          {data.runtimeMs ? <> · {data.runtimeMs} ms</> : null}
        </span>
      </div>
      {kind === 'run' && <p className="muted small-text">Sample run only. Nothing was saved or scored.</p>}
      <ul className="cases">
        {data.results.map((r) => (
          <li key={r.index} className={r.status === 'PASSED' ? 'pass' : 'fail'}>
            <details open={r.status !== 'PASSED' && !r.hidden}>
              <summary>
                <span className="case-name">{r.hidden ? 'Hidden test' : 'Test'} {r.index}</span>
                <span className="case-status">{STATUS_LABEL[r.status] ?? r.status}</span>
                <span className="muted num">{r.runtimeMs} ms</span>
              </summary>
              {!r.hidden && (
                <div className="io">
                  <div><span className="io-label">Input</span><pre>{r.input || '(empty)'}</pre></div>
                  <div><span className="io-label">Expected</span><pre>{r.expectedOutput}</pre></div>
                  <div><span className="io-label">Your output</span><pre>{r.actual || '(nothing printed)'}</pre></div>
                  {r.error && <div className="io-wide"><span className="io-label">Error</span><pre className="err">{r.error}</pre></div>}
                </div>
              )}
              {r.hidden && <p className="muted small-text">Hidden tests only show pass or fail.</p>}
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
