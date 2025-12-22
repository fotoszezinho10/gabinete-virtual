
import React, { useState } from 'react';
import { 
  History, 
  Search, 
  TrendingUp, 
  MapPin, 
  Bot, 
  Send, 
  Medal, 
  Loader2, 
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { searchElectionData } from '../geminiService';

interface HistoricalHighlight {
  year: string;
  candidate: string;
  role: string;
  votes: string;
  percent: string;
  status: string;
  scope: 'Municipal' | 'Estadual' | 'Federal';
}

const EleicoesTab: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [iaInput, setIaInput] = useState('');
  const [iaResponse, setIaResponse] = useState('');
  const [isIaLoading, setIsIaLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const years = ['2016', '2018', '2020', '2022', '2024'];

  const cabinetHighlights: HistoricalHighlight[] = [
    { year: '2016', candidate: 'Zezinho do Caminhão', role: 'Vereador', votes: '1.654', percent: '1,64%', status: 'Eleito', scope: 'Municipal' },
    { year: '2018', candidate: 'Áureo Ribeiro', role: 'Dep. Federal', votes: '312', percent: '0,32%', status: 'Eleito', scope: 'Federal' },
    { year: '2020', candidate: 'Zezinho do Caminhão', role: 'Vereador', votes: '1.427', percent: '1,51%', status: 'Eleito', scope: 'Municipal' },
    { year: '2022', candidate: 'Áureo Ribeiro', role: 'Dep. Federal', votes: '159', percent: '0,15%', status: 'Eleito', scope: 'Federal' },
    { year: '2022', candidate: 'Zezinho do Caminhão', role: 'Dep. Estadual', votes: '14.752', percent: '13,5%', status: 'Suplente', scope: 'Estadual' },
    { year: '2024', candidate: 'Ghabriel do Zezinho', role: 'Vereador', votes: '1.541', percent: '1,53%', status: 'Eleito', scope: 'Municipal' },
  ];

  const suggestions = [
    "Qual foi o quociente eleitoral em 2024 em Friburgo?",
    "Comparativo: Zezinho (2016) vs Ghabriel (2024).",
    "Quantos votos Áureo Ribeiro teve em Friburgo em 2022?",
    "Quais vereadores foram eleitos em 2024 em Nova Friburgo?"
  ];

  const handleIaSearch = async (overrideInput?: string) => {
    const textToSearch = overrideInput || iaInput;
    if (!textToSearch.trim() || isIaLoading) return;
    
    setIsIaLoading(true);
    setIaResponse('');
    setErrorStatus(null);

    try {
      const response = await searchElectionData(textToSearch);
      setIaResponse(response);
    } catch (err: any) {
      if (err.message?.includes('429')) {
        setErrorStatus("O limite de pesquisas gratuitas do Google foi atingido. Aguarde 60 segundos e tente novamente.");
      } else {
        setErrorStatus("Ocorreu um erro inesperado. Verifique sua chave API no Vercel.");
      }
    } finally {
      setIsIaLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="text-indigo-600" /> Inteligência Eleitoral
          </h3>
          <p className="text-sm text-slate-500 mt-1">Dados históricos e comparativos de Nova Friburgo</p>
        </div>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 overflow-x-auto no-scrollbar">
          {years.map(year => (
            <button 
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                selectedYear === year 
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-6 flex items-center gap-2">
              <Medal size={16}/> Histórico do Grupo
            </h4>
            <div className="space-y-4">
              {cabinetHighlights.filter(h => h.year === selectedYear || selectedYear === 'Todas').map((h, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">{h.year}</span>
                    <div className={`w-2 h-2 rounded-full ${h.scope === 'Federal' ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">{h.candidate}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{h.role}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Votos</p>
                      <p className="text-sm font-black text-indigo-600">{h.votes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Resultado</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-200">{h.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg">
                <Bot size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">Pesquisador Eleitoral IA</h4>
                <p className="text-slate-400 text-sm">Analise resultados do TSE e Quocientes Eleitorais</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  value={iaInput}
                  onChange={(e) => setIaInput(e.target.value)}
                  placeholder="Ex: Qual foi a votação do Ghabriel em 2024?"
                  className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl px-6 py-5 text-base outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-slate-100 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleIaSearch()}
                />
                <button 
                  onClick={() => handleIaSearch()}
                  disabled={isIaLoading || !iaInput.trim()}
                  className="absolute right-3 top-3 p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
                >
                  {isIaLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                </button>
              </div>

              {errorStatus && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center gap-3 text-amber-700 dark:text-amber-400 text-sm font-medium">
                  <AlertCircle size={18} />
                  {errorStatus}
                </div>
              )}

              {!iaResponse && !isIaLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { setIaInput(s); handleIaSearch(s); }}
                      className="flex items-center gap-3 p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border dark:border-slate-700 rounded-xl transition-all"
                    >
                      <Lightbulb size={16} className="text-indigo-500" />
                      <span className="text-xs font-bold text-slate-500">{s}</span>
                    </button>
                  ))}
                </div>
              )}

              {iaResponse && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-3xl p-8 text-sm leading-relaxed whitespace-pre-line shadow-inner">
                  {iaResponse}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EleicoesTab;
