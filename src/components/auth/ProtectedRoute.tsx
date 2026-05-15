import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShowHelp(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-900 border-t-transparent mb-6"></div>
        {showHelp && (
          <div className="max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-stone-600 mb-4">Parece que está tardando más de lo normal.</p>
            <p className="text-sm text-stone-500">
              Si estás usando Safari o iOS, tu navegador podría estar bloqueando cookies de seguridad necesarias para iniciar sesión.
            </p>
            <p className="text-sm font-bold text-stone-900 mt-4">
              Prueba a abrir la aplicación en una pestaña nueva usando el botón con la flecha en la esquina superior derecha.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
