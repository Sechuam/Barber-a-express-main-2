import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentItem {
  id: string;
  userId: string;
  userEmail: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  price: number;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [userAppointments, setUserAppointments] = useState<AppointmentItem[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAppointments() {
    if (!user) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ownSnapshot = await getDocs(query(collection(db, "appointments"), where("userId", "==", user.uid)));
      setUserAppointments(
        (ownSnapshot.docs.map((nextDoc) => ({
          id: nextDoc.id,
          ...nextDoc.data(),
        })) as AppointmentItem[]).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
      );

      if (isAdmin) {
        const allSnapshot = await getDocs(collection(db, "appointments"));
        setAllAppointments(
          (allSnapshot.docs.map((nextDoc) => ({
            id: nextDoc.id,
            ...nextDoc.data(),
          })) as AppointmentItem[]).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
        );
      } else {
        setAllAppointments([]);
      }
    } catch (nextError) {
      setError("No se han podido cargar las reservas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAppointments();
  }, [user, isAdmin]);

  const groupedAdminAppointments = useMemo(() => {
    return allAppointments.reduce<Record<string, AppointmentItem[]>>((acc, item) => {
      const day = item.date.slice(0, 10);
      acc[day] = acc[day] ? [...acc[day], item] : [item];
      return acc;
    }, {});
  }, [allAppointments]);

  async function handleStatus(id: string, status: string) {
    setMessage("");
    setError("");
    try {
      await updateDoc(doc(db, "appointments", id), { status });
      setMessage("Reserva actualizada.");
      await loadAppointments();
    } catch (nextError) {
      setError("No se ha podido actualizar la reserva.");
    }
  }

  async function handleDelete(id: string) {
    setMessage("");
    setError("");
    try {
      await deleteDoc(doc(db, "appointments", id));
      setMessage("Reserva eliminada.");
      await loadAppointments();
    } catch (nextError) {
      setError("No se ha podido eliminar la reserva.");
    }
  }

  return (
    <section className="page-section">
      <div className="container page-layout">
        <div className="section__heading">
          <span className="eyebrow">{isAdmin ? "Panel del peluquero" : "Mis reservas"}</span>
          <h1>{isAdmin ? "Gestiona citas y clientes" : "Consulta tus proximas citas"}</h1>
          <p>Desde aqui puedes revisar las reservas guardadas en Firebase y actuar sobre ellas.</p>
        </div>

        {error ? <p className="message message--error">{error}</p> : null}
        {message ? <p className="message message--success">{message}</p> : null}

        {loading ? (
          <div className="page-state">
            <div className="spinner" />
            <p>Cargando reservas...</p>
          </div>
        ) : (
          <>
            <div className="panel">
              <h2 className="panel-title">Tus reservas</h2>
              {userAppointments.length === 0 ? (
                <p>No tienes reservas todavia.</p>
              ) : (
                <div className="table-list">
                  {userAppointments.map((item) => (
                    <article key={item.id} className="appointment-row">
                      <div>
                        <strong>{item.serviceName}</strong>
                        <p>
                          {item.date.slice(0, 10)} a las {item.time}
                        </p>
                      </div>
                      <span className={`status-badge status-${item.status}`}>{item.status}</span>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {isAdmin ? (
              <div className="panel">
                <h2 className="panel-title">Todas las reservas</h2>
                {Object.keys(groupedAdminAppointments).length === 0 ? (
                  <p>No hay reservas registradas.</p>
                ) : (
                  <div className="stack">
                    {Object.entries(groupedAdminAppointments).map(([day, items]) => (
                      <section key={day} className="day-group">
                        <h3>{day}</h3>
                        <div className="table-list">
                          {items.map((item) => (
                            <article key={item.id} className="appointment-row appointment-row--admin">
                              <div>
                                <strong>{item.serviceName}</strong>
                                <p>
                                  {item.time} · {item.userEmail} · {item.price} EUR
                                </p>
                              </div>
                              <div className="row-actions">
                                <span className={`status-badge status-${item.status}`}>{item.status}</span>
                                <button className="mini-button" onClick={() => handleStatus(item.id, "confirmed")} type="button">
                                  Confirmar
                                </button>
                                <button className="mini-button" onClick={() => handleStatus(item.id, "cancelled")} type="button">
                                  Cancelar
                                </button>
                                <button className="mini-button mini-button--danger" onClick={() => handleDelete(item.id)} type="button">
                                  Borrar
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
