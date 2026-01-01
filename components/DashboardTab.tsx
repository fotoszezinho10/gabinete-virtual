
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
  AlertCircle,
  Activity
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
  const [aiUsageCount, setAiUsageCount] = useState(() => Number(sessionStorage.getItem('ai_usage_count') || 0));

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
      const newCount = aiUsageCount + 1;
      setAiUsageCount(newCount);
      sessionStorage.setItem('ai_usage_count', String(newCount));
    } catch (err: any) {
      if (err.message?.includes('429') || err.message?.includes('LIMITE_API_ESTOURADO')) {
        setAiError("Limite gratuito atingido. Considere ativar o faturamento no AI Studio para uso ilimitado.");
      } else {
        setAiError("Erro ao gerar análise.");
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
  const demandStats = [
    { name: 'Pendente', value: data.demands.filter(d => d.status === 'Não iniciada').length, color: '#94a3b8' },
    { name: 'Em Curso', value: data.demands.filter(d => d.status === 'Em andamento').length, color: '#3b82f6' },
    { name: 'Espera', value: data.demands.filter(d => d.status === 'Aguardando execução').length, color: '#f59e0b' },
    { name: 'Resolvida', value: data.demands.filter(d => d.status === 'Resolvida').length, color: '#22c55e' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <Sparkles size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-indigo-500 text-indigo-100 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Inteligência Legislativa</span>
              {aiUsageCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-200">
                  <Activity size={12}/> {aiUsageCount} chamadas IA nesta sessão
                </span>
              )}
            </div>
            <h4 className="text-3xl font-black mb-3 leading-tight">Como está o Gabinete hoje?</h4>
            {aiSummary ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 italic text-sm leading-relaxed text-indigo-50">
                "{aiSummary}"
              </div>
            ) : (
              <p className="text-indigo-100 opacity-80 max-w-xl">Use a inteligência artificial para analisar o volume de demandas e identificar os bairros que precisam de mais atenção nesta semana.</p>
            )}
            {aiError && (
              <div className="mt-4 flex items-center gap-2 text-red-200 font-bold text-xs bg-red-900/20 p-3 rounded-xl border border-red-500/20">
                <AlertCircle size={16}/> {aiError}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleGenerateSummary}
            disabled={isAiLoading}
            className="group bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 shrink-0"
          >
            {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
            {aiSummary ? "Reavaliar Status" : "Gerar Análise IA"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm border-l-4 border-l-pink-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-pink-500 flex items-center gap-2"><Cake size={16}/> Aniversariantes da Semana</h3>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
            {anniversariesRadar.length > 0 ? anniversariesRadar.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs ${c.daysUntil === 0 ? 'bg-pink-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    {c.daysUntil === 0 ? <Gift size={18}/> : c.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{c.address?.bairro || 'Sem bairro'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${c.daysUntil === 0 ? 'bg-pink-600 text-white' : 'text-pink-500 border border-pink-100 dark:border-pink-900/30'}`}>
                    {c.daysUntil === 0 ? 'HOJE' : `EM ${c.daysUntil} DIAS`}
                  </span>
                  {c.phone && <button onClick={() => window.open(`https://wa.me/55${c.phone.replace(/\D/g,'')}`, '_blank')} className="mt-1 text-emerald-500 hover:text-emerald-600"><MessageCircle size={14}/></button>}
                </div>
              </div>
            )) : <div className="text-center py-12 text-slate-400 text-xs italic">Nenhum aniversário próximo</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm border-l-4 border-l-indigo-600">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2"><BellRing size={16}/> Próximos Compromissos</h3>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
            {data.appointments.length > 0 ? data.appointments.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border dark:border-slate-700">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex flex-col items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-[10px] font-black">{new Date(a.date).getDate()}</span>
                  <span className="text-[8px] font-bold uppercase">{new Date(a.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{a.title}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10}/> {a.time} • {a.location}</span>
                </div>
              </div>
            )) : <div className="text-center py-12 text-slate-400 text-xs italic">Agenda livre para hoje</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Cidadãos" value={data.citizens.length} icon={Users} color="bg-indigo-600" />
        <StatCard title="Pendentes" value={data.demands.filter(d => d.status !== 'Resolvida').length} icon={ClipboardList} color="bg-blue-600" />
        <StatCard title="Demandas OK" value={data.demands.filter(d => d.status === 'Resolvida').length} icon={CheckCircle2} color="bg-emerald-600" />
        <StatCard title="Acervo Digital" value={data.documents.length} icon={FileText} color="bg-slate-700" />
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><TrendingUp size={16} /> Status de Atendimento</h3>
          <div className="flex gap-4">
            {demandStats.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}} />
                <span className="text-[9px] font-bold text-slate-400 uppercase">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demandStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={50}>
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
  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{value}</h3>
      </div>
      <div className={`${color} p-3 rounded-2xl text-white shadow-lg shrink-0 transition-transform group-hover:scale-110`}><Icon size={20} /></div>
    </div>
  </div>
);

export default DashboardTab;
