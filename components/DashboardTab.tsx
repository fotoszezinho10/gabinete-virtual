
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
  Send
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
import { StorageData, Citizen, Appointment } from '../types';

const DashboardTab: React.FC = () => {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);

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
      <p className="font-medium animate-pulse">Gerando inteligência estratégica...</p>
    </div>
  );

  const getUpcomingAnniversaries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return data.citizens.map(c => {
      if (!c.birthDate) return null;
      const [y, m, d] = c.birthDate.split('-').map(Number);
      const birthDateThisYear = new Date(today.getFullYear(), m - 1, d);
      
      if (birthDateThisYear < today) {
        birthDateThisYear.setFullYear(today.getFullYear() + 1);
      }
      
      const diffTime = birthDateThisYear.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return { ...c, daysUntil: diffDays };
    })
    .filter((c): c is (Citizen & { daysUntil: number }) => c !== null && c.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return data.appointments
      .filter(a => {
        const apptDate = new Date(`${a.date}T${a.time}`);
        return apptDate >= now;
      })
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
      .slice(0, 5);
  };

  const anniversariesRadar = getUpcomingAnniversaries();
  const nextAppointments = getUpcomingAppointments();
  const birthdaysTodayCount = anniversariesRadar.filter(c => c.daysUntil === 0).length;

  const heatmapData = Object.entries(data.citizens.reduce((acc: Record<string, number>, c) => {
    const bairro = c.address?.bairro || 'Não informado';
    acc[bairro] = (acc[bairro] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([name, count]) => ({ 
    name, 
    count: count as number 
  }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 5);

  const demandStats = [
    { name: 'Não iniciada', value: data.demands.filter(d => d.status === 'Não iniciada').length, color: '#94a3b8' },
    { name: 'Em andamento', value: data.demands.filter(d => d.status === 'Em andamento').length, color: '#3b82f6' },
    { name: 'Aguardando', value: data.demands.filter(d => d.status === 'Aguardando execução').length, color: '#f59e0b' },
    { name: 'Resolvida', value: data.demands.filter(d => d.status === 'Resolvida').length, color: '#22c55e' },
  ];

  const sendBirthdayWish = (citizen: Citizen) => {
    const cleaned = citizen.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Estou sabendo que hoje é seu aniversário! Gostaria de desejar muitas felicidades e realizações em sua caminhada. Que este novo ciclo que se inicia seja repleto de saúde, paz e prosperidade. Conte sempre comigo! São os votos do seu amigo, Ghabriel do Zezinho!`);
    window.open(`https://wa.me/55${cleaned}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md border-l-4 border-l-pink-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-pink-500 flex items-center gap-2">
              <Cake size={16}/> Radar de Relacionamento (7 dias)
            </h3>
            {birthdaysTodayCount > 0 && (
              <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Festa Hoje!</span>
            )}
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {anniversariesRadar.length > 0 ? anniversariesRadar.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl group/card hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors border border-transparent hover:border-pink-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs ${c.daysUntil === 0 ? 'bg-pink-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {c.daysUntil === 0 ? <Gift size={18}/> : c.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block truncate max-w-[150px]">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Bairro: {c.address.bairro}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => sendBirthdayWish(c)}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition shadow-sm"
                  >
                    <MessageCircle size={14} /> <span className="hidden sm:inline">Parabenizar</span>
                  </button>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full whitespace-nowrap ${c.daysUntil === 0 ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-700 text-pink-500 border border-pink-100 dark:border-pink-900'}`}>
                    {c.daysUntil === 0 ? 'HOJE' : `EM ${c.daysUntil}D`}
                  </span>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 text-center py-10 italic">Nenhum aniversário nos próximos 7 dias</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md border-l-4 border-l-indigo-600">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <BellRing size={16}/> Próximos Compromissos
            </h3>
            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded-full">Agenda</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {nextAppointments.length > 0 ? nextAppointments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black leading-none">{new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit' })}</span>
                    <span className="text-[8px] font-bold uppercase">{new Date(a.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block truncate">{a.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium"><Clock size={10}/> {a.time}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium truncate"><MapPin size={10}/> {a.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 text-center py-10 italic">Nenhum compromisso agendado</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Cidadãos" value={data.citizens.length} icon={Users} color="bg-indigo-600" />
        <StatCard title="Pendências" value={data.demands.filter(d => d.status !== 'Resolvida').length} icon={ClipboardList} color="bg-blue-600" />
        <StatCard title="Resolvidos" value={data.demands.filter(d => d.status === 'Resolvida').length} icon={CheckCircle2} color="bg-emerald-600" />
        <StatCard title="Documentos" value={data.documents.length} icon={FileText} color="bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <TrendingUp size={16} /> Fluxo de Trabalho (Geral)
            </h3>
            <div className="w-full relative" style={{ minHeight: '300px', height: '300px' }}>
              <ResponsiveContainer width="99%" height="100%" debounce={50}>
                <BarChart data={demandStats} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {demandStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Flame size={16} className="text-orange-500" /> Top Bairros Atendidos
            </h3>
            <div className="space-y-4">
              {heatmapData.map((b) => {
                const firstCount = (heatmapData[0]?.count as number) || 1;
                const percentage = firstCount > 0 ? (((b.count as number) / firstCount) * 100) : 0;
                return (
                  <div key={b.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {b.name}</span>
                      <span>{b.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-bold mb-1 flex items-center gap-2">Gabinete IA <Sparkles size={14}/></h4>
              <p className="text-xs opacity-80 leading-relaxed">O sistema de IA analisa seus dados e sugere ações de base eleitoral com base no seu fluxo.</p>
            </div>
            <Sparkles className="absolute -bottom-2 -right-2 text-white/10 w-24 h-24 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{value}</h3>
      </div>
      <div className={`${color} p-2.5 rounded-xl text-white shadow-lg shrink-0`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

export default DashboardTab;
