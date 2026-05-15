import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Scissors, CheckCircle2, AlertCircle, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, setDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
}

const INITIAL_SERVICES = [
  { id: "corte-cab", name: "Corte Caballero", price: 25, duration: "30 min", category: "Corte" },
  { id: "corte-dam", name: "Corte Dama", price: 35, duration: "45 min", category: "Corte" },
  { id: "barba", name: "Barba & Ritual", price: 15, duration: "20 min", category: "Barba" },
  { id: "color", name: "Coloración", price: 45, duration: "60 min", category: "Color" },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
];

export default function Booking() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, isAdmin } = useAuth();

  // Fetch or Seed Services
  useEffect(() => {
    async function getServices() {
      const path = "services";
      try {
        const q = query(collection(db, path));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty && isAdmin) {
          // Seed initial services if none exist
          for (const s of INITIAL_SERVICES) {
            await setDoc(doc(db, "services", s.id), {
              name: s.name,
              price: s.price,
              duration: s.duration,
              category: s.category,
              description: `Experiencia premium de ${s.name.toLowerCase()}.`
            });
          }
          setServices(INITIAL_SERVICES as any);
        } else {
          const fetched = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Service[];
          setServices(fetched);
        }
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setLoadingServices(false);
      }
    }
    getServices();
  }, [isAdmin]);

  // Fetch booked slots when date changes
  useEffect(() => {
    async function fetchBookedSlots() {
      if (!date) return;
      
      setLoadingSlots(true);
      const path = "appointments";
      try {
        // We store the date as start of day ISO string to simplify queries
        const dayStr = startOfDay(date).toISOString();
        const q = query(
          collection(db, path),
          where("date", "==", dayStr),
          where("status", "==", "confirmed")
        );
        
        const querySnapshot = await getDocs(q);
        const booked = querySnapshot.docs.map(doc => doc.data().time);
        setBookedSlots(booked);
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchBookedSlots();
  }, [date]);

  const handleConfirmBooking = async () => {
    if (!selectedService || !date || !selectedTime) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (!user) {
      toast.error("Por favor inicia sesión para reservar");
      window.location.href = "/auth";
      return;
    }

    setIsProcessing(true);
    const path = "appointments";
    
    try {
      // 0. Double check if slot is still available
      const dayStr = startOfDay(date).toISOString();
      const checkQ = query(
        collection(db, path),
        where("date", "==", dayStr),
        where("time", "==", selectedTime),
        where("status", "==", "confirmed")
      );
      
      const checkSnapshot = await getDocs(checkQ);
      if (!checkSnapshot.empty) {
        toast.error("Lo sentimos, esta hora acaba de ser reservada por otra persona.");
        // Refresh booked slots and go back to step 2
        const booked = bookedSlots;
        if (!booked.includes(selectedTime)) {
             setBookedSlots([...booked, selectedTime]);
        }
        setSelectedTime(null);
        setStep(2);
        setIsProcessing(false);
        return;
      }

      // 1. Save Appointment to Firestore
      try {
        await addDoc(collection(db, path), {
          userId: user.uid,
          userEmail: user.email,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          date: dayStr, // Store normalized date
          time: selectedTime,
          status: "confirmed",
          paymentStatus: "at_salon",
          price: selectedService.price,
          createdAt: serverTimestamp(),
        });
        
        toast.success("¡Reserva realizada con éxito!");
        setStep(4);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } catch (error: any) {
      toast.error("Error al procesar reserva: " + error.message);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">Reserva tu Experiencia</h1>
          <p className="text-stone-600">Sigue los pasos para agendar tu cita en Luxe Cut.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-200 -z-10 -translate-y-1/2" />
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                step >= s ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-400"
              )}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Selecciona un Servicio</CardTitle>
                    <CardDescription>Elige el tratamiento que deseas recibir.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4">
                    {loadingServices ? (
                      <div className="py-8 text-center text-stone-400 italic">Cargando catálogo de servicios...</div>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all",
                            selectedService?.id === service.id ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-400"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-stone-100 rounded-full">
                              <Scissors className="h-5 w-5 text-stone-900" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{service.name}</p>
                              <p className="text-sm text-stone-500">{service.duration}</p>
                            </div>
                          </div>
                          <p className="font-serif font-bold text-lg">{service.price}€</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-stone-900" 
                      disabled={!selectedService}
                      onClick={() => setStep(2)}
                    >
                      Siguiente Paso
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Fecha y Hora</CardTitle>
                    <CardDescription>¿Cuándo te gustaría venir?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col items-center">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={es}
                        className="rounded-md border shadow"
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Horas disponibles
                        </div>
                        {loadingSlots && <span className="text-xs text-stone-400 animate-pulse">Cargando disponibilidad...</span>}
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((time) => {
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <Button
                              key={time}
                              disabled={isBooked || loadingSlots}
                              variant={selectedTime === time ? "default" : "outline"}
                              className={cn(
                                "text-sm px-2",
                                selectedTime === time ? "bg-stone-900" : "border-stone-200",
                                isBooked && "opacity-50 bg-stone-100 text-stone-400 border-none cursor-not-allowed"
                              )}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          );
                        })}
                      </div>
                      {bookedSlots.length === TIME_SLOTS.length && !loadingSlots && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-md text-sm border border-amber-100">
                          <AlertCircle className="h-4 w-4" />
                          <span>No hay horas disponibles para este día.</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Atrás</Button>
                    <Button 
                      className="flex-1 bg-stone-900" 
                      disabled={!date || !selectedTime}
                      onClick={() => setStep(3)}
                    >
                      Resumen
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Confirmación</CardTitle>
                    <CardDescription>Revisa los detalles de tu cita antes de confirmar.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-stone-50 p-6 rounded-lg space-y-4">
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Servicio</span>
                        <span className="font-bold">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Fecha</span>
                        <span className="font-bold">{date ? format(date, "PPP", { locale: es }) : ""}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Hora</span>
                        <span className="font-bold">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between pt-2 text-xl">
                        <span className="font-serif font-bold">Precio del Servicio</span>
                        <span className="font-serif font-bold text-stone-900">{selectedService?.price}€</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-100">
                      <Banknote className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-bold">Pago en Local</p>
                        <p>No se te cobrará nada ahora mismo. Deberás abonar el importe directamente en la barbería tras tu servicio.</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Atrás</Button>
                    <Button 
                      className="flex-1 bg-stone-900" 
                      disabled={isProcessing}
                      onClick={handleConfirmBooking}
                    >
                      {isProcessing ? "Procesando..." : "Confirmar Reserva"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="text-center py-12">
                  <CardContent className="space-y-6">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-stone-900">¡Cita Confirmada!</h2>
                    <p className="text-stone-600 max-w-md mx-auto">
                      Hemos registrado tu reserva correctamente. Te esperamos el {date ? format(date, "PPP", { locale: es }) : ""} a las {selectedTime}. Recuerda que el pago se realizará en el establecimiento.
                    </p>
                    <Button asChild className="bg-stone-900">
                      <a href="/dashboard">Ir a mi Panel</a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="hidden md:block">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Tu Selección</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedService ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Servicio</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 italic">Ningún servicio seleccionado</p>
                )}
                
                {date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Fecha</span>
                    <span className="font-medium">{format(date, "dd/MM/yyyy")}</span>
                  </div>
                )}

                {selectedTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Hora</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-100 flex justify-between items-end">
                  <span className="text-sm text-stone-500">Total</span>
                  <span className="text-2xl font-serif font-bold text-stone-900">
                    {selectedService ? `${selectedService.price}€` : "0€"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
