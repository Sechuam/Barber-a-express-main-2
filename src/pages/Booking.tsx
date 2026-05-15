import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  category?: string;
}

const FALLBACK_SERVICES: ServiceItem[] = [
  {
    id: "corte-cab",
    name: "Corte caballero",
    price: 14,
    duration: "30 min",
    description: "Corte clasico, rapido y limpio.",
    category: "Corte",
  },
  {
    id: "barba",
    name: "Barba y perfilado",
    price: 10,
    duration: "20 min",
    description: "Perfilado y acabado cuidado.",
    category: "Barba",
  },
  {
    id: "corte-barba",
    name: "Corte + barba",
    price: 20,
    duration: "50 min",
    description: "Servicio completo para salir listo.",
    category: "Combo",
  },
];

const TIME_SLOTS = [
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

function formatDayValue(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function toInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function Booking() {
  const { user, isAdmin } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(toInputValue(new Date()));
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      try {
        const snapshot = await getDocs(collection(db, "services"));

        if (snapshot.empty) {
          if (isAdmin) {
            await Promise.all(
              FALLBACK_SERVICES.map((service) =>
                setDoc(doc(db, "services", service.id), {
                  name: service.name,
                  price: service.price,
                  duration: service.duration,
                  description: service.description,
                  category: service.category ?? "",
                }),
              ),
            );
          }

          setServices(FALLBACK_SERVICES);
          setSelectedServiceId(FALLBACK_SERVICES[0]?.id ?? "");
          return;
        }

        const nextServices = snapshot.docs.map((nextDoc) => ({
          id: nextDoc.id,
          ...nextDoc.data(),
        })) as ServiceItem[];
        setServices(nextServices);
        setSelectedServiceId(nextServices[0]?.id ?? "");
      } catch (nextError) {
        setError("No se han podido cargar los servicios.");
      } finally {
        setLoadingServices(false);
      }
    }

    void loadServices();
  }, [isAdmin]);

  useEffect(() => {
    async function loadBookedSlots() {
      setLoadingSlots(true);
      setError("");

      try {
        const normalized = formatDayValue(new Date(selectedDate));
        const snapshot = await getDocs(collection(db, "appointments"));
        setBookedSlots(
          snapshot.docs
            .map((nextDoc) => nextDoc.data())
            .filter((item) => item.date === normalized && item.status === "confirmed")
            .map((item) => String(item.time ?? "")),
        );
      } catch (nextError) {
        setError("No se han podido consultar las horas ocupadas.");
      } finally {
        setLoadingSlots(false);
      }
    }

    void loadBookedSlots();
  }, [selectedDate]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !selectedService || !selectedTime) {
      setError("Completa servicio, dia y hora para confirmar la reserva.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const normalized = formatDayValue(new Date(selectedDate));
      const existing = await getDocs(collection(db, "appointments"));
      const collision = existing.docs.some((nextDoc) => {
        const data = nextDoc.data();
        return data.date === normalized && data.time === selectedTime && data.status === "confirmed";
      });

      if (collision) {
        setError("Esa hora acaba de ocuparse. Elige otra.");
        setBookedSlots((current) => Array.from(new Set([...current, selectedTime])));
        setSelectedTime("");
        return;
      }

      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        userEmail: user.email ?? "",
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: normalized,
        time: selectedTime,
        status: "confirmed",
        paymentStatus: "at_salon",
        price: selectedService.price,
        createdAt: serverTimestamp(),
      });

      setMessage("Reserva creada correctamente.");
      setBookedSlots((current) => Array.from(new Set([...current, selectedTime])));
      setSelectedTime("");
    } catch (nextError) {
      setError("No se ha podido guardar la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <div className="container page-layout">
        <div className="section__heading">
          <span className="eyebrow">Reservas</span>
          <h1>Elige servicio, dia y hora</h1>
          <p>La reserva se guarda en Firestore y el peluquero la vera en su panel al instante.</p>
        </div>

        <div className="booking-layout">
          <form className="panel stack" onSubmit={handleSubmit}>
            {error ? <p className="message message--error">{error}</p> : null}
            {message ? <p className="message message--success">{message}</p> : null}

            <label className="field">
              <span>Servicio</span>
              <select value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)}>
                {loadingServices ? <option>Cargando servicios...</option> : null}
                {!loadingServices
                  ? services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.price} EUR
                      </option>
                    ))
                  : null}
              </select>
            </label>

            <label className="field">
              <span>Dia</span>
              <input min={toInputValue(new Date())} type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>

            <div className="field">
              <span>Hora</span>
              <div className="slot-grid">
                {TIME_SLOTS.map((slot) => {
                  const disabled = loadingSlots || bookedSlots.includes(slot);
                  const active = selectedTime === slot;

                  return (
                    <button
                      key={slot}
                      className={active ? "slot-button active" : "slot-button"}
                      disabled={disabled}
                      onClick={() => setSelectedTime(slot)}
                      type="button"
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <button className="button button--solid button--full" disabled={!selectedService || !selectedTime || submitting} type="submit">
              {submitting ? "Guardando..." : "Confirmar reserva"}
            </button>
          </form>

          <aside className="panel booking-summary">
            <span className="eyebrow">Resumen</span>
            <h2>{selectedService?.name ?? "Sin servicio"}</h2>
            <p>{selectedService?.description ?? "Elige un servicio para ver los detalles."}</p>
            <ul className="summary-list">
              <li>
                <strong>Duracion:</strong> {selectedService?.duration ?? "-"}
              </li>
              <li>
                <strong>Precio:</strong> {selectedService ? `${selectedService.price} EUR` : "-"}
              </li>
              <li>
                <strong>Dia:</strong> {selectedDate || "-"}
              </li>
              <li>
                <strong>Hora:</strong> {selectedTime || "-"}
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
