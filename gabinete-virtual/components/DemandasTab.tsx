
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2, LayoutGrid, List, User as UserIcon, MoveRight, Calendar, Flag, MapPin, Filter, UserCheck } from 'lucide-react';
import { crud, subscribeToChanges, getAllData } from '../storageService';
import { Demand, DemandStatus, DemandPriority, Citizen } from '../types';

const DemandasTab: React.FC = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBairro, setFilterBairro] = useState('Todos');
  const [filterResponsible, setFilterResponsible] = useState('Todos');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getAllData();
      setDemands(data.demands);
      setCitizens(data.citizens);
    } catch (error) {
      console.error("Erro ao carregar demandas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const sub = subscribeToChanges('demands', load);
    return () => {
      sub.unsubscribe();
    };
  }, []);

  const getCitizenBairro = (citizenId?: string) => {
    if (!citizenId) return 'Independente';
    const citizen = citizens.find(c => c.id === citizenId);
    return citizen?.address.bairro || 'Não informado';
  };

  const bairrosUnicos = Array.from(new Set(demands.map(d => getCitizenBairro(d.citizenId))));
  const responsaveisUnicos = Array.from(new Set(demands.map(d => d.responsible).filter(Boolean))) as string[];

  const filtered = demands.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.citizenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.responsible?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBairro = filterBairro === 'Todos' || getCitizenBairro(d.citizenId) === filterBairro;
    const matchesResponsible = filterResponsible === 'Todos' || d.responsible === filterResponsible;
    
    return matchesSearch && matchesBairro && matchesResponsible;
  }).sort((a, b) => {
    const pMap: Record<DemandPriority, number> = { 'Urgente': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    return pMap[b.priority] - pMap[a.priority];
  });

  const statuses: DemandStatus[] = ['Não iniciada', 'Em andamento', 'Aguardando execução', 'Resolvida'];

  const handleStatusChange = async (id: string, newStatus: DemandStatus) => {
    const demand = demands.find(d => d.id === id);
    if (demand) {
      await crud.upsertDemand({ ...demand, status: newStatus });
    }
  };

  const onNewDemandSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    const newDemand: Demand = {
      id: crypto.randomUUID(),
      title: f.get('title') as string,
      description: f.get('description') as string,
      responsible: f.get('responsible') as string,
      status: 'Não iniciada',
      priority: f.get('priority') as DemandPriority,
      createdAt: now,
      updatedAt: now,
      citizenName: 'Independente'
    };
    await crud.upsertDemand(newDemand);
    setIsModalOpen(false);
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="animate-spin text-blue-600" />
      <p>Organizando demandas...</p>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar demandas..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
               <Filter size={14} className="ml-2 text-slate-400" />
               <select 
                value={filterBairro}
                onChange={(e) => setFilterBairro(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 pr-4 flex-1 cursor-pointer"
               >
                 <option value="Todos">Bairros: Todos</option>
                 {bairrosUnicos.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
               <UserCheck size={14} className="ml-2 text-slate-400" />
               <select 
                value={filterResponsible}
                onChange={(e) => setFilterResponsible(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 pr-4 flex-1 cursor-pointer"
               >
                 <option value="Todos">Responsável: Todos</option>
                 {responsaveisUnicos.map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}>
              <List size={20}/>
            </button>
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}>
              <LayoutGrid size={20}/>
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg shadow-indigo-200 dark:shadow-none whitespace-nowrap">
            <Plus size={20} /> <span className="hidden xs:inline">Nova Demanda</span>
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-280px)] md:overflow-x-auto gap-6 pb-4 custom-scrollbar">
          {statuses.map(status => (
            <div key={status} className="flex flex-col gap-4 min-w-full md:min-w-[300px] lg:min-w-[320px]">
              <div className="flex items-center justify-between px-2">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'Resolvida' ? 'bg-emerald-500' : status === 'Não iniciada' ? 'bg-slate-300' : 'bg-blue-500'}`} />
                  {status}
                </h4>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{filtered.filter(d => d.status === status).length}</span>
              </div>
              <div className="flex-1 space-y-3 md:overflow-y-auto md:pr-2 custom-scrollbar">
                {filtered.filter(d => d.status === status).map(d => (
                  <KanbanCard key={d.id} demand={d} bairro={getCitizenBairro(d.citizenId)} onStatusChange={handleStatusChange} onDelete={() => crud.deleteDemand(d.id)} />
                ))}
                {filtered.filter(d => d.status === status).length === 0 && (
                   <div className="h-20 border-2 border-dashed dark:border-slate-800 rounded-2xl flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Vazio</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Demanda</th>
                <th className="px-6 py-4">Bairro</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Prioridade</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filtered.map(demand => (
                <tr key={demand.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition group text-sm">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{demand.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{demand.citizenName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin size={12} className="text-slate-300" />
                      {getCitizenBairro(demand.citizenId)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <UserCheck size={12} className="text-indigo-400" />
                      {demand.responsible || 'Não definido'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={demand.priority} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if(confirm('Excluir?')) crud.deleteDemand(demand.id); }} className="p-2 text-slate-300 hover:text-red-500 transition md:opacity-0 group-hover:opacity-100">
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 text-center">Nova Demanda Independente</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><X size={24} /></button>
            </div>
            <form onSubmit={onNewDemandSubmit} className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Título da Demanda</label>
                <input name="title" required placeholder="Ex: Manutenção asfáltica" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 text-base" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Prioridade</label>
                <select name="priority" required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 text-base">
                  <option value="Baixa">Baixa</option>
                  <option value="Média" selected>Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Responsável</label>
                <input name="responsible" placeholder="Assessor" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 text-base" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Descrição</label>
                <textarea name="description" rows={4} required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 text-base" />
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 flex-1 px-6 py-3 border dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition font-bold text-slate-500">Cancelar</button>
                <button type="submit" className="order-1 sm:order-2 flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition font-bold">Criar Demanda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const KanbanCard = ({ demand, bairro, onStatusChange, onDelete }: any) => {
  const nextStatusMap: any = {
    'Não iniciada': 'Em andamento',
    'Em andamento': 'Aguardando execução',
    'Aguardando execução': 'Resolvida',
    'Resolvida': null
  };

  const next = nextStatusMap[demand.status];

  return (
    <div className={`bg-white dark:bg-slate-800 border-t-4 p-4 rounded-2xl shadow-sm hover:shadow-md transition group relative overflow-hidden border dark:border-slate-700`}>
      <div className="flex justify-between items-start mb-2">
         <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight flex-1 pr-2">{demand.title}</h5>
         <PriorityIcon priority={demand.priority} />
      </div>
      <div className="flex items-center gap-1 mb-2">
        <MapPin size={10} className="text-slate-300 shrink-0" />
        <span className="text-[10px] font-bold text-slate-400 truncate">{bairro}</span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{demand.description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-3 border-t dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-[9px] font-black uppercase">
            {demand.responsible?.charAt(0) || <UserIcon size={10}/>}
          </div>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[80px]">{demand.responsible || 'Pendente'}</span>
        </div>
        <div className="flex items-center gap-1">
          {next && (
            <button onClick={() => onStatusChange(demand.id, next)} className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg transition" title="Mover para próximo status">
              <MoveRight size={14} />
            </button>
          )}
          <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500 transition md:opacity-0 group-hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: DemandPriority }) => {
  const styles: Record<DemandPriority, string> = {
    'Urgente': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Alta': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Média': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Baixa': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };
  return <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${styles[priority]}`}>{priority}</span>;
};

const PriorityIcon = ({ priority }: { priority: DemandPriority }) => {
  const colors: Record<DemandPriority, string> = {
    'Urgente': 'text-red-500',
    'Alta': 'text-orange-500',
    'Média': 'text-blue-500',
    'Baixa': 'text-slate-400',
  };
  return <Flag size={14} className={`${colors[priority]} shrink-0`} />;
};

export default DemandasTab;
