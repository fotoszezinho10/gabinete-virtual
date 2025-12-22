
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ClipboardList, 
  Calendar, 
  FileText,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Cake,
  MapPin,
  Flame,
  Sparkles,
  Gift,
  MessageCircle,
  Clock,
  BellRing,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getAllData, subscribeToChanges } from '../storageService';
import { generateExecutiveSummary } from '../geminiService';
import { StorageData, Citizen, Appointment } from '../types';

const DashboardTab: React.FC = () => {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const result = await getAllData();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!data || isAiLoading) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const summary = await generateExecutiveSummary(data);
      setAiSummary(summary);
    } catch (err: any) {
      if (err.message?.includes('429')) {
        setAiError("Cota atingida. Tente novamente em 1 minuto.");
      } else {
        setAiError("Erro ao gerar resumo.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const subs = [
      subscribeToChanges('citizens', fetchData),
      subscribeToChanges('demands', fetchData),
      subscribeToChanges('appointments', fetchData)
    ];
    return () => subs.forEach(s => s.unsubscribe());
  }, []);

  if (loading || !data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="font-medium animate-pulse">Carregando painel...</p>
    </div>
  );

  const getUpcomingAnniversaries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return data.citizens.map(c => {
      if (!c.birthDate) return null;
      const [y, m, d] = c.birthDate.split('-').map(Number);
      const birthDateThisYear = new Date(today.getFullYear(), m - 1, d);
      if (birthDateThisYear < today) birthDateThisYear.setFullYear(today.getFullYear() + 1);
      const diffTime = birthDateThisYear.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...c, daysUntil: diffDays };
    }).filter((c): c is (Citizen & { daysUntil: number }) => c !== null && c.daysUntil <= 7).sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const anniversariesRadar = getUpcomingAnniversaries();
  const birthdaysTodayCount = anniversariesRadar.filter(c => c.daysUntil === 0).length;

  const demandStats = [
    { name: 'Não iniciada', value: data.demands.filter(d => d.status === 'Não iniciada').length, color: '#94a3b8' },
    { name: 'Em andamento', value: data.demands.filter(d => d.status === 'Em andamento').length, color: '#3b82f6' },
    { name: 'Aguardando', value: data.demands.filter(d => d.status === 'Aguardando execução').length, color: '#f59e0b' },
    { name: 'Resolvida', value: data.demands.filter(d => d.status === 'Resolvida').length, color: '#22c55e' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <h4 className="font-bold mb-1 flex items-center gap-2 text-xl"><Sparkles size={20}/> Resumo Inteligente do Gabinete</h4>
          {aiSummary ? (
            <p className="text-sm opacity-90 leading-relaxed italic">"{aiSummary}"</p>
          ) : (
            <p className="text-sm opacity-80 leading-relaxed">Clique ao lado para gerar uma análise do status atual do seu gabinete.</p>
          )}
          {aiError && <p className="text-[10px] text-red-200 font-bold mt-2 flex items-center gap-1"><AlertCircle size={10}/> {aiError}</p>}
        </div>
        <button 
          onClick={handleGenerateSummary}
          disabled={isAiLoading}
          className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {aiSummary ? "Atualizar Resumo" : "Gerar Resumo IA"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md border-l-4 border-l-pink-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-pink-500 flex items-center gap-2"><Cake size={16}/> Aniversariantes da Semana</h3>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
            {anniversariesRadar.length > 0 ? anniversariesRadar.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs ${c.daysUntil === 0 ? 'bg-pink-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    {c.daysUntil === 0 ? <Gift size={18}/> : c.name.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                </div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full ${c.daysUntil === 0 ? 'bg-pink-600 text-white' : 'text-pink-500 border border-pink-100'}`}>
                  {c.daysUntil === 0 ? 'HOJE' : `EM ${c.daysUntil}D`}
                </span>
              </div>
            )) : <p className="text-xs text-slate-400 text-center py-10">Nenhum aniversário nos próximos 7 dias</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md border-l-4 border-l-indigo-600">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2"><BellRing size={16}/> Próximos Eventos</h3>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
            {data.appointments.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black">{new Date(a.date).getDate()}</span>
                  <span className="text-[8px] font-bold uppercase">{new Date(a.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Cidadãos" value={data.citizens.length} icon={Users} color="bg-indigo-600" />
        <StatCard title="Pendências" value={data.demands.filter(d => d.status !== 'Resolvida').length} icon={ClipboardList} color="bg-blue-600" />
        <StatCard title="Resolvidos" value={data.demands.filter(d => d.status === 'Resolvida').length} icon={CheckCircle2} color="bg-emerald-600" />
        <StatCard title="Docs" value={data.documents.length} icon={FileText} color="bg-slate-700" />
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2"><TrendingUp size={16} /> Fluxo de Demandas</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demandStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {demandStats.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-3xl shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{value}</h3>
      </div>
      <div className={`${color} p-2.5 rounded-xl text-white shadow-lg shrink-0`}><Icon size={18} /></div>
    </div>
  </div>
);

export default DashboardTab;
