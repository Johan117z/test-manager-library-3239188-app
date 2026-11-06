import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Route guard: no session -> login page; role not in `roles` -> "not allowed" message.
export default function RequireAuth({ roles, children }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(session.role)) {
    return (
      <div className="card">
        <h1>Not allowed</h1>
        <p>Your role ({session.role}) cannot open this page.</p>
      </div>
    );
  }
  return children;
}
