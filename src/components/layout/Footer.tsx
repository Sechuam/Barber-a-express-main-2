import { Scissors, Instagram, Facebook, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

interface Service {
  id: string;
  name: string;
}

export default function Footer() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function fetchServices() {
      try {
        const q = query(collection(db, "services"), limit(5));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })) as Service[];
        setServices(fetched);
      } catch (error) {
        console.error("Error fetching services for footer:", error);
      }
    }
    fetchServices();
  }, []);

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-6 w-6 text-white" />
              <span className="text-xl font-serif font-bold tracking-tight text-white">
                LUXE CUT
              </span>
            </div>
            <p className="text-sm max-w-xs">
              Elevando el arte de la peluquería. Experiencias personalizadas y estilos que definen tu personalidad.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm">
              {services.length > 0 ? (
                services.map(s => (
                  <li key={s.id}>{s.name}</li>
                ))
              ) : (
                <>
                  <li>Corte Caballero</li>
                  <li>Barba & Ritual</li>
                  <li>Coloración</li>
                  <li>Tratamiento de Keratina</li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li className="font-bold text-white">Vicente Quesada González</li>
              <li>675 01 02 74</li>
              <li>Calle Zalema, nº 6</li>
              <li>Manzanilla (Huelva) 21890</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <Instagram className="h-5 w-5 cursor-pointer hover:text-white transition-colors" />
              <Facebook className="h-5 w-5 cursor-pointer hover:text-white transition-colors" />
              <Twitter className="h-5 w-5 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-stone-800 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Luxe Cut & Style. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
