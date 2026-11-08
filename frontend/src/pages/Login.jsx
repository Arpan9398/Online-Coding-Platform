import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login({ mode }) {
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  if (user) return <Navigate to={location.state?.from || '/problems'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authenticate(mode, register ? form : { email: form.email, password: form.password });
      navigate(location.state?.from || '/problems', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <form className="auth-card" onSubmit={submit} noValidate>
      <h1>{register ? 'Create your account' : 'Sign in'}</h1>
      <p className="muted">{register ? 'Solve problems, earn points and climb the leaderboard.' : 'Welcome back. Pick up where you left off.'}</p>
      {error && <div className="error" role="alert">{error}</div>}
      {register && <label>Name<input value={form.name} onChange={set('name')} autoComplete="name" required /></label>}
      <label>Email<input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></label>
      <label>Password<input type="password" value={form.password} onChange={set('password')}
                            autoComplete={register ? 'new-password' : 'current-password'} required />
        {register && <span className="hint">At least 8 characters.</span>}
      </label>
      <button className="btn primary block" disabled={busy}>{register ? 'Create account' : 'Sign in'}</button>
      <p className="muted center">
        {register ? <>Already registered? <Link to="/login" state={location.state}>Sign in</Link></>
                  : <>New here? <Link to="/register" state={location.state}>Create an account</Link></>}
      </p>
    </form>
  );
}
