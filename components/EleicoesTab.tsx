
import React, { useState } from 'react';
import { 
  History, 
  Search, 
  TrendingUp, 
  BarChart, 
  MapPin, 
  User, 
  ChevronRight, 
  Sparkles,
  Loader2,
  ExternalLink,
  Bot,
  Send,
  Medal,
  Award,
  Star,
  Target,
  Lightbulb,
  Info
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface HistoricalHighlight {
  year: string;
  candidate: string;
  role: string;
  votes: string;
  percent: string;
  status: string;
  scope: 'Municipal' | 'Estadual' | 'Federal';
  context?: string;
  totalVotes?: string;
}

const EleicoesTab: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [iaInput, setIaInput] = useState('');
  const [iaResponse, setIaResponse] = useState('');
  const [isIaLoading, setIsIaLoading] = useState(false);

  const years = ['2016', '2018', '2020', '2022', '2024'];

  const cabinetHighlights: HistoricalHighlight[] = [
    { year: '2016', candidate: 'Zezinho do Caminhão', role: 'Vereador', votes: '1.654', percent: '1,64%', status: 'Eleito', scope: 'Municipal' },
    { 
      year: '2018', 
      candidate: 'Áureo Ribeiro', 
      role: 'Dep. Federal', 
      votes: '312', 
      percent: '0,32%', 
      status: 'Eleito', 
      scope: 'Federal', 
      context: 'Votos em Nova Friburgo',
      totalVotes: '68.414'
    },
    { year: '2020', candidate: 'Zezinho do Caminhão', role: 'Vereador', votes: '1.427', percent: '1,51%', status: 'Eleito', scope: 'Municipal' },
    { 
      year: '2022', 
      candidate: 'Áureo Ribeiro', 
      role: 'Dep. Federal', 
      votes: '159', 
      percent: '0,15%', 
      status: 'Eleito', 
      scope: 'Federal', 
      context: 'Votos em Nova Friburgo',
      totalVotes: '103.321'
    },
    { 
      year: '2022', 
      candidate: 'Zezinho do Caminhão', 
      role: 'Dep. Estadual', 
      votes: '14.752', 
      percent: '13,5%', 
      status: 'Suplente', 
      scope: 'Estadual', 
      context: 'Votos em Nova Friburgo',
      totalVotes: '15.699'
    },
    { year: '2024', candidate: 'Ghabriel do Zezinho', role: 'Vereador', votes: '1.541', percent: '1,53%', status: 'Eleito', scope: 'Municipal' },
  ];

  const suggestions = [
    "Qual foi o quociente eleitoral para vereador em 2024 em Friburgo?",
    "Quantos votos o grupo obteve em Nova Friburgo no ano de 2022?",
    "Comparativo de votos nominais: Zezinho (2016/2020) vs Ghabriel (2024).",
    "Analise a Lei Orgânica ou Decretos recentes de Nova Friburgo."
  ];

  const handleIaSearch = async (overrideInput?: string) => {
    const textToSearch = overrideInput || iaInput;
    if (!textToSearch.trim() || isIaLoading) return;
    
    setIsIaLoading(true);
    setIaResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `Você é o "Analista Chefe de Inteligência Política" do Gabinete Virtual em Nova Friburgo, RJ.
      Seu objetivo é analisar dados eleitorais históricos (2016-2024) e legislação municipal com precisão ABSOLUTA.
      
      BASE DE DADOS INTERNA (VERDADE ABSOLUTA - NÃO CONTESTE):
      - 2016: Zezinho do Caminhão (Vereador) -> 1.654 votos (Eleito).
      - 2018: Áureo Ribeiro (Federal) -> 312 votos em Nova Friburgo | 68.414 votos totais no RJ (Eleito).
      - 2020: Zezinho do Caminhão (Vereador) -> 1.427 votos (Eleito).
      - 2022: Áureo Ribeiro (Federal) -> 159 votos em Nova Friburgo | 103.321 votos totais no RJ (Eleito).
      - 2022: Zezinho do Caminhão (Estadual) -> 14.752 votos em Nova Friburgo | 15.699 votos totais no RJ (Suplente).
      - 2024: Ghabriel do Zezinho (Vereador) -> 1.541 votos (Eleito).
      
      FONTES DE REFERÊNCIA PRIORITÁRIAS (USE O GOOGLE SEARCH COM FOCO NESTES DOMÍNIOS):
      
      ELEIÇÕES:
      - 2016: placar.eleicoes.uol.com.br/2016/1turno/rj/nova-friburgo, g1.globo.com/rj/regiao-serrana/eleicoes/2016/apuracao/nova-friburgo.html
      - 2018: especiais.gazetadopovo.com.br/eleicoes/2018/resultados/municipios-rio-de-janeiro/nova-friburgo-rj/
      - 2020: g1.globo.com/rj/regiao-serrana/eleicoes/2020/resultado-das-apuracoes/nova-friburgo.ghtml, noticias.uol.com.br/eleicoes/2020/apuracao/1turno/rj/nova-friburgo/
      - 2022: sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao-resultados/resultado-da-eleição?p0_abrangencia=Município
      - 2024: g1.globo.com/rj/regiao-serrana/eleicoes/2024/resultado-das-apuracoes/nova-friburgo.ghtml, noticias.uol.com.br/eleicoes/2024/apuracao/1turno/rj/nova-friburgo/

      LEGISLAÇÃO DE NOVA FRIBURGO:
      - Cespro (Base de Leis): cespro.com.br/visualizarLegislacao.php?cdMunicipio=6811
      - SAPL (Sistema de Apoio ao Processo Legislativo): sapl.novafriburgo.rj.leg.br/

      SUA MISSÃO:
      1. Use o Google Search para encontrar dados de ADVERSÁRIOS, QUOCIENTE ELEITORAL ou LEIS MUNICIPAIS, priorizando os links acima.
      2. Seja técnico, analítico e cite as fontes explicitamente.
      3. Formate a resposta com análise estratégica, densidade eleitoral e implicações legislativas.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToSearch,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 8000 }
        }
      });

      let text = response.text || "Não foi possível consolidar os dados neste momento.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const links = chunks.map((c: any) => c.web).filter((w: any) => w && w.uri).map((w: any) => `\n- [${w.title}](${w.uri})`).join('');
        if (links) text += `\n\n**Análise baseada em registros oficiais e IA:**${links}`;
      }
      setIaResponse(text);
    } catch (err) {
      setIaResponse("Ocorreu um erro na consulta de inteligência. Por favor, tente novamente.");
    } finally {
      setIsIaLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="text-indigo-600" /> Inteligência Eleitoral
          </h3>
          <p className="text-sm text-slate-500 mt-1 text-balance">Consolidado oficial de desempenho e inteligência de dados (Nova Friburgo)</p>
        </div>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 overflow-x-auto no-scrollbar max-w-full">
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
        
        {/* COLUNA ESQUERDA: NOSSA TRAJETÓRIA */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-6 flex items-center gap-2">
              <Medal size={16}/> Nossa Trajetória
            </h4>
            <div className="space-y-4">
              {cabinetHighlights.map((h, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] ${h.year === selectedYear ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent dark:border-slate-800'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full shadow-sm text-slate-500">{h.year}</span>
                    <div className={`w-2 h-2 rounded-full ${h.scope === 'Federal' ? 'bg-blue-500' : h.scope === 'Estadual' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">{h.candidate}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{h.role}</p>
                  
                  {h.context && (
                    <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase mb-2">
                      <MapPin size={8}/> {h.context}
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Votos (NF)</p>
                      <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{h.votes}</p>
                    </div>
                    <div className="text-right">
                      {h.totalVotes ? (
                         <>
                           <p className="text-[8px] text-slate-400 font-bold uppercase">Total RJ</p>
                           <p className="text-sm font-black text-slate-700 dark:text-slate-200">{h.totalVotes}</p>
                         </>
                      ) : (
                        <>
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Válidos</p>
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200">{h.percent}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t dark:border-slate-700/50 flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase ${h.status === 'Eleito' ? 'text-emerald-500' : 'text-orange-500'}`}>{h.status}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{h.scope}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA CENTRAL: AGENTE IA E DADOS GERAIS */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Agente de Pesquisa Especializado */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 pointer-events-none">
              <Target size={180} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-900/20">
                  <Bot size={32} />
                </div>
                <div>
                  <h4 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Pesquisador Eleitoral e Legislativo</h4>
                  <p className="text-slate-400 text-sm font-medium">Dados auditados TSE e Base Legal Nova Friburgo (Cespro/SAPL)</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={iaInput}
                    onChange={(e) => setIaInput(e.target.value)}
                    placeholder="Compare votações ou pesquise leis de Nova Friburgo..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl px-6 py-5 text-base outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 dark:text-slate-100 transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleIaSearch()}
                  />
                  <button 
                    onClick={() => handleIaSearch()}
                    disabled={isIaLoading || !iaInput.trim()}
                    className="absolute right-3 top-3 p-3 bg-indigo-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {isIaLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                  </button>
                </div>

                {/* Sugestões de Pesquisa */}
                {!iaResponse && !isIaLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.map((s, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setIaInput(s); handleIaSearch(s); }}
                        className="flex items-center gap-3 p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border dark:border-slate-700 rounded-xl transition-all group"
                      >
                        <Lightbulb size={16} className="text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{s}</span>
                      </button>
                    ))}
                  </div>
                )}

                {iaResponse && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-3xl p-8 text-sm leading-relaxed animate-in slide-in-from-top-4 duration-500 shadow-inner">
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-xs md:text-sm">
                      {iaResponse.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">
                          {line.includes('[') ? (
                            line.split(/(\[[^\]]+\]\([^)]+\))/).map((part, j) => {
                              const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                              return match ? (
                                <a key={j} href={match[2]} target="_blank" rel="noopener" className="underline font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1">
                                  {match[1]} <ExternalLink size={10}/>
                                </a>
                              ) : part;
                            })
                          ) : line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <BarChart size={16} className="text-indigo-600" /> Panorama de {selectedYear} (NF)
                </h5>
                <Info size={14} className="text-slate-300" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Votos Válidos Oficiais (NF)</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">~112.500</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Abstenção</p>
                    <p className="text-sm font-black text-red-500">22.4%</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[78%]" />
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium">Dados consolidados do TRE-RJ para Nova Friburgo.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> Indicadores Estratégicos
              </h5>
              <div className="space-y-3">
                <TrendRow label="Concentração em Nova Friburgo" value="84.0%" trend="up" />
                <TrendRow label="Quociente Partidário (Est.)" value="~5.100" trend="neutral" />
                <TrendRow label="Eficiência de Campanha" value="Muito Alta" trend="up" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendRow = ({ label, value, trend }: { label: string, value: string, trend: 'up' | 'down' | 'neutral' }) => (
  <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-xs font-black dark:text-slate-200">{value}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${trend === 'up' ? 'bg-emerald-500' : trend === 'down' ? 'bg-red-500' : 'bg-slate-400'}`} />
    </div>
  </div>
);

export default EleicoesTab;
