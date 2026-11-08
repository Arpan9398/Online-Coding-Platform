import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Admin from './pages/Admin.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Login from './pages/Login.jsx';
import Problem from './pages/Problem.jsx';
import ProblemForm from './pages/ProblemForm.jsx';
import Problems from './pages/Problems.jsx';

function Guard({ admin, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/problems" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="top">
        <div className="top-in">
          <Link to="/problems" className="logo">CodeArena</Link>
          <nav aria-label="Main">
            <NavLink to="/problems">Problems</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin">Manage problems</NavLink>}
          </nav>
          <div className="who">
            {user ? (
              <>
                <span>{user.name}</span>
                <button className="btn small" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link className="btn small" to="/login">Sign in</Link>
                <Link className="btn small primary" to="/register">Create account</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/problems" replace />} />
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/register" element={<Login mode="register" />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:id" element={<Problem />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="/admin/problems/new" element={<Guard admin><ProblemForm /></Guard>} />
          <Route path="/admin/problems/:id" element={<Guard admin><ProblemForm /></Guard>} />
          <Route path="*" element={<p className="empty">Page not found. <Link to="/problems">Back to problems</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
