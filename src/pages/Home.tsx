import { Link } from "react-router-dom";
import heroImage from "@/assets/newbanner.jpeg";
import { useAuth } from "@/contexts/AuthContext";

const services = [
  {
    name: "Corte clasico",
    description: "Corte limpio y preciso para el dia a dia.",
  },
  {
    name: "Barba y perfilado",
    description: "Definicion cuidada para una imagen impecable.",
  },
  {
    name: "Cambio de look",
    description: "Asesoramiento y estilo para renovar tu imagen.",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="site-shell">
      <section className="hero">
        <div className="hero__media">
          <img src={heroImage} alt="Interior de la peluqueria" />
        </div>
        <div className="hero__overlay" />
        <div className="hero__content">
          <span className="eyebrow">Peluqueria en Manzanilla</span>
          <h1>America Hair</h1>
          <p>
            Reserva tu cita online y deja que Vicente gestione sus horas desde un panel sencillo. Todo montado sobre
            Firebase para que tu amigo tenga una web estable.
          </p>
          <div className="hero__actions">
            <Link className="button button--solid" to={user ? "/booking" : "/auth"}>
              {user ? "Reservar ahora" : "Entrar para reservar"}
            </Link>
            <a className="button button--ghost" href="tel:+34675010274">
              Llamar al salon
            </a>
          </div>
        </div>
      </section>

      <main>
        <section className="section section--light">
          <div className="container">
            <div className="section__heading">
              <span className="eyebrow">Servicios</span>
              <h2>Reserva sin llamadas ni lios</h2>
              <p>Los clientes eligen servicio, dia y hora. El peluquero ve todo en un panel propio.</p>
            </div>
            <div className="cards">
              {services.map((service) => (
                <article key={service.name} className="card">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--dark">
          <div className="container split">
            <div>
              <span className="eyebrow">Horarios</span>
              <h2>Turnos claros y faciles de gestionar</h2>
              <ul className="list">
                <li>Lunes a viernes: 09:30 - 13:30 / 16:30 - 20:30</li>
                <li>Sabado: 09:30 - 14:00</li>
                <li>Domingo: cerrado</li>
              </ul>
            </div>
            <div className="panel">
              <span className="eyebrow">Contacto</span>
              <h2>America Hair</h2>
              <p>Vicente Quesada Gonzalez</p>
              <p>Calle Zalema, numero 6</p>
              <p>Manzanilla (Huelva) 21890</p>
              <a className="phone-link" href="tel:+34675010274">
                675 01 02 74
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
