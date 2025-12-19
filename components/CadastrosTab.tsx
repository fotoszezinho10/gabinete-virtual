
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  X, 
  Pencil, 
  FilePlus, 
  Trash2,
  Loader2,
  Mail,
  MessageCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ClipboardList,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getAllData, crud, subscribeToChanges } from '../storageService';
import { Citizen, Demand, StorageData, DemandPriority, DemandStatus } from '../types';

const CadastrosTab: React.FC = () => {
  const [data, setData] = useState<StorageData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const sync = async () => {
    try {
      const result = await getAllData();
      setData(result);
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sync();
    const subCitizens = subscribeToChanges('citizens', sync);
    const subDemands = subscribeToChanges('demands', sync);
    
    return () => {
      subCitizens.unsubscribe();
      subDemands.unsubscribe();
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-indigo-600" />
        <p>Carregando cadastros...</p>
      </div>
    );
  }

  const filtered = data.citizens.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = c.name.toLowerCase().includes(term);
    const numericTerm = searchTerm.replace(/\D/g, '');
    const cpfMatch = numericTerm !== '' && c.cpf.replace(/\D/g, '').includes(numericTerm);
    return nameMatch || cpfMatch;
  });

  const getCitizenDemands = (citizenId: string) => {
    return data.demands.filter(d => d.citizenId === citizenId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const exportToCSV = () => {
    if (!data.citizens.length) return;
    const headers = ["Nome", "CPF", "Data Nascimento", "Telefone", "CEP", "Bairro", "Cidade", "UF"];
    const rows = data.citizens.map(c => [
      c.name, c.cpf, c.birthDate, c.phone, c.address?.cep, c.address?.bairro, c.address?.localidade, c.address?.uf
    ]);
    const csvContent = [headers.join(";"), ...rows.map(row => row.map(val => `"${val}"`).join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contatos_gabinete_${new Date().getTime()}.csv`;
    link.click();
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    setShowExportOptions(false);
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert("Por favor, permita pop-ups para gerar o PDF.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Cadastros - Gabinete Virtual</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .header-info h1 { margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 900; }
            .header-info p { margin: 5px 0 0; font-size: 12px; font-weight: bold; color: #64748b; }
            .meta { text-align: right; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 900; padding: 12px; border: 1px solid #cbd5e1; }
            td { padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; vertical-align: top; }
            .font-bold { font-weight: bold; }
            footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-info">
              <h1>Relatório de Cadastros</h1>
              <p>Gabinete Virtual • Gerado em ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div class="meta">
              <p>Estado do Rio de Janeiro</p>
              <p>Câmara Municipal de Nova Friburgo</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Cidadão</th>
                <th>Contato</th>
                <th>Endereço e Localidade</th>
              </tr>
            </thead>
            <tbody>
              ${data.citizens.map(c => `
                <tr>
                  <td><div class="font-bold">${c.name}</div><div style="font-size: 9px; color: #64748b;">CPF: ${c.cpf}</div></td>
                  <td>${c.phone}</td>
                  <td>
                    <div class="font-bold">${c.address?.logradouro || ''}, ${c.address?.numero || ''}</div>
                    <div>${c.address?.bairro || ''} - ${c.address?.localidade || ''}/${c.address?.uf || ''}</div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <footer>
            DOCUMENTO GERADO PELO SISTEMA GABINETE VIRTUAL - GESTÃO PARLAMENTAR INTELIGENTE
          </footer>
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

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    const form = e.target.form;
    if (cep.length === 8 && form) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const json = await res.json();
        if (!json.erro) {
          const mappings: Record<string, string> = {
            'logradouro': json.logradouro,
            'bairro': json.bairro,
            'localidade': json.localidade,
            'uf': json.uf
          };
          
          Object.keys(mappings).forEach(name => {
            const input = form.elements.namedItem(name) as HTMLInputElement;
            if (input) input.value = mappings[name];
          });
        }
      } catch (err) { 
        console.error("Erro ao buscar CEP:", err); 
      } finally { 
        setCepLoading(false); 
      }
    }
  };

  const onCitizenSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const id = selectedCitizen?.id || crypto.randomUUID();
    
    const citizen: Citizen = {
      id,
      name: f.get('name') as string,
      birthDate: f.get('birthDate') as string,
      cpf: f.get('cpf') as string,
      susCard: f.get('susCard') as string,
      phone: f.get('phone') as string,
      demands: selectedCitizen?.demands || [],
      address: {
        cep: f.get('cep') as string,
        logradouro: f.get('logradouro') as string,
        bairro: f.get('bairro') as string,
        localidade: f.get('localidade') as string,
        uf: f.get('uf') as string,
        numero: f.get('numero') as string,
        complemento: f.get('complemento') as string,
      }
    };
    
    try {
      await crud.upsertCitizen(citizen);
      setIsModalOpen(false);
      setSelectedCitizen(null);
      await sync();
    } catch (err) {
      alert("Erro ao salvar cadastro.");
    }
  };

  const onDemandSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    const demand: Demand = {
      id: crypto.randomUUID(),
      citizenId: selectedCitizen?.id,
      citizenName: selectedCitizen?.name,
      title: f.get('title') as string,
      description: f.get('description') as string,
      status: 'Não iniciada',
      priority: f.get('priority') as DemandPriority,
      responsible: f.get('responsible') as string,
      createdAt: now,
      updatedAt: now
    };
    try {
      await crud.upsertDemand(demand);
      setIsDemandModalOpen(false);
      if (!isViewModalOpen) setSelectedCitizen(null);
      await sync();
    } catch (err) {
      alert("Erro ao salvar demanda.");
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleaned}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por Nome ou CPF..." 
            className="w-full pl-10 pr-4 py-2.5 border dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-semibold border dark:border-slate-700 text-sm"
            >
              Exportar <ChevronDown size={14} />
            </button>
            {showExportOptions && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button onClick={exportToCSV} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-bold uppercase">
                  <FileSpreadsheet size={16} className="text-emerald-500" /> Excel (CSV)
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t dark:border-slate-700 text-xs font-bold uppercase">
                  <Printer size={16} className="text-indigo-500" /> Imprimir / PDF
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => { setSelectedCitizen(null); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all font-semibold text-sm"
          >
            <Plus size={18} /> Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 print:hidden">
        {filtered.map(c => (
          <div 
            key={c.id} 
            onClick={() => { setSelectedCitizen(c); setIsViewModalOpen(true); }}
            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="p-4 md:p-5 flex items-start gap-4 md:gap-5">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 dark:bg-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                <User size={24} className="md:size-[28px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col xs:flex-row justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg truncate leading-tight">{c.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">CPF: {c.cpf}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openWhatsApp(c.phone)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition" title="WhatsApp">
                      <MessageCircle size={16} />
                    </button>
                    <button onClick={() => { setSelectedCitizen(c); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => { setSelectedCitizen(c); setIsDemandModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition" title="Nova Demanda">
                      <FilePlus size={16} />
                    </button>
                    <button onClick={() => { if(confirm('Excluir ficha?')) crud.deleteCitizen(c.id); }} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2 mt-3 md:mt-4">
                  <Badge icon={Phone} label={c.phone} />
                  <Badge icon={MapPin} label={c.address?.bairro || 'Não informado'} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border-2 border-dashed dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400 font-medium">Nenhum cadastro encontrado.</p>
          </div>
        )}
      </div>

      {isViewModalOpen && selectedCitizen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh] md:max-h-[90vh]">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                  <User size={24} className="md:size-[32px]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-xl md:text-2xl text-slate-800 dark:text-white leading-tight truncate mb-0.5">{selectedCitizen.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>CPF: {selectedCitizen.cpf}</span>
                    <span className="hidden xs:inline w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="truncate">Nasc: {selectedCitizen.birthDate ? new Date(selectedCitizen.birthDate).toLocaleDateString('pt-BR') : '---'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 md:p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:scale-110 transition shrink-0 ml-4">
                <X size={20} className="md:size-[24px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 bg-white dark:bg-slate-950">
              <div className="space-y-6 md:space-y-8">
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4 md:mb-5 flex items-center gap-2">
                    <MapPin size={14}/> Localização e Contato
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <InfoRow label="Telefone" value={selectedCitizen.phone} />
                    <InfoRow label="Bairro" value={selectedCitizen.address?.bairro || '---'} />
                    <InfoRow label="Cidade" value={`${selectedCitizen.address?.localidade || '---'}/${selectedCitizen.address?.uf || '---'}`} />
                    <InfoRow label="Endereço" value={`${selectedCitizen.address?.logradouro || '---'}, ${selectedCitizen.address?.numero || '---'}`} />
                    <InfoRow label="Complemento" value={selectedCitizen.address?.complemento || '-'} />
                    <InfoRow label="Cartão SUS" value={selectedCitizen.susCard || '-'} />
                  </div>
                </section>
                <div className="pt-2 flex flex-col gap-3">
                  <button 
                    onClick={() => { setIsViewModalOpen(false); setIsModalOpen(true); }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 transition text-sm"
                  >
                    <Pencil size={14}/> Editar Ficha
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4 md:mb-5 flex items-center gap-2">
                  <History size={14}/> Histórico de Demandas
                </h4>
                <div className="space-y-4 md:space-y-6 relative">
                  <div className="absolute left-4 md:left-5 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  {getCitizenDemands(selectedCitizen.id).length > 0 ? (
                    getCitizenDemands(selectedCitizen.id).map((demand) => (
                      <div key={demand.id} className="relative pl-10 md:pl-12">
                        <div className={`absolute left-2.5 md:left-3.5 top-1.5 w-3 md:w-3.5 h-3 md:h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10 ${
                          demand.status === 'Resolvida' ? 'bg-emerald-500' : 
                          demand.status === 'Não iniciada' ? 'bg-slate-300' : 'bg-blue-500'
                        }`} />
                        <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 p-4 md:p-5 rounded-xl md:rounded-2xl hover:shadow-md transition">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2 md:mb-3">
                            <h5 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200 leading-tight">{demand.title}</h5>
                            <span className="text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 md:py-1 bg-white dark:bg-slate-800 rounded-lg text-slate-400">
                              {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mb-3 md:mb-4 italic line-clamp-3">"{demand.description}"</p>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <StatusBadge status={demand.status} />
                            <PriorityBadge priority={demand.priority} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 md:py-20 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed dark:border-slate-800">
                      <p className="text-slate-400 font-medium text-xs md:text-sm">Nenhuma demanda registrada.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
            <div className="px-6 md:px-8 py-4 md:py-5 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100">{selectedCitizen ? 'Editar Cadastro' : 'Novo Cadastro'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                <X size={20} className="md:size-[24px]" />
              </button>
            </div>
            <form onSubmit={onCitizenSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome Completo" name="name" required defaultValue={selectedCitizen?.name} spanFull />
                <Field label="CPF" name="cpf" required defaultValue={selectedCitizen?.cpf} placeholder="000.000.000-00" />
                <Field label="Data de Nascimento" name="birthDate" type="date" defaultValue={selectedCitizen?.birthDate} />
                <Field label="Cartão SUS" name="susCard" defaultValue={selectedCitizen?.susCard} />
                <Field label="WhatsApp / Telefone" name="phone" required defaultValue={selectedCitizen?.phone} placeholder="(00) 00000-0000" />
                <div className="col-span-full border-t dark:border-slate-800 pt-4 mt-2">
                  <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-3 md:mb-4 tracking-widest">Endereço Residencial</h4>
                </div>
                <div className="col-span-1">
                  <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">CEP</label>
                  <div className="relative">
                    <input 
                      name="cep" 
                      defaultValue={selectedCitizen?.address?.cep} 
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-slate-200 dark:text-slate-100 text-sm"
                    />
                    {cepLoading && <Loader2 size={16} className="absolute right-3 top-3 animate-spin text-indigo-500" />}
                  </div>
                </div>
                <Field label="Logradouro" name="logradouro" defaultValue={selectedCitizen?.address?.logradouro} />
                <Field label="Bairro" name="bairro" defaultValue={selectedCitizen?.address?.bairro} />
                <Field label="Número" name="numero" defaultValue={selectedCitizen?.address?.numero} />
                <Field label="Localidade / Cidade" name="localidade" defaultValue={selectedCitizen?.address?.localidade} />
                <Field label="UF" name="uf" defaultValue={selectedCitizen?.address?.uf} />
                <Field label="Complemento" name="complemento" defaultValue={selectedCitizen?.address?.complemento} spanFull />
              </div>
              <FormActions onCancel={() => setIsModalOpen(false)} />
            </form>
          </div>
        </div>
      )}

      {isDemandModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[95vh] flex flex-col">
            <div className="px-6 md:px-8 py-4 md:py-5 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 truncate">Nova Demanda: {selectedCitizen?.name}</h3>
              <button onClick={() => setIsDemandModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shrink-0 ml-4">
                <X size={20} className="md:size-[24px]" />
              </button>
            </div>
            <form onSubmit={onDemandSubmit} className="p-6 md:p-8 space-y-4 md:space-y-5 overflow-y-auto custom-scrollbar">
              <Field label="Título do Caso" name="title" required placeholder="Ex: Solicitação de exame" spanFull />
              <div>
                <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Prioridade</label>
                <select name="priority" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 border-slate-200 text-sm">
                  <option value="Baixa">Baixa</option>
                  <option value="Média" selected>Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <Field label="Responsável" name="responsible" placeholder="Assessor encarregado" />
              <div>
                <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-1 block tracking-wider">Relato / Descrição</label>
                <textarea name="description" rows={4} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 border-slate-200 text-sm" required />
              </div>
              <FormActions onCancel={() => setIsDemandModalOpen(false)} />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="min-w-0">
    <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">{label}</p>
    <p className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight truncate">{value}</p>
  </div>
);

const PriorityBadge = ({ priority }: { priority: DemandPriority }) => {
  const styles: Record<DemandPriority, string> = {
    'Urgente': 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/30',
    'Alta': 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30',
    'Média': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30',
    'Baixa': 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-900 dark:border-slate-800',
  };
  return <span className={`text-[7px] md:text-[8px] font-black px-1.5 md:py-0.5 rounded border uppercase ${styles[priority]}`}>{priority}</span>;
};

const StatusBadge = ({ status }: { status: DemandStatus }) => {
  const styles: Record<DemandStatus, string> = {
    'Não iniciada': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    'Em andamento': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'Aguardando execução': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'Resolvida': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return <span className={`text-[7px] md:text-[8px] font-black px-1.5 md:py-0.5 rounded-full uppercase ${styles[status]}`}>{status}</span>;
};

const Field = ({ label, name, type = 'text', required = false, defaultValue = '', placeholder = '', spanFull = false }: any) => (
  <div className={spanFull ? 'col-span-full' : 'col-span-1'}>
    <label className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 block tracking-wider">{label}</label>
    <input 
      name={name} 
      type={type} 
      required={required} 
      defaultValue={defaultValue} 
      placeholder={placeholder}
      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-slate-200 dark:text-slate-100 text-sm"
    />
  </div>
);

const Badge = ({ icon: Icon, label }: any) => (
  <span className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] md:text-xs font-medium border border-slate-100 dark:border-slate-700 truncate max-w-[140px] md:max-w-none">
    <Icon size={10} className="md:size-[12px] text-slate-400 dark:text-slate-500 shrink-0" /> <span className="truncate">{label}</span>
  </span>
);

const FormActions = ({ onCancel }: any) => (
  <div className="flex gap-3 pt-6 border-t dark:border-slate-800 mt-4">
    <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition font-bold text-sm">Cancelar</button>
    <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition font-bold text-sm">Confirmar</button>
  </div>
);

export default CadastrosTab;
