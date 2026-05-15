import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, Clock, Scissors, User as UserIcon, LogOut, ChevronRight, Star, Settings, Edit2, Check, X as XIcon, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { collection, query, where, getDocs, orderBy, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Plus, Trash2 } from "lucide-react";

interface AppointmentData {
  id: string;
  userId: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  price: number;
}

interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

export default function Dashboard() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [adminAppointments, setAdminAppointments] = useState<AppointmentData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [fetchingAppointments, setFetchingAppointments] = useState(true);
  const [fetchingAdminAppointments, setFetchingAdminAppointments] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [view, setView] = useState<"user" | "admin">("user");
  const [adminSubView, setAdminSubView] = useState<"appointments" | "services">("appointments");
  const [adminAppointmentView, setAdminAppointmentView] = useState<"list" | "calendar">("list");
  const [adminAppointmentsFilter, setAdminAppointmentsFilter] = useState<"upcoming" | "past">("upcoming");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    price: 30,
    duration: "45 min",
    description: ""
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (isAdmin) {
      setView("admin");
    }
  }, [user, loading, navigate, isAdmin]);

  useEffect(() => {
    if (user) {
      fetchUserAppointments();
      if (isAdmin) {
        fetchAdminAppointments();
        fetchServices();
      }
    }
  }, [user, isAdmin]);

  const fetchServices = async () => {
    setFetchingServices(true);
    const path = "services";
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceData[];
      setServices(docs);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setFetchingServices(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    try {
      const serviceRef = doc(db, "services", editingService.id);
      await updateDoc(serviceRef, {
        name: editingService.name,
        price: Number(editingService.price),
        duration: editingService.duration,
        description: editingService.description
      });
      toast.success("Servicio actualizado correctamente");
      setEditingService(null);
      fetchServices();
    } catch (error) {
      toast.error("Error al actualizar el servicio");
      console.error(error);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price) {
      toast.error("Nombre y precio son obligatorios");
      return;
    }

    try {
      const path = "services";
      await addDoc(collection(db, path), {
        ...newService,
        price: Number(newService.price)
      });
      toast.success("Servicio creado correctamente");
      setIsAddingService(false);
      setNewService({
        name: "",
        price: 30,
        duration: "45 min",
        description: ""
      });
      fetchServices();
    } catch (error) {
      toast.error("Error al crear el servicio");
      handleFirestoreError(error, OperationType.WRITE, "services");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este servicio?")) return;

    try {
      await deleteDoc(doc(db, "services", id));
      toast.success("Servicio eliminado");
      fetchServices();
    } catch (error) {
      toast.error("Error al eliminar el servicio");
      handleFirestoreError(error, OperationType.WRITE, "services");
    }
  };

  const fetchUserAppointments = async () => {
    if (!user) return;
    const path = "appointments";
    try {
      const q = query(
        collection(db, path),
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppointmentData[];
      setAppointments(docs);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
    } finally {
      setFetchingAppointments(false);
    }
  };

  const fetchAdminAppointments = async () => {
    setFetchingAdminAppointments(true);
    const path = "appointments";
    try {
      const q = query(
        collection(db, path),
        orderBy("date", "desc"),
        orderBy("time", "asc")
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppointmentData[];
      setAdminAppointments(docs);
    } catch (error) {
      console.error("Error fetching admin appointments:", error);
    } finally {
      setFetchingAdminAppointments(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Sesión cerrada");
      navigate("/");
    } catch (error: any) {
      toast.error("Error al cerrar sesión");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif text-2xl">Cargando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Profile */}
          <aside className="w-full md:w-80 space-y-6">
            <Card className="border-stone-200">
              <CardContent className="pt-8 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-stone-200">
                  <AvatarImage src={user.photoURL || ""} />
                  <AvatarFallback className="text-2xl bg-stone-100 text-stone-600 font-serif">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-stone-900 font-serif">{user.displayName || "Usuario"}</h2>
                  {isAdmin && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 font-bold rounded uppercase border border-amber-200">
                      Duque
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-500 mb-6">{user.email}</p>
                
                {isAdmin && (
                  <div className="mb-4 space-y-2">
                    <Button 
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-none shadow-md"
                      onClick={() => {
                        setView("admin");
                        setAdminSubView("services");
                      }}
                    >
                      <Scissors className="mr-2 h-4 w-4" /> Gestionar Barbería
                    </Button>
                  </div>
                )}

                <Button variant="outline" className="w-full border-stone-200 hover:bg-stone-50 rounded-none" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </Button>

                {(user.email?.toLowerCase().includes("joselepeperez") || user.email?.toLowerCase().includes("vicentequesada")) && !isAdmin && (
                  <div className="mt-4 p-2 bg-red-50 text-[10px] text-red-600 border border-red-100 italic">
                    DEBUG: El sistema no te ha reconocido como admin.<br/>
                    Email detectado: {user.email}<br/>
                    Por favor, refresca la página o contacta con soporte técnico.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-stone-500 font-medium">
                  {isAdmin && view === "admin" ? "Resumen de Negocio" : "Resumen Perfil"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {isAdmin && view === "admin" ? "Total Citas Globales" : "Citas Históricas"}
                  </span>
                  <span className="bg-stone-900 text-white px-2 py-1 rounded text-xs font-bold">
                    {isAdmin && view === "admin" ? adminAppointments.length : appointments.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {isAdmin && view === "admin" ? "Estado Sistema" : "Nivel de Cliente"}
                  </span>
                  <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-900 uppercase">
                    {isAdmin && view === "admin" ? "Admin Activo" : "Regular"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-serif font-bold text-stone-900">
                    {isAdmin && view === "admin" ? "Panel de Gestión" : `Bienvenido, ${user.displayName?.split(' ')[0] || 'Cliente'}`}
                  </h1>
                  {isAdmin && view === "admin" && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 font-bold uppercase tracking-tighter border border-amber-200">
                      Propietario
                    </span>
                  )}
                </div>
                <p className="text-stone-500 mt-1">
                  {isAdmin && view === "admin" 
                    ? "Gestión de citas y disponibilidad del negocio." 
                    : "Gestiona tus citas y tratamientos exclusivos."}
                </p>
              </div>
              
              {isAdmin && (
                <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 shadow-sm w-full sm:w-auto">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "flex-1 sm:flex-initial rounded-none px-4 transition-all text-xs font-bold uppercase tracking-tight", 
                      view === "user" ? "bg-stone-900 text-white shadow-inner" : "text-stone-500 hover:text-stone-900"
                    )}
                    onClick={() => setView("user")}
                  >
                     Vista Cliente
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "flex-1 sm:flex-initial rounded-none px-4 transition-all text-xs font-bold uppercase tracking-tight", 
                      view === "admin" ? "bg-stone-900 text-white shadow-inner" : "text-stone-500 hover:text-stone-900"
                    )}
                    onClick={() => setView("admin")}
                  >
                     Vista Dueño
                  </Button>
                </div>
              )}
            </header>

            {isAdmin && view === "admin" && (
              <div className="flex w-full bg-stone-100 p-1 border border-stone-200">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "flex-1 rounded-none transition-all py-3 text-xs font-bold uppercase tracking-wider", 
                    adminSubView === "appointments" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:bg-stone-50"
                  )}
                  onClick={() => setAdminSubView("appointments")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" /> Citas Recibidas
                </Button>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "flex-1 rounded-none transition-all py-3 text-xs font-bold uppercase tracking-wider", 
                    adminSubView === "services" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:bg-stone-50"
                  )}
                  onClick={() => setAdminSubView("services")}
                >
                  <Scissors className="mr-2 h-4 w-4" /> Servicios y Precios
                </Button>
              </div>
            )}

            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2 font-serif text-stone-800">
                  {view === "admin" 
                    ? (adminSubView === "appointments" ? <CalendarIcon className="h-5 w-5" /> : <Scissors className="h-5 w-5" />)
                    : <CalendarIcon className="h-5 w-5" />
                  } 
                  {view === "admin" 
                    ? (adminSubView === "appointments" ? "Todas las Citas Registradas" : "Gestión de Servicios y Precios") 
                    : "Tus Reservas"
                  }
                </h2>
                <div className="flex items-center gap-4">
                  {view === "admin" && adminSubView === "appointments" && (
                    <div className="flex bg-stone-200/50 p-1 rounded-none border border-stone-200">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={cn("h-7 px-3 rounded-none text-xs font-bold uppercase tracking-widest", adminAppointmentsFilter === "upcoming" ? "bg-white shadow-sm" : "text-stone-500")}
                        onClick={() => setAdminAppointmentsFilter("upcoming")}
                      >
                        Próximas
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={cn("h-7 px-3 rounded-none text-xs font-bold uppercase tracking-widest", adminAppointmentsFilter === "past" ? "bg-white shadow-sm" : "text-stone-500")}
                        onClick={() => setAdminAppointmentsFilter("past")}
                      >
                        Pasadas
                      </Button>
                    </div>
                  )}

                  {view === "admin" && adminSubView === "appointments" && (
                    <div className="flex bg-stone-200/50 p-1 rounded-none border border-stone-200">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={cn("h-7 px-2 rounded-none", adminAppointmentView === "list" ? "bg-white shadow-sm" : "text-stone-500")}
                        onClick={() => setAdminAppointmentView("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={cn("h-7 px-2 rounded-none", adminAppointmentView === "calendar" ? "bg-white shadow-sm" : "text-stone-500")}
                        onClick={() => setAdminAppointmentView("calendar")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {view === "user" && (
                    <Button variant="link" asChild className="text-stone-900 p-0 hover:no-underline font-medium">
                      <a href="/booking">Nueva Reserva →</a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {view === "admin" ? (
                  adminSubView === "appointments" ? (
                    fetchingAdminAppointments ? (
                      <div className="text-stone-400 italic py-8">Cargando todas las citas del sistema...</div>
                    ) : adminAppointments.length > 0 ? (
                      adminAppointmentView === "list" ? (
                        (() => {
                          const filtered = adminAppointments
                            .filter((apt: any) => {
                              try {
                                const aptFullDate = parseISO(apt.date);
                                const [hours, minutes] = apt.time.split(' ')[0].split(':').map(Number);
                                const aptDateTime = new Date(aptFullDate);
                                aptDateTime.setHours(hours, minutes, 0, 0);
                                
                                const now = new Date();
                                
                                // If upcoming: show everything from Today start onwards
                                // or if they specifically want "future only":
                                if (adminAppointmentsFilter === "upcoming") {
                                  // Show appointments from today (start of day) onwards
                                  return aptDateTime >= startOfDay(now);
                                } else {
                                  // Show definitely past appointments (before today)
                                  return aptDateTime < startOfDay(now);
                                }
                              } catch (e) {
                                return true;
                              }
                            })
                            .sort((a: any, b: any) => {
                              try {
                                const dateA = parseISO(a.date).getTime();
                                const dateB = parseISO(b.date).getTime();
                                if (dateA !== dateB) {
                                  return adminAppointmentsFilter === "upcoming" ? dateA - dateB : dateB - dateA;
                                }
                                return a.time.localeCompare(b.time);
                              } catch (e) {
                                return 0;
                              }
                            });

                          if (filtered.length === 0) {
                            return (
                              <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-none bg-stone-50/50 text-stone-400">
                                No hay citas {adminAppointmentsFilter === "upcoming" ? "próximas" : "pasadas"} programadas.
                              </div>
                            );
                          }

                          // Group by date for better visualization
                          const grouped: Record<string, any[]> = {};
                          filtered.forEach(apt => {
                            const d = apt.date.split('T')[0];
                            if (!grouped[d]) grouped[d] = [];
                            grouped[d].push(apt);
                          });

                          return Object.keys(grouped).sort((a, b) => 
                            adminAppointmentsFilter === "upcoming" ? a.localeCompare(b) : b.localeCompare(a)
                          ).map((dateKey) => (
                            <div key={dateKey} className="space-y-4 mb-8">
                              <div className="flex items-center gap-4">
                                <div className="h-px bg-stone-200 flex-1" />
                                <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-400 bg-stone-50 px-3 py-1 rounded-full border border-stone-100">
                                  {format(parseISO(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
                                </h4>
                                <div className="h-px bg-stone-200 flex-1" />
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {grouped[dateKey].map((apt: any) => (
                                  <motion.div key={apt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className={cn("border-stone-200 shadow-sm overflow-hidden", adminAppointmentsFilter === "past" && "opacity-75 grayscale-[0.5]")}>
                                      <div className="bg-stone-50/50 border-b border-stone-100 px-6 py-1.5 text-[9px] uppercase tracking-widest font-bold text-stone-400 flex justify-between">
                                        <span>REF: {apt.id.slice(0, 8)}</span>
                                        <span className="text-stone-500">{apt.userEmail}</span>
                                      </div>
                                      <CardContent className="p-4 flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-4">
                                          <div className="bg-stone-900 text-white px-3 py-2 font-mono font-bold text-sm min-w-[70px] text-center">
                                            {apt.time}
                                          </div>
                                          <div>
                                            <h3 className="font-bold text-stone-900">{apt.serviceName}</h3>
                                            <p className="text-xs text-stone-500 font-medium">{apt.userEmail}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                            {apt.price}€
                                          </span>
                                          <span className="bg-amber-100/50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200/50">
                                            LOCAL
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <Card className="lg:col-span-1 p-4 bg-white border-stone-200">
                            <CalendarUI
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              locale={es}
                              className="w-full"
                              modifiers={{
                                hasAppointment: adminAppointments.map(apt => new Date(apt.date))
                              }}
                              modifiersClassNames={{
                                hasAppointment: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-amber-500 after:rounded-full"
                              }}
                            />
                            <div className="mt-4 pt-4 border-t border-stone-100 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-stone-500">
                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                <span>Días con citas programadas</span>
                              </div>
                            </div>
                          </Card>
                          <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-bold font-serif text-stone-900 mb-2">
                              {selectedDate ? `Citas para el ${format(selectedDate, "PPP", { locale: es })}` : "Selecciona una fecha"}
                            </h3>
                            {selectedDate && adminAppointments.filter(apt => isSameDay(parseISO(apt.date), selectedDate)).length > 0 ? (
                              adminAppointments
                                .filter(apt => isSameDay(parseISO(apt.date), selectedDate))
                                .sort((a, b) => a.time.localeCompare(b.time))
                                .map((apt) => (
                                  <motion.div key={apt.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-none shadow-sm group hover:border-stone-900 transition-colors">
                                      <div className="bg-stone-900 text-white p-3 font-mono font-bold text-sm min-w-[70px] text-center">
                                        {apt.time}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-bold text-stone-900">{apt.serviceName}</h4>
                                          <span className="text-xs font-bold text-amber-600">{apt.price}€</span>
                                        </div>
                                        <p className="text-xs text-stone-500 truncate">{apt.userEmail}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))
                            ) : (
                              <div className="p-12 text-center border-2 border-dashed border-stone-200 rounded-none bg-stone-50/50 text-stone-400">
                                No hay ninguna cita programada para esta fecha.
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <Card className="border-dashed border-2 border-stone-200 bg-white p-12 text-center text-stone-400">
                        Todavía no se ha realizado ninguna reserva en el sistema.
                      </Card>
                    )
                  ) : (
                    /* SERVICES VIEW */
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold font-serif text-stone-900">Catálogo de Servicios</h3>
                        {!isAddingService && !editingService && (
                          <Button 
                            className="bg-stone-900 text-white rounded-none shadow-md"
                            onClick={() => setIsAddingService(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                          </Button>
                        )}
                      </div>

                      {isAddingService && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                          <Card className="border-stone-900 border-2">
                            <CardHeader className="bg-stone-900 text-white">
                              <CardTitle className="text-lg">Crear Nuevo Servicio</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <form onSubmit={handleAddService} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-name">Nombre del Servicio</Label>
                                    <Input 
                                      id="new-name" 
                                      placeholder="Ej: Corte Clásico"
                                      value={newService.name} 
                                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                                      className="rounded-none border-stone-200"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="new-price">Precio (€)</Label>
                                    <Input 
                                      id="new-price" 
                                      type="number"
                                      value={newService.price} 
                                      onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                                      className="rounded-none border-stone-200"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="new-duration">Duración Estimada</Label>
                                    <Input 
                                      id="new-duration" 
                                      placeholder="Ej: 45 min"
                                      value={newService.duration} 
                                      onChange={(e) => setNewService({...newService, duration: e.target.value})}
                                      className="rounded-none border-stone-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="new-desc">Descripción</Label>
                                    <Input 
                                      id="new-desc" 
                                      placeholder="Descripción breve..."
                                      value={newService.description} 
                                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                                      className="rounded-none border-stone-200"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                  <Button type="button" variant="outline" className="flex-1 rounded-none font-bold" onClick={() => setIsAddingService(false)}>
                                    Cancelar
                                  </Button>
                                  <Button type="submit" className="flex-1 bg-stone-900 rounded-none font-bold">
                                    <Plus className="mr-2 h-4 w-4" /> Crear Servicio
                                  </Button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fetchingServices ? (
                          <div className="text-stone-400 italic py-8">Cargando servicios...</div>
                        ) : services.map((service) => (
                          <Card key={service.id} className="border-stone-200 hover:border-stone-400 transition-colors">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-bold text-xl text-stone-900">{service.name}</h3>
                                  <p className="text-sm text-stone-500">{service.duration}</p>
                                </div>
                                <span className="text-2xl font-serif font-bold text-stone-900">{service.price}€</span>
                              </div>
                              <p className="text-sm text-stone-600 mb-6 italic">"{service.description || "Sin descripción"}"</p>
                              <div className="grid grid-cols-2 gap-3">
                                <Button 
                                  variant="outline" 
                                  className="rounded-none border-stone-200 hover:bg-stone-50"
                                  onClick={() => {
                                    setEditingService(service);
                                    setIsAddingService(false);
                                  }}
                                >
                                  <Settings className="mr-2 h-4 w-4" /> Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="rounded-none border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                                  onClick={() => handleDeleteService(service.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {editingService && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                          <Card className="border-stone-900 border-2">
                            <CardHeader className="bg-stone-900 text-white">
                              <CardTitle className="text-lg">Editando: {editingService.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <form onSubmit={handleUpdateService} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del Servicio</Label>
                                    <Input 
                                      id="name" 
                                      value={editingService.name} 
                                      onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                                      className="rounded-none border-stone-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="price">Precio (€)</Label>
                                    <Input 
                                      id="price" 
                                      type="number"
                                      value={editingService.price} 
                                      onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})}
                                      className="rounded-none border-stone-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="duration">Duración Estimada</Label>
                                    <Input 
                                      id="duration" 
                                      value={editingService.duration} 
                                      onChange={(e) => setEditingService({...editingService, duration: e.target.value})}
                                      className="rounded-none border-stone-200"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="desc">Descripción</Label>
                                    <Input 
                                      id="desc" 
                                      value={editingService.description} 
                                      onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                                      className="rounded-none border-stone-200"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                  <Button type="button" variant="outline" className="flex-1 rounded-none" onClick={() => setEditingService(null)}>
                                    <XIcon className="mr-2 h-4 w-4" /> Cancelar
                                  </Button>
                                  <Button type="submit" className="flex-1 bg-stone-900 rounded-none">
                                    <Check className="mr-2 h-4 w-4" /> Guardar Cambios
                                  </Button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </div>
                  )
                ) : (
                  fetchingAppointments ? (
                    <div className="text-stone-400 italic py-8">Cargando tus citas...</div>
                  ) : appointments.length > 0 ? (
                    appointments.map((apt) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="hover:border-stone-400 transition-all border-stone-200 shadow-sm">
                          <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="hidden sm:flex flex-col items-center justify-center min-w-16 h-16 bg-stone-900 text-white rounded-none">
                                <span className="text-[10px] uppercase font-bold tracking-widest">{format(new Date(apt.date), "MMM", { locale: es })}</span>
                                <span className="text-xl font-serif font-bold">{format(new Date(apt.date), "dd")}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-stone-900">{apt.serviceName}</h3>
                                <div className="flex items-center gap-4 text-sm text-stone-500 mt-1">
                                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {apt.time}</span>
                                  <span className="flex items-center gap-1.5"><Scissors className="h-3.5 w-3.5" /> Luxe Cut Centro</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right flex flex-col items-end">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  apt.status === "confirmed" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-stone-100 text-stone-500"
                                )}>
                                  {apt.status === "confirmed" ? "Pago en Local" : "Pendiente"}
                                </span>
                                <span className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-tighter">Confirmada</span>
                              </div>
                              <ChevronRight className="h-5 w-5 text-stone-300" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <Card className="border-dashed border-2 border-stone-200 bg-white p-8 text-center">
                      <p className="text-stone-500 mb-4">Aún no tienes ninguna reserva programada.</p>
                      <Button asChild className="bg-stone-900 hover:bg-stone-800 rounded-none">
                        <a href="/booking">Reservar mi primera cita</a>
                      </Button>
                    </Card>
                  )
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-serif">
                <Star className="h-5 w-5" /> Tratamientos de Temporada
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-stone-900 text-white overflow-hidden group border-none rounded-none">
                  <CardContent className="p-0 relative h-48">
                    <img 
                      src="https://images.unsplash.com/photo-1512690118275-1aa3c2417b16?q=80&w=600" 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <h3 className="font-bold text-lg font-serif italic">Tratamiento Capilar VIP</h3>
                      <p className="text-sm text-stone-300">Reserva ahora y obtén diagnóstico gratis.</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-stone-100 border-none overflow-hidden group rounded-none">
                  <CardContent className="p-0 relative h-48">
                    <img 
                      src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600" 
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-stone-900">
                      <h3 className="font-bold text-lg font-serif">Productos de Estilo</h3>
                      <p className="text-sm text-stone-600">Nuestra selección exclusiva para casa.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
