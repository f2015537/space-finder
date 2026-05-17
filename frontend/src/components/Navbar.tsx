import { NavLink } from "react-router-dom";
import "./Navbar.css";

interface NavbarProps {
  username?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function Navbar({ username, onLogin, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">Space Finder</NavLink>
      </div>
      <ul className="navbar-links">
        {username && (
          <>
            <li>
              <NavLink to="/spaces" end>Spaces</NavLink>
            </li>
            <li>
              <NavLink to="/spaces/create">Create Space</NavLink>
            </li>
            <li>
              <NavLink to="/profile">Profile</NavLink>
            </li>
          </>
        )}
      </ul>
      <div className="navbar-auth">
        {username ? (
          <>
            <span className="navbar-username">{username}</span>
            <button className="btn-logout" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button className="btn-login" onClick={onLogin}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
