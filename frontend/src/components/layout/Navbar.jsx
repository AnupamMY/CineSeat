import { Clapperboard, LogOut, Ticket, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
export function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <Link className="brand" to="/">
        <span>
          <Clapperboard size={20} />
        </span>
        CineSeat
      </Link>
      <nav>
        <NavLink to="/">Movies</NavLink>
        {user && (
          <NavLink to="/bookings">
            <Ticket size={16} />
            My tickets
          </NavLink>
        )}
        {user?.role === "ADMIN" && <NavLink to="/admin">Admin</NavLink>}
        {user ? (
          <button className="ghost" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        ) : (
          <Link className="login-link" to="/login">
            <UserRound size={16} />
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
export function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <footer>© 2026 CineSeat · Great stories deserve great seats.</footer>
    </>
  );
}
