
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ClipboardList, 
  FileText,
  Menu,
  X,
  Database,
  Moon,
  Sun,
  Bell,
  Sparkles,
  BarChart3,
  Hexagon,
  MoreHorizontal,
  LibraryBig
} from 'lucide-react';
import { crud } from '../storageService';
import { Appointment } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState<Appointment[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const checkAppointments = async () => {
      try {
        const appts = await crud.getAppointments();
        const now = new Date();
        const soon = appts.filter(a => {
          const apptDate = new Date(`${a.date}T${a.time}`);
          const diffMinutes = (apptDate.getTime() - now.getTime()) / (1000 * 60);
          return diffMinutes > 0 && diffMinutes <= 30;
        });
        setNotifications(soon);
      } catch (err) {
        console.error("Erro ao monitorar agenda:", err);
      }
    };
    checkAppointments();
    const interval = setInterval(checkAppointments, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'overview', label: 'Início', mobileLabel: 'Início', icon: LayoutDashboard, main: true },
    { id: 'agenda', label: 'Agenda', mobileLabel: 'Agenda', icon: Calendar, main: true },
    { id: 'cadastros', label: 'Cadastros', mobileLabel: 'Contatos', icon: Users, main: true },
    { id: 'demandas', label: 'Demandas', mobileLabel: 'Demandas', icon: ClipboardList, main: true },
    { id: 'ia', label: 'Inteligência IA', mobileLabel: 'IA', icon: Sparkles, main: false },
    { id: 'documentos', label: 'Documentos', mobileLabel: 'Docs', icon: FileText, main: false },
    { id: 'relatorios', label: 'Relatórios', mobileLabel: 'Relatórios', icon: BarChart3, main: false },
    { id: 'eleicoes', label: 'Eleições', mobileLabel: 'Eleições', icon: LibraryBig, main: false },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <aside className={`hidden md:flex ${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 dark:bg-slate-900 text-white transition-all duration-300 flex flex-col border-r border-slate-800`}>
        <div className="p-4 flex items-center gap-3">
          <div className="flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
            <Hexagon size={24} className="text-white fill-white/20" strokeWidth={2.5} />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col leading-none animate-in fade-in slide-in-from-left-2">
              <h1 className="text-lg font-black tracking-tighter text-white">GABINETE</h1>
              <span className="text-[10px] font-bold text-indigo-400 tracking-[0.2em] uppercase">Virtual</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`ml-auto p-1 hover:bg-slate-800 rounded-md transition-colors ${!isSidebarOpen && 'hidden'}`}>
             <X size={20} />
          </button>
          {!isSidebarOpen && (
             <button onClick={() => setIsSidebarOpen(true)} className="mx-auto p-1 hover:bg-slate-800 rounded-md">
               <Menu size={20} />
             </button>
          )}
        </div>
        
        <nav className="flex-1 mt-6 px-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            {darkMode ? <Sun size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} /> : <Moon size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />}
            {isSidebarOpen && <span className="font-medium text-sm">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>
        </div>
      </aside>
      
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {menuItems.filter(i => i.main).map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'text-indigo-600' 
                : 'text-slate-400'
            }`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.mobileLabel}</span>
          </button>
        ))}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            isMobileMenuOpen ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <MoreHorizontal size={22} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Mais</span>
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
            <div className="grid grid-cols-3 gap-4 mb-8">
              {menuItems.filter(i => !i.main).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={24} />
                  <span className="text-xs font-bold text-center">{item.mobileLabel}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all active:scale-95"
            >
              Fechar Menu
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 custom-scrollbar pb-24 md:pb-0">
        <header className="h-14 md:h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center justify-center bg-indigo-600 p-1.5 rounded-lg shrink-0">
              <Hexagon size={18} className="text-white fill-white/20" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"
              title={darkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition-colors active:scale-90"
                title="Notificações"
              >
                <Bell size={20} />
                {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold animate-bounce shadow-sm border border-white dark:border-slate-900">{notifications.length}</span>}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Alertas</h4>
                    <button onClick={() => setShowNotifications(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={16}/></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                        <p className="text-sm font-bold dark:text-slate-200">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{n.time} @ {n.location}</p>
                      </div>
                    )) : <div className="p-8 text-center text-slate-400 text-sm italic">Nenhum alerta imediato</div>}
                  </div>
                </div>
              )}
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-full ml-2">
              <Database size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Online</span>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};
export default Layout;
