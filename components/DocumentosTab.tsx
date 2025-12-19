
import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  Search, 
  Plus, 
  ArrowLeft, 
  Sparkles, 
  Save, 
  Trash2,
  X,
  ChevronRight,
  Loader2,
  Camera,
  Scan,
  Printer,
  FileDown,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  FileText as FilePdf,
  AlertTriangle,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { crud, subscribeToChanges } from '../storageService';
import { DocumentRecord, DocumentType, Attachment } from '../types';
import { generateDocumentContent, analyzeDocumentImage } from '../geminiService';

const DocumentosTab: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DocumentType | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showRlsWarning, setShowRlsWarning] = useState(false);
  
  // Ref para controlar se o Realtime deve atualizar a lista
  const blockRealtimeUpdates = useRef(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    // Se estivermos no meio de uma deleção, ignoramos atualizações externas
    if (blockRealtimeUpdates.current) return;
    
    try {
      const data = await crud.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Erro ao carregar biblioteca:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const subscription = subscribeToChanges('documents', load);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePrint = () => {
    if (!editingDoc) return;
    
    const content = editorRef.current?.innerHTML || editingDoc.content;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    if (!printWindow) {
      alert("O bloqueador de pop-ups impediu a impressão. Por favor, autorize pop-ups para este site.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${editingDoc.title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0; 
              padding: 0;
              background-color: white;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 10mm auto;
              background: white;
              box-sizing: border-box;
            }
            .content {
              font-size: 14pt;
              line-height: 1.6;
              text-align: justify;
              color: black;
            }
            footer {
              margin-top: 50px;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            .line {
              width: 150px;
              height: 1px;
              background: black;
              margin: 20px auto;
            }
            .footer-text {
              font-size: 10pt;
              color: #444;
            }
            @media print {
              body { margin: 0; }
              .page { margin: 0; border: none; width: 100%; }
              @page { size: A4; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="content">${content}</div>
            <footer>
              <div class="line"></div>
              <div class="footer-text">
                <strong>ESTADO DO RIO DE JANEIRO</strong><br>
                Câmara Municipal de Nova Friburgo<br>
                Gabinete do Vereador Ghabriel do Zezinho
              </div>
            </footer>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSave = async () => {
    if (!editingDoc || isSaving) return;
    
    setIsSaving(true);
    const content = editorRef.current?.innerHTML || editingDoc.content;
    const docToSave = { 
      ...editingDoc, 
      content, 
      updatedAt: new Date().toISOString() 
    };
    
    try {
      await crud.upsertDocument(docToSave);
      setEditingDoc(null);
      await load();
      alert("✓ Documento salvo com sucesso!");
    } catch (err: any) {
      console.error("Erro no salvamento:", err);
      if (err.code === '42501') {
        setShowRlsWarning(true);
      } else {
        alert(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (deletingId) return;
    if (!window.confirm('Cuidado: O documento será apagado permanentemente. Confirmar exclusão?')) return;
    
    console.log(`[UI] Iniciando exclusão do documento: ${id}`);
    
    // Passo 1: Bloquear atualizações automáticas do Realtime
    blockRealtimeUpdates.current = true;
    
    // Passo 2: Backup e Remoção imediata da tela
    const backupDocuments = [...documents];
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (editingDoc?.id === id) setEditingDoc(null);
    setDeletingId(id);

    try {
      // Passo 3: Sincroniza com o servidor
      await crud.deleteDocument(id);
      console.log(`[UI] Servidor confirmou a exclusão de ${id}`);
      
      // Aguarda um pouco para o banco se estabilizar
      await new Promise(r => setTimeout(r, 800));
    } catch (err: any) {
      console.error("[UI] Servidor rejeitou a exclusão. Revertendo.", err);
      setDocuments(backupDocuments);
      
      if (err.code === '42501' || err.code === 'PGRST301') {
        setShowRlsWarning(true);
      } else {
        alert(`Não foi possível apagar: ${err.message}`);
      }
    } finally {
      // Passo 4: Liberar atualizações e limpar estados
      setDeletingId(null);
      blockRealtimeUpdates.current = false;
      // Recarrega a lista final para garantir integridade
      load();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDoc) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      };

      setEditingDoc({
        ...editingDoc,
        attachments: [...(editingDoc.attachments || []), newAttachment]
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const removeAttachment = (id: string) => {
    if (!editingDoc) return;
    setEditingDoc({
      ...editingDoc,
      attachments: (editingDoc.attachments || []).filter(a => a.id !== id)
    });
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt || !editingDoc) return;
    setIsAiLoading(true);
    try {
      const result = await generateDocumentContent(aiPrompt, editingDoc.type);
      if (editorRef.current) {
        editorRef.current.innerHTML = result;
      }
      setEditingDoc(prev => prev ? { ...prev, content: result } : null);
    } catch (e) {
      alert("Erro ao conectar com a IA.");
    } finally {
      setIsAiLoading(false);
      setAiPrompt('');
    }
  };

  const startCamera = async () => {
    setIsScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Acesso à câmera negado.");
      setIsScannerOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setIsScannerOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
    stopCamera();
    try {
      const result = await analyzeDocumentImage(base64);
      setEditingDoc({
        id: crypto.randomUUID(),
        type: 'documentos',
        title: result.title,
        content: result.content,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      alert("Falha no scanner.");
    } finally {
      setIsCapturing(false);
    }
  };

  const exportAsDoc = () => {
    if (!editingDoc) return;
    const content = editorRef.current?.innerHTML || editingDoc.content;
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
    const postHtml = "</body></html>";
    const blob = new Blob(['\ufeff', preHtml + content + postHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${editingDoc.title}.doc`;
    link.click();
  };

  const folders: { id: DocumentType; label: string }[] = [
    { id: 'ofícios', label: 'Ofícios' },
    { id: 'projetos', label: 'Projetos' },
    { id: 'requerimentos', label: 'Requerimentos' },
    { id: 'documentos', label: 'Outros Documentos' },
  ];

  const filteredDocs = documents.filter(doc => 
    (!currentFolder || doc.type === currentFolder) &&
    (doc.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = () => {
    if (!currentFolder) return;
    setEditingDoc({
      id: crypto.randomUUID(),
      type: currentFolder,
      title: 'Novo Documento',
      content: `<p style="text-align: right;">Nova Friburgo, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p><br/><br/><p><b>Documento Oficial</b></p><br/><p>Ao Senhor(a),<br/>Responsável</p><br/><p>[Inicie seu texto aqui...]</p>`,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  if (loading && !editingDoc) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Loader2 className="animate-spin text-blue-600" />
      <p>Acessando biblioteca...</p>
    </div>
  );

  if (editingDoc) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b dark:border-slate-800 pb-4 mb-4 gap-3">
          <button onClick={() => setEditingDoc(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold p-2 transition-colors">
            <ArrowLeft size={20}/> Voltar
          </button>
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95"
            >
              <FilePdf size={18} className="text-red-400"/> Imprimir / PDF
            </button>
            
            <button 
              onClick={exportAsDoc} 
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold border dark:border-slate-700 hover:bg-slate-200 transition-all"
            >
              <FileDown size={18}/> Word (.doc)
            </button>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />

            <button 
              onClick={(e) => handleDelete(editingDoc.id, e)} 
              disabled={!!deletingId}
              className={`p-2.5 rounded-xl transition-all disabled:opacity-50 ${deletingId === editingDoc.id ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 hover:bg-red-50'}`}
              title="Excluir permanentemente"
            >
              {deletingId === editingDoc.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
            </button>

            <button 
              onClick={handleSave} 
              disabled={isSaving || !!deletingId}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
              Salvar na Nuvem
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          <div className="w-full lg:w-80 border dark:border-slate-800 rounded-3xl p-6 bg-slate-50 dark:bg-slate-900/50 space-y-8 shrink-0 overflow-y-auto custom-scrollbar shadow-inner">
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600"/> Assistente de Redação
              </h4>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Refine o texto para um tom mais oficial..."
                className="w-full p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl text-xs h-32 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
              />
              <button 
                onClick={handleGenerateAI}
                disabled={isAiLoading || !aiPrompt}
                className="w-full mt-3 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={14}/>} Processar com IA
              </button>
            </div>

            <div className="pt-6 border-t dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Paperclip size={14} className="text-indigo-500"/> Anexos Digitalizados
                </h4>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={16}/>
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
              <div className="space-y-2">
                {editingDoc.attachments && editingDoc.attachments.length > 0 ? editingDoc.attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-sm group">
                    <div className="flex items-center gap-2 truncate">
                      {att.type.startsWith('image/') ? <ImageIcon size={14} className="text-blue-500"/> : <FileIcon size={14} className="text-slate-400"/>}
                      <span className="text-[10px] font-bold truncate max-w-[120px] dark:text-slate-200">{att.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={att.data} download={att.name} className="p-1 text-slate-400 hover:text-indigo-500"><Download size={14}/></a>
                      <button onClick={() => removeAttachment(att.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 border-2 border-dashed dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-800/10">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sem anexos</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-6 border-t dark:border-slate-800">
               <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Título do Arquivo</label>
               <input 
                value={editingDoc.title} 
                onChange={(e) => setEditingDoc({...editingDoc, title: e.target.value})} 
                className="w-full p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100" 
              />
            </div>
          </div>

          <div className="flex-1 bg-slate-200 dark:bg-slate-950/50 p-4 md:p-10 overflow-y-auto custom-scrollbar rounded-[2rem] shadow-inner">
            <div className="w-full max-w-[210mm] bg-white shadow-2xl min-h-[297mm] mx-auto flex flex-col border border-slate-300 relative">
              <div className="flex-1">
                <div 
                  ref={editorRef}
                  contentEditable
                  className="px-16 py-20 outline-none prose prose-slate max-w-none text-slate-900 text-justify leading-relaxed text-[14px] font-['Inter',_sans-serif]"
                  style={{ minHeight: '800px', paddingBottom: '160px' }}
                  dangerouslySetInnerHTML={{ __html: editingDoc.content }}
                />
              </div>
              <footer className="px-12 py-12 text-center mt-auto bg-white border-t border-slate-50">
                <div className="w-32 h-[1.5px] bg-slate-900 mx-auto mb-4"></div>
                <div className="text-[10px] text-slate-600 font-medium space-y-0.5">
                  <p className="font-black text-slate-900 uppercase">Estado do Rio de Janeiro</p>
                  <p className="font-bold">Câmara Municipal de Nova Friburgo</p>
                  <p>Rua Farinha Filho, 50 - Centro, Nova Friburgo - RJ, 28610-280</p>
                  <p className="text-[8px] text-slate-400 mt-2 italic tracking-tighter uppercase">Gabinete do Vereador Ghabriel do Zezinho • Gabinete Virtual v2.5</p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <button onClick={() => setCurrentFolder(null)} className="hover:text-blue-600 transition">Biblioteca</button>
        {currentFolder && (
          <><ChevronRight size={14}/><span className="text-slate-900 dark:text-slate-100 capitalize">{currentFolder}</span></>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Procurar documentos..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition" title="Recarregar Biblioteca">
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={startCamera} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-md"><Camera size={20} /> Scanner IA</button>
          {currentFolder && (
            <button onClick={handleCreateNew} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"><Plus size={20} /> Novo Arquivo</button>
          )}
        </div>
      </div>

      {showRlsWarning && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-6 rounded-[2rem] animate-in zoom-in-95 flex flex-col md:flex-row gap-6 items-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-2xl shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-red-800 dark:text-red-400 text-lg mb-2">Segurança Ativa no Banco</h4>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mb-4">
              O Supabase bloqueou a exclusão. Execute este comando no <b>SQL Editor</b> do painel Supabase:
            </p>
            <div className="bg-black/90 p-4 rounded-xl font-mono text-xs text-emerald-400 border border-white/10 relative group">
              <code>ALTER TABLE documents DISABLE ROW LEVEL SECURITY;</code>
              <button 
                onClick={() => { navigator.clipboard.writeText('ALTER TABLE documents DISABLE ROW LEVEL SECURITY;'); alert('Copiado!'); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white text-[10px]"
              >
                Copiar
              </button>
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase text-red-500">Isso permitirá que os arquivos sejam apagados da nuvem.</p>
          </div>
          <button onClick={() => setShowRlsWarning(false)} className="p-2 text-red-400 hover:text-red-600">
            <X size={20}/>
          </button>
        </div>
      )}

      {!currentFolder ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {folders.map(folder => (
            <button key={folder.id} onClick={() => setCurrentFolder(folder.id)} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-8 rounded-3xl hover:shadow-xl transition group flex flex-col items-center gap-4 text-center border-b-4 border-b-transparent hover:border-b-blue-600 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition">
                <Folder size={32} className="text-blue-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{folder.label}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase">{documents.filter(d => d.type === folder.id).length} arquivos</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="divide-y dark:divide-slate-800">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group" onClick={() => setEditingDoc(doc)}>
                <div className="flex items-center gap-4">
                  <div className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl"><FileText size={24}/></div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{doc.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Modificado em {new Date(doc.updatedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(doc.id, e)} 
                  disabled={!!deletingId}
                  className={`p-3 rounded-xl transition-all ${deletingId === doc.id ? 'bg-red-500 text-white' : 'text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                >
                  {deletingId === doc.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20}/>}
                </button>
              </div>
            ))}
            {filteredDocs.length === 0 && <div className="py-20 text-center text-slate-400 italic font-medium">Pasta vazia. Clique em "Novo Arquivo" para começar.</div>}
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100] p-4">
          <div className="relative w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover" />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8">
              <button onClick={stopCamera} className="bg-white/10 p-4 rounded-full text-white"><X size={24} /></button>
              <button onClick={capturePhoto} disabled={isCapturing} className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                {isCapturing ? <Loader2 size={32} className="animate-spin text-blue-500" /> : <Scan size={32} className="text-slate-800" />}
              </button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {deletingId && (
        <div className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-[200]">
          <Loader2 className="animate-spin" size={20} />
          <div className="flex flex-col">
            <span className="text-sm font-bold">Limpando Servidor...</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Sincronizando nuvem</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosTab;
