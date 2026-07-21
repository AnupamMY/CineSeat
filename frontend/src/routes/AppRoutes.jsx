import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader } from "../components/common/UI";
import HomePage from "../pages/user/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import MovieDetailsPage from "../pages/user/MovieDetailsPage";
import SeatSelectionPage from "../pages/user/SeatSelectionPage";
import BookingConfirmationPage from "../pages/user/BookingConfirmationPage";
import MyBookingsPage from "../pages/user/MyBookingsPage";
import TicketPage from "../pages/user/TicketPage";
import AdminPage from "../pages/admin/AdminPage";
function Guard({ admin = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
      <Route
        path="/shows/:showId/seats"
        element={
          <Guard>
            <SeatSelectionPage />
          </Guard>
        }
      />
      <Route
        path="/booking/confirm"
        element={
          <Guard>
            <BookingConfirmationPage />
          </Guard>
        }
      />
      <Route
        path="/bookings"
        element={
          <Guard>
            <MyBookingsPage />
          </Guard>
        }
      />
      <Route
        path="/tickets/:bookingId"
        element={
          <Guard>
            <TicketPage />
          </Guard>
        }
      />
      <Route
        path="/admin"
        element={
          <Guard admin>
            <AdminPage />
          </Guard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
