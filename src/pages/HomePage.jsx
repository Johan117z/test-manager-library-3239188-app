import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { navFor } from '../navigation.js';

export default function HomePage() {
  const { session } = useAuth();
  const links = navFor(session.role).filter((item) => item.to !== '/');
  return (
    <div className="card">
      <h1>Welcome, {session.username}</h1>
      <p className="muted">Signed in as {session.role}.</p>
      {links.length > 0 && (
        <ul className="quick-links">
          {links.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>{item.label}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
