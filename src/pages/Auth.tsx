import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AuthError,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "login" | "register";

function getFirebaseAuthMessage(error: unknown) {
  if (!(error instanceof AuthError)) {
    return "No se ha podido completar la autenticacion.";
  }

  switch (error.code) {
    case "auth/unauthorized-domain":
      return "Este dominio no esta autorizado en Firebase Auth. Si pruebas en local con 127.0.0.1, anadelo en Firebase Authentication > Settings > Authorized domains.";
    case "auth/operation-not-allowed":
      return "El acceso con Google no esta activado en Firebase Authentication.";
    case "auth/popup-blocked":
      return "El navegador ha bloqueado la ventana emergente de Google.";
    case "auth/popup-closed-by-user":
      return "Has cerrado la ventana de Google antes de terminar el acceso.";
    case "auth/account-exists-with-different-credential":
      return "Ese correo ya existe con otro metodo de acceso. Prueba a entrar con email y contrasena o vincular la cuenta.";
    default:
      return `Error de autenticacion: ${error.code}`;
  }
}

async function ensureUserProfile(user: { uid: string; email: string | null; displayName?: string | null }, name?: string) {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? "",
      displayName: name ?? user.displayName ?? "Cliente",
      role: "client",
      createdAt: new Date().toISOString(),
    });
  }
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(credentials.user);
      navigate(from, { replace: true });
    } catch (nextError) {
      setError("No se ha podido iniciar sesion. Revisa email y contrasena.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credentials.user, { displayName: name });
      await ensureUserProfile(credentials.user, name);
      setSuccess("Cuenta creada. Ya puedes gestionar tus reservas.");
      navigate(from, { replace: true });
    } catch (nextError) {
      setError("No se ha podido crear la cuenta. Si ese correo ya existia, entra con Google o inicia sesion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAccess() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const provider = new GoogleAuthProvider();
      const credentials = await signInWithPopup(auth, provider);
      await ensureUserProfile(credentials.user);
      navigate(from, { replace: true });
    } catch (nextError) {
      setError(getFirebaseAuthMessage(nextError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="container auth-layout">
        <div className="auth-copy">
          <span className="eyebrow">Acceso de clientes</span>
          <h1>Tu cita, controlada desde la web</h1>
          <p>
            Crea tu cuenta, entra y reserva sin llamar. Tu amigo podra ver las reservas en tiempo real desde su panel.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === "login" ? "tab-button active" : "tab-button"} onClick={() => setMode("login")} type="button">
              Entrar
            </button>
            <button
              className={mode === "register" ? "tab-button active" : "tab-button"}
              onClick={() => setMode("register")}
              type="button"
            >
              Crear cuenta
            </button>
          </div>

          {error ? <p className="message message--error">{error}</p> : null}
          {success ? <p className="message message--success">{success}</p> : null}

          {mode === "login" ? (
            <>
              <form className="stack" onSubmit={handleLogin}>
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" required />
                </label>
                <label className="field">
                  <span>Contrasena</span>
                  <input name="password" type="password" required />
                </label>
                <button className="button button--solid button--full" disabled={loading} type="submit">
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="auth-divider">
                <span>o</span>
              </div>

              <button className="button button--google button--full" disabled={loading} onClick={handleGoogleAccess} type="button">
                Entrar con Google
              </button>
            </>
          ) : (
            <>
              <form className="stack" onSubmit={handleRegister}>
                <label className="field">
                  <span>Nombre</span>
                  <input name="name" type="text" required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" required />
                </label>
                <label className="field">
                  <span>Contrasena</span>
                  <input name="password" type="password" minLength={6} required />
                </label>
                <button className="button button--solid button--full" disabled={loading} type="submit">
                  {loading ? "Creando..." : "Crear cuenta"}
                </button>
              </form>

              <div className="auth-divider">
                <span>o</span>
              </div>

              <button className="button button--google button--full" disabled={loading} onClick={handleGoogleAccess} type="button">
                Continuar con Google
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
