import { Link } from "react-router-dom";
import { Scissors, User, Calendar, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-stone-900" />
              <span className="text-xl font-serif font-bold tracking-tight text-stone-900">
                LUXE CUT
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Inicio
              </Link>
              <Link to="/booking" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Reservar
              </Link>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 hover:opacity-80 transition-opacity">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                      <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="p-0">
                      <Link to="/dashboard" className="flex w-full items-center gap-2 px-1.5 py-1 text-sm text-stone-700">
                        <User className="h-4 w-4" /> Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem className="p-0">
                        <Link to="/dashboard" className="flex w-full items-center gap-2 px-1.5 py-1 text-sm text-amber-600 font-bold">
                          <Scissors className="h-4 w-4" /> Panel de Dueño
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => auth.signOut()} className="text-red-500 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="default" className="bg-stone-900 text-white hover:bg-stone-800">
                    Iniciar Sesión
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-500 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-stone-200">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            <Link
              to="/"
              className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setIsOpen(false)}
            >
              Inicio
            </Link>
            <Link
              to="/booking"
              className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setIsOpen(false)}
            >
              Reservar
            </Link>
            {user ? (
              <>
                <div className="border-t border-stone-100 my-2 pt-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="h-5 w-5" /> Mi Perfil
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-amber-600 font-bold hover:bg-amber-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <Scissors className="h-5 w-5" /> Panel de Dueño
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      auth.signOut();
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-red-500 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" /> Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
                onClick={() => setIsOpen(false)}
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
