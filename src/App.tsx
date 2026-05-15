import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Booking from "@/pages/Booking";
import Dashboard from "@/pages/Dashboard";

function Shell() {
  const { user, isAdmin } = useAuth();

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="container topbar__inner">
            <NavLink to="/" className="brand">
              America Hair
            </NavLink>
            <nav className="topbar__nav">
              <NavLink to="/" className="nav-link">
                Inicio
              </NavLink>
              <NavLink to="/booking" className="nav-link">
                Reservar
              </NavLink>
              {user ? (
                <>
                  <NavLink to="/dashboard" className="nav-link">
                    {isAdmin ? "Panel" : "Mis reservas"}
                  </NavLink>
                  <button className="nav-link nav-link--button" onClick={() => signOut(auth)} type="button">
                    Salir
                  </button>
                </>
              ) : (
                <NavLink to="/auth" className="nav-link">
                  Acceder
                </NavLink>
              )}
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
