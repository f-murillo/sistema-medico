import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Users, Calendar, LayoutDashboard, LogOut, User, ChevronRight, Stethoscope, Menu, X, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { doctorService } from '@/services/doctorService'
import GeminiChatWidget from '@/components/gemini/GeminiChatWidget'

const navigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Citas', href: '/citas', icon: Calendar },
]

export default function DashboardLayout() {
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { data: medico } = useQuery({
    queryKey: ['me'],
    queryFn: doctorService.getProfile,
    enabled: !!user
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = medico?.nombre_completo || user?.email?.split('@')[0] || 'Médico'

  const renderSidebarContent = (isMobile = false) => (
    <>
      {/* User Profile Area */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <Link 
          to="/perfil" 
          onClick={() => isMobile && setIsSidebarOpen(false)}
          className="group flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all border border-slate-100 dark:border-slate-700 hover:border-primary/20 hover:cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-3 group-hover:scale-110 transition-transform shadow-sm">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="space-y-1">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
              {medico?.nombre_completo || user?.email}
            </h1>
            <p className="text-xs font-medium text-primary dark:text-blue-400 flex items-center justify-center gap-1">
              <Stethoscope className="w-3 h-3" />
              {medico?.especialidad || 'Médico General'}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">
            Ver Perfil
            <ChevronRight className="w-3 h-3" />
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => isMobile && setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary transition-colors hover:cursor-pointer"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 hover:cursor-pointer transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
        <button 
          onClick={() => {
            if (isMobile) setIsSidebarOpen(false);
            handleSignOut();
          }}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:cursor-pointer transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Móvil (Drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-wider uppercase">MediGestión</span>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 hover:cursor-pointer rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        {renderSidebarContent(true)}
      </aside>

      {/* Sidebar de Escritorio */}
      <aside className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
        {renderSidebarContent(false)}
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 hover:cursor-pointer rounded-lg md:hidden transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Panel de Control</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {medico?.nombre_completo || user?.email}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tighter">
                Sesión Iniciada
              </p>
            </div>
            {/* Toggle rápido en el header */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:cursor-pointer transition-colors"
            >
              {theme === 'dark'
                ? <Sun className="w-5 h-5 text-amber-400" />
                : <Moon className="w-5 h-5 text-slate-500" />
              }
            </button>
            <Link to="/perfil" className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center hover:bg-primary/10 dark:hover:bg-primary/20 hover:cursor-pointer transition-colors border border-primary/10">
              <User className="w-5 h-5 text-primary" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Asistente Inteligente Gemini */}
      <GeminiChatWidget />
    </div>
  )
}
