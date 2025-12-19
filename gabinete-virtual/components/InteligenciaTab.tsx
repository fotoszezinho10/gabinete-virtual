
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, Bot, User, Trash2, ExternalLink } from 'lucide-react';
import { chatWithCabinetData } from '../geminiService';
import { getAllData } from '../storageService';
import { StorageData } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const InteligenciaTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<StorageData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const result = await getAllData();
      setData(result);
    };
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !data || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithCabinetData(input, data);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Detecção básica de links markdown [Title](URL)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(
          <a 
            key={match.index}
            href={match[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline font-bold"
          >
            {match[1]} <ExternalLink size={10} />
          </a>
        );
        lastIndex = linkRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return <p key={i} className={line.startsWith('---') ? 'border-t dark:border-slate-700 my-4 pt-4' : 'mb-2'}>{parts}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      <div className="p-6 border-b dark:border-slate-800 bg-indigo-50 dark:bg-indigo-900/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-none">Gabinete IA</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">Conectado ao Google Search</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([])} 
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="Limpar Conversa"
        >
          <Trash2 size={18}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
              <Bot size={40} className="text-indigo-600" />
            </div>
            <div className="max-w-xs">
              <p className="font-black text-slate-700 dark:text-slate-300 uppercase text-xs tracking-widest">Consultoria de Dados</p>
              <p className="text-sm text-slate-400 mt-2 italic">Perquise legislação, resuma demandas ou analise tendências por bairro em tempo real.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-4">
              <SuggestionChip text="O que há de novo na legislação de hoje?" onClick={setInput} />
              <SuggestionChip text="Qual o bairro com mais pendências urgentes?" onClick={setInput} />
              <SuggestionChip text="Como está a taxa de resolução do gabinete?" onClick={setInput} />
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-indigo-500'}`}>
                {m.role === 'user' ? <User size={16}/> : <Sparkles size={16}/>}
              </div>
              <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border dark:border-slate-700'
              }`}>
                {m.role === 'assistant' ? formatContent(m.content) : m.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-indigo-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Consultando Google Search...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all border dark:border-slate-700 shadow-inner">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre leis, demandas ou cidadãos..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-slate-700 dark:text-slate-100 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SuggestionChip = ({ text, onClick }: { text: string, onClick: (t: string) => void }) => (
  <button 
    onClick={() => onClick(text)}
    className="text-[10px] font-bold text-left px-4 py-2.5 border dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm uppercase tracking-wider"
  >
    {text}
  </button>
);

export default InteligenciaTab;
