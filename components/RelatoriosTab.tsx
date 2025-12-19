
import React, { useState, useEffect } from 'react';
import { FileDown, Printer, Loader2, Calendar, LayoutDashboard, CheckCircle, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { getAllData } from '../storageService';
import { generateExecutiveSummary } from '../geminiService';
import { StorageData } from '../types';

const RelatoriosTab: React.FC = () => {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await getAllData();
      setData(result);
      setLoading(false);
    };
    load();
  }, []);

  const handlePrint = () => {
    if (!data) return;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert("Por favor, permita pop-ups para gerar o relatório.");
      return;
    }

    const stats = {
      total: data.demands.length,
      resolvidas: data.demands.filter(d => d.status === 'Resolvida').length,
      andamento: data.demands.filter(d => d.status === 'Em andamento').length,
      agendamentos: data.appointments.length
    };

    const neighborhoodData = Object.entries(data.citizens.reduce((acc: any, c) => {
      const bairro = c.address?.bairro || 'Não informado';
      acc[bairro] = (acc[bairro] || 0) + 1;
      return acc;
    }, {})).sort((a: any, b: any) => b[1] - a[1]);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Executivo - Gabinete Virtual</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .header-info h1 { margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 900; }
            .header-info p { margin: 5px 0 0; font-size: 12px; font-weight: bold; color: #64748b; }
            .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 1px solid #e2e8f0; padding: 15px; text-align: center; border-radius: 12px; background: #f8fafc; }
            .stat-val { font-size: 24px; font-weight: 900; color: #4f46e5; }
            .stat-label { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; }
            .ai-summary { background: #eef2ff; border: 1px solid #c7d2fe; padding: 25px; border-radius: 16px; margin-bottom: 40px; }
            .ai-summary h3 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #4338ca; }
            .bairros table { width: 100%; border-collapse: collapse; }
            .bairros th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 10px; border: 1px solid #cbd5e1; }
            .bairros td { padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; }
            footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-info">
              <h1>Relatório de Atividades</h1>
              <p>Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div style="text-align: right; font-size: 10px; font-weight: bold;">CÂMARA MUNICIPAL DE NOVA FRIBURGO</div>
          </div>

          ${aiSummary ? `
            <div class="ai-summary">
              <h3>Resumo Estratégico do Consultor IA</h3>
              <div style="font-size: 13px; font-style: italic;">${aiSummary.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}

          <div class="grid">
            <div class="stat-card"><div class="stat-val">${stats.total}</div><div class="stat-label">Demandas Totais</div></div>
            <div class="stat-card"><div class="stat-val">${stats.resolvidas}</div><div class="stat-label">Resolvidas</div></div>
            <div class="stat-card"><div class="stat-val">${stats.andamento}</div><div class="stat-label">Em Andamento</div></div>
            <div class="stat-card"><div class="stat-val">${stats.agendamentos}</div><div class="stat-label">Compromissos</div></div>
          </div>

          <div class="bairros">
            <h3 style="font-size: 14px; text-transform: uppercase; margin-bottom: 15px;">Distribuição Territorial</h3>
            <table>
              <thead>
                <tr><th>Bairro</th><th>Cidadãos Atendidos</th></tr>
              </thead>
              <tbody>
                ${neighborhoodData.map(([b, c]) => `<tr><td>${b}</td><td><div style="font-weight: bold;">${c}</div></td></tr>`).join('')}
              </tbody>
            </table>
          </div>

          <footer>Gabinete Virtual - Sistema de Gestão Inteligente</footer>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleGenerateSummary = async () => {
    if (!data) return;
    setIsAiLoading(true);
    const summary = await generateExecutiveSummary(data);
    setAiSummary(summary);
    setIsAiLoading(false);
  };

  if (loading || !data) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="animate-spin text-blue-600" />
      <p>Compilando dados para relatório...</p>
    </div>
  );

  const stats = {
    total: data.demands.length,
    resolvidas: data.demands.filter(d => d.status === 'Resolvida').length,
    andamento: data.demands.filter(d => d.status === 'Em andamento').length,
    agendamentos: data.appointments.length
  };

  const neighborhoodData = Object.entries(data.citizens.reduce((acc: any, c) => {
    const bairro = c.address?.bairro || 'Não informado';
    acc[bairro] = (acc[bairro] || 0) + 1;
    return acc;
  }, {})).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-lg print:shadow-none print:border-none">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">Relatório de Atividades</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar size={14} /> Gerado em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 w-full lg:w-auto print:hidden">
            <button 
              onClick={handleGenerateSummary}
              disabled={isAiLoading}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-800 text-sm"
            >
              {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Resumo IA
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all text-sm"
            >
              <Printer size={18} /> Imprimir
            </button>
          </div>
        </div>

        {aiSummary && (
          <div className="mb-8 md:mb-10 p-5 md:p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl animate-in slide-in-from-top-4">
            <h3 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-3 text-sm">
              <TrendingUp size={16} /> Resumo Estratégico do Consultor IA
            </h3>
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {aiSummary}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          <ReportStat label="Totais" value={stats.total} icon={LayoutDashboard} color="text-slate-600" />
          <ReportStat label="Resolvidos" value={stats.resolvidas} icon={CheckCircle} color="text-emerald-500" />
          <ReportStat label="Andamento" value={stats.andamento} icon={Clock} color="text-blue-500" />
          <ReportStat label="Agenda" value={stats.agendamentos} icon={Calendar} color="text-orange-500" />
        </div>

        <div className="space-y-6 md:space-y-8">
          <section>
            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b dark:border-slate-800">Distribuição Territorial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {neighborhoodData.length > 0 ? neighborhoodData.slice(0, 10).map(([b, c]: any) => (
                <div key={b} className="flex justify-between text-xs md:text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-800">
                  <span className="font-medium text-slate-600 dark:text-slate-300 truncate mr-2">{b}</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 shrink-0">{c} Cidadãos</span>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-slate-400 border border-dashed rounded-2xl">Nenhum dado disponível.</div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-12 md:mt-20 pt-8 md:pt-12 border-t dark:border-slate-800 text-center opacity-50">
          <p className="text-xs md:text-sm font-medium">Gabinete Virtual - Sistema de Gestão Inteligente</p>
          <p className="text-[9px] md:text-[10px] mt-1 uppercase font-bold tracking-widest">Câmara Municipal de Nova Friburgo</p>
        </div>
      </div>
    </div>
  );
};

const ReportStat = ({ label, value, icon: Icon, color }: any) => (
  <div className="text-center p-3 md:p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border dark:border-slate-800">
    <Icon size={18} className={`${color} mx-auto mb-2`} />
    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{value}</p>
    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{label}</p>
  </div>
);

export default RelatoriosTab;
