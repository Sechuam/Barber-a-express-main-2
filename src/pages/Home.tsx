import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Scissors, Star, Clock, ShieldCheck, ArrowRight, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import bannerImage from "@/assets/newbanner.jpeg";

interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  img?: string;
}

export default function Home() {
  const { isAdmin } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
        setServices(fetched.slice(0, 4)); // Only show top 4 for preview
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  const serviceImages = [
    "https://images.unsplash.com/photo-1621605815841-2dddb39742a3?q=80&w=400",
    "https://images.unsplash.com/photo-1599351431247-f57933847979?q=80&w=400",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400"
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImage}
            alt="Salon Interior"
            className="h-full w-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-6">
              Vicente <span className="text-stone-400 italic">Quesada González</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-300 mb-8 font-light leading-relaxed">
              En America Hair, no solo cortamos cabello. Creamos una experiencia de lujo personalizada para que luzcas y te sientas en tu mejor versión.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAdmin ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-amber-600 border border-stone-400 text-white hover:bg-amber-700 px-8 py-6 text-lg rounded-none transition-all pulse-amber">
                    Panel de Gestión
                  </Button>
                </Link>
              ) : (
                <Link to="/booking">
                  <Button size="lg" className="bg-white text-stone-900 hover:bg-stone-100 px-8 py-6 text-lg rounded-none">
                    Reservar Cita <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link to="/booking">
                <Button size="lg" className="bg-stone-900/40 border border-stone-400 text-white hover:bg-stone-800 hover:text-white px-8 py-6 text-lg rounded-none transition-all">
                  Ver Servicios
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-4">¿Por qué elegir Luxe Cut?</h2>
            <div className="h-1 w-20 bg-stone-900 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Scissors className="h-8 w-8" />,
                title: "Estilistas Expertos",
                desc: "Nuestro equipo cuenta con años de experiencia en las últimas tendencias y técnicas internacionales."
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: "Productos Premium",
                desc: "Utilizamos exclusivamente productos de las marcas más prestigiosas para el cuidado de tu cabello."
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Horario Flexible",
                desc: "Abierto de lunes a sábado con sistema de reserva online para tu mayor comodidad."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 border border-stone-100 bg-stone-50 text-center flex flex-col items-center"
              >
                <div className="mb-6 text-stone-900">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-stone-900">{feature.title}</h3>
                <p className="text-stone-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-4">Nuestros Servicios</h2>
              <p className="text-stone-600">Ofrecemos una amplia gama de servicios diseñados para satisfacer todas tus necesidades de estilismo y cuidado personal.</p>
            </div>
            <Link to="/booking" className="mt-4 md:mt-0">
              <Button variant="link" className="text-stone-900 font-bold p-0">Ver todos los precios →</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-stone-200 animate-pulse" />
              ))
            ) : services.length > 0 ? (
              services.map((service, i) => (
                <div key={service.id} className="group relative overflow-hidden">
                  <img
                    src={serviceImages[i % serviceImages.length]}
                    alt={service.name}
                    className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-lg font-bold">{service.name}</h4>
                    <p className="text-stone-200 mb-2">Desde {service.price}€</p>
                    <p className="text-xs text-stone-300 italic line-clamp-2">"{service.description}"</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-stone-400 italic">No hay servicios disponibles actualmente.</div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 mb-8">Encuéntranos en <span className="italic">Manzanilla</span></h2>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-stone-100 text-stone-900">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 mb-1">Nuestro Estilista</h3>
                    <p className="text-stone-600">Vicente Quesada González</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-stone-100 text-stone-900">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 mb-1">Teléfono</h3>
                    <p className="text-stone-600">675 01 02 74</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-stone-100 text-stone-900">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 mb-1">Dirección</h3>
                    <p className="text-stone-600">Calle Zalema, nº 6</p>
                    <p className="text-stone-600">Manzanilla (Huelva) 21890</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[400px] bg-stone-100 relative border border-stone-200">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Calle Zalema 6, Manzanilla, Huelva"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-6.442,37.388,-6.434,37.394&layer=mapnik&marker=37.3912,-6.4384"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-stone-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">¿Listo para un cambio?</h2>
          <p className="text-xl text-stone-400 mb-10 max-w-2xl mx-auto">
            Reserva tu cita hoy mismo y descubre por qué somos la peluquería de referencia en la ciudad.
          </p>
          <Link to="/booking">
            <Button size="lg" className="bg-white text-stone-900 hover:bg-stone-100 px-12 py-8 text-xl rounded-none">
              Reservar Ahora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
