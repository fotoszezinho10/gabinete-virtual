
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  LayoutList, 
  Columns, 
  Grid3X3,
  ShieldAlert
} from 'lucide-react';
import { crud, subscribeToChanges } from '../storageService';
import { Appointment } from '../types';

type ViewMode = 'list' | 'week' | 'month';

const AgendaTab: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRlsWarning, setShowRlsWarning] = useState(false);
  
  // Estados de Visualização
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const load = async () => {
    try {
      setError(null);
      const data = await crud.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      console.error("Erro ao carregar agenda:", err);
      setError(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const subscription = subscribeToChanges('appointments', load);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filtered = appointments.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  // Funções de Navegação
  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days = [];
    
    for (let i = startOffset; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const apptData: Appointment = {
      id: editingAppt?.id || crypto.randomUUID(),
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      createdAt: editingAppt?.createdAt || now,
      updatedAt: now
    };

    try {
      await crud.upsertAppointment(apptData);
      setIsModalOpen(false);
      setEditingAppt(null);
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!window.confirm('Tem certeza que deseja excluir este compromisso permanentemente?')) return;
    
    setIsDeleting(true);
    try {
      await crud.deleteAppointment(id);
      setIsModalOpen(false);
      setEditingAppt(null);
    } catch (err: any) {
      console.error("Erro na exclusão:", err);
      if (err.code === '42501' || err.message?.includes('42501')) {
        setShowRlsWarning(true);
      } else {
        alert(`Erro ao excluir: ${err.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-blue-600" />
        <p>Carregando agenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showRlsWarning && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-6 rounded-[2rem] animate-in zoom-in-95 flex flex-col md:flex-row gap-6 items-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-2xl shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-red-800 dark:text-red-400 text-lg mb-2">Permissão de Exclusão Negada</h4>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mb-4">
              O Supabase bloqueou a exclusão. Execute este comando no <b>SQL Editor</b> do painel Supabase para liberar:
            </p>
            <div className="bg-black/90 p-4 rounded-xl font-mono text-xs text-emerald-400 border border-white/10 relative group">
              <code>ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;</code>
              <button 
                onClick={() => { navigator.clipboard.writeText('ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;'); alert('Comando copiado!'); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white text-[10px]"
              >
                Copiar
              </button>
            </div>
          </div>
          <button onClick={() => setShowRlsWarning(false)} className="p-2 text-red-400 hover:text-red-600 transition-transform hover:scale-110">
            <X size={20}/>
          </button>
        </div>
      )}

      {/* Cabeçalho de Controle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <ViewButton active={viewMode === 'week'} onClick={() => setViewMode('week')} icon={Columns} label="Semana" />
          <ViewButton active={viewMode === 'month'} onClick={() => setViewMode('month')} icon={Grid3X3} label="Mês" />
          <ViewButton active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={LayoutList} label="Lista" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition dark:text-slate-300">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-200 min-w-[140px] text-center capitalize">
              {currentDate.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: viewMode === 'month' ? 'numeric' : undefined
              })} {viewMode === 'week' && `(Semana ${Math.ceil(currentDate.getDate() / 7)})`}
            </span>
            <button onClick={() => navigateDate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition dark:text-slate-300">
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => { setEditingAppt(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none font-bold whitespace-nowrap"
          >
            <Plus size={18} /> Novo
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar compromissos..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <div className="animate-in fade-in duration-500">
        {viewMode === 'list' && (
          <div className="grid gap-4">
            {filtered.length === 0 ? (
              <EmptyState message="Nenhum compromisso encontrado." />
            ) : (
              filtered.map(appt => (
                <AppointmentCard 
                  key={appt.id} 
                  appt={appt} 
                  onEdit={() => { setEditingAppt(appt); setIsModalOpen(true); }}
                  onDelete={(e) => handleDelete(appt.id, e)}
                />
              ))
            )}
          </div>
        )}

        {viewMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {getWeekDays().map(day => {
              const dayStr = day.toISOString().split('T')[0];
              const dayAppts = appointments.filter(a => a.date === dayStr);
              return (
                <div key={dayStr} className={`flex flex-col min-h-[400px] bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden ${isToday(day) ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                  <div className={`p-3 text-center border-b dark:border-slate-800 ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
                      {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                    <p className={`text-xl font-black ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="p-2 space-y-2 flex-1">
                    {dayAppts.map(appt => (
                      <div 
                        key={appt.id} 
                        className="p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg cursor-pointer hover:scale-[1.02] transition shadow-sm group relative"
                        onClick={() => { setEditingAppt(appt); setIsModalOpen(true); }}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Clock size={10} /> {appt.time}
                          </p>
                          <button 
                            onClick={(e) => handleDelete(appt.id, e)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md bg-white/50 dark:bg-slate-800/50"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-4">{appt.title}</p>
                      </div>
                    ))}
                    <button 
                      onClick={() => { setEditingAppt({ date: dayStr } as any); setIsModalOpen(true); }}
                      className="w-full py-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg text-slate-300 hover:text-blue-400 hover:border-blue-200 transition flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'month' && (
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                <div key={d} className="py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getMonthDays().map((day, idx) => {
                const dayStr = day.toISOString().split('T')[0];
                const dayAppts = appointments.filter(a => a.date === dayStr);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                
                return (
                  <div 
                    key={idx} 
                    className={`min-h-[100px] p-2 border-b border-r dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer ${!isCurrentMonth ? 'opacity-30' : ''}`}
                    onClick={() => { setEditingAppt({ date: dayStr } as any); setIsModalOpen(true); }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${isToday(day) ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-500'}`}>
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayAppts.slice(0, 3).map(appt => (
                        <div key={appt.id} className="text-[9px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded truncate border border-blue-100 dark:border-blue-800">
                          {appt.time} {appt.title}
                        </div>
                      ))}
                      {dayAppts.length > 3 && (
                        <p className="text-[9px] text-slate-400 font-bold ml-1">+{dayAppts.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-5 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{editingAppt?.id ? 'Editar' : 'Novo'} Compromisso</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Título</label>
                <input name="title" defaultValue={editingAppt?.title} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Data</label>
                  <input name="date" type="date" defaultValue={editingAppt?.date} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Hora</label>
                  <input name="time" type="time" defaultValue={editingAppt?.time} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Local</label>
                <input name="location" defaultValue={editingAppt?.location} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Descrição</label>
                <textarea name="description" rows={3} defaultValue={editingAppt?.description} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-100" />
              </div>
              <div className="pt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition font-bold text-slate-500 min-w-[120px]">Cancelar</button>
                
                {editingAppt?.id && (
                  <button 
                    type="button" 
                    onClick={(e) => handleDelete(editingAppt.id, e)} 
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition font-bold flex items-center justify-center gap-2 min-w-[120px]"
                  >
                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    Excluir
                  </button>
                )}
                
                <button type="submit" className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none transition font-bold min-w-[180px]">Salvar Agenda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ViewButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-bold ${
      active 
        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
    }`}
  >
    <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
  </button>
);

const AppointmentCard: React.FC<{
  appt: Appointment;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ appt, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition group border-l-4 border-l-blue-500">
    <div className="flex justify-between items-start">
      <div className="space-y-3 cursor-pointer flex-1" onClick={onEdit}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{appt.title}</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><CalendarIcon size={14} className="text-blue-500" /> {new Date(appt.date).toLocaleDateString('pt-BR')}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> {appt.time}</span>
          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {appt.location}</span>
        </div>
        {appt.description && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 max-w-2xl">{appt.description}</p>}
      </div>
      <div className="flex gap-1 shrink-0 ml-4">
        <button onClick={onEdit} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl transition hover:bg-blue-50">
          <Edit2 size={18} />
        </button>
        <button onClick={onDelete} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl transition hover:bg-red-50">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed dark:border-slate-800 flex flex-col items-center gap-4">
    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full text-slate-300 dark:text-slate-600">
      <CalendarIcon size={48} strokeWidth={1} />
    </div>
    <p className="text-slate-500 dark:text-slate-400 font-medium">{message}</p>
  </div>
);

export default AgendaTab;
