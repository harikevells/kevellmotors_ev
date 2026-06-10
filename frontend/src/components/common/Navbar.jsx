import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationsMenu from './NotificationsMenu';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">⚡ Kevell Motors</Link>
        <ul className="navbar-nav">
          {user ? (
            <>
              {/* <li><Link to="/feed">Feed</Link></li> */}
              <li><Link to="/parts">Parts</Link></li>
              {user.role === 'admin' || user.role === 'franchise' ? (
                <li><Link to="/admin">Admin</Link></li>
              ) : (
                <li><Link to="/dashboard">Dashboard</Link></li>
              )}
              <li style={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsMenu />
              </li>
              <li style={{ marginLeft: '1rem' }}>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register" className="btn btn-primary btn-sm">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
