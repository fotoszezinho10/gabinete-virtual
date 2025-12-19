
import { createClient } from '@supabase/supabase-js';
import { Citizen, Demand, Appointment, DocumentRecord, StorageData } from './types';

const SUPABASE_URL = 'https://scymggrycoiprthyzjhv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeW1nZ3J5Y29pcHJ0aHl6amh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDIxNDQsImV4cCI6MjA4MTYxODE0NH0.KU2537Fqz1TM2QVfAHWY7rb05OexZ_L2p5hQix2hz_Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const handleSupabaseError = (error: any, context: string) => {
  console.error(`ERRO SUPABASE (${context}):`, error);
  const errorMsg = error?.message || JSON.stringify(error);
  const errorCode = error?.code || 'S/C';
  throw { 
    message: `${context}: ${errorMsg}`, 
    code: errorCode,
    original: error 
  };
};

export const subscribeToChanges = (table: string, callback: () => void) => {
  return supabase
    .channel(`public:${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      callback();
    })
    .subscribe();
};

export const crud = {
  getCitizens: async () => {
    const { data, error } = await supabase.from('citizens').select('*').order('name');
    if (error) handleSupabaseError(error, 'Busca de cidadãos');
    return (data as any[] || []).map(c => ({
      id: c.id,
      name: c.name,
      birthDate: c.birth_date,
      cpf: c.cpf,
      susCard: c.sus_card,
      phone: c.phone,
      address: typeof c.address === 'string' ? JSON.parse(c.address) : c.address,
      demands: c.demands || []
    })) as Citizen[];
  },

  upsertCitizen: async (citizen: Citizen) => {
    const { error } = await supabase.from('citizens').upsert({
      id: citizen.id,
      name: citizen.name,
      birth_date: citizen.birthDate,
      cpf: citizen.cpf,
      sus_card: citizen.susCard,
      phone: citizen.phone,
      address: citizen.address,
      demands: citizen.demands,
      updated_at: new Date().toISOString()
    });
    if (error) handleSupabaseError(error, 'Salvar cidadão');
  },

  getDemands: async () => {
    const { data, error } = await supabase.from('demands').select('*').order('created_at', { ascending: false });
    if (error) handleSupabaseError(error, 'Busca de demandas');
    return (data as any[] || []).map(d => ({
      id: d.id,
      citizenId: d.citizen_id,
      citizenName: d.citizen_name,
      title: d.title,
      description: d.description,
      status: d.status,
      priority: d.priority || 'Média',
      responsible: d.responsible,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    })) as Demand[];
  },

  upsertDemand: async (demand: Demand) => {
    const { error } = await supabase.from('demands').upsert({
      id: demand.id,
      citizen_id: demand.citizenId,
      citizen_name: demand.citizenName,
      title: demand.title,
      description: demand.description,
      status: demand.status,
      priority: demand.priority,
      responsible: demand.responsible,
      created_at: demand.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (error) handleSupabaseError(error, 'Salvar demanda');
  },

  getAppointments: async () => {
    const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: true });
    if (error) handleSupabaseError(error, 'Busca de agenda');
    return (data as any[] || []).map(a => ({
      id: a.id,
      title: a.title,
      date: a.date,
      time: a.time,
      location: a.location,
      description: a.description,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    })) as Appointment[];
  },

  upsertAppointment: async (appt: Appointment) => {
    const payload: any = {
      id: appt.id,
      title: appt.title,
      date: appt.date,
      time: appt.time,
      location: appt.location,
      description: appt.description,
      updated_at: new Date().toISOString()
    };
    if (appt.createdAt) payload.created_at = appt.createdAt;
    const { error } = await supabase.from('appointments').upsert(payload);
    if (error) handleSupabaseError(error, 'Salvar compromisso');
  },

  getDocuments: async () => {
    const { data, error } = await supabase.from('documents').select('*').order('updated_at', { ascending: false });
    if (error) handleSupabaseError(error, 'Busca de documentos');
    return (data as any[] || []).map(doc => ({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      content: doc.content,
      attachments: doc.attachments || [],
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    })) as DocumentRecord[];
  },

  upsertDocument: async (doc: DocumentRecord) => {
    const { error } = await supabase.from('documents').upsert({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      content: doc.content,
      attachments: doc.attachments || [],
      updated_at: new Date().toISOString(),
      created_at: doc.createdAt || new Date().toISOString()
    });
    if (error) handleSupabaseError(error, 'Salvar documento');
  },

  deleteCitizen: async (id: string) => {
    const { error } = await supabase.from('citizens').delete().eq('id', id);
    if (error) handleSupabaseError(error, 'Excluir cidadão');
  },
  deleteDemand: async (id: string) => {
    const { error } = await supabase.from('demands').delete().eq('id', id);
    if (error) handleSupabaseError(error, 'Excluir demanda');
  },
  deleteAppointment: async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) handleSupabaseError(error, 'Excluir compromisso');
  },
  deleteDocument: async (id: string) => {
    console.log(`[STORAGE] Comando DELETE para ID: ${id}`);
    const { error, status } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("[STORAGE] Erro na resposta do Supabase:", error);
      handleSupabaseError(error, 'Excluir documento');
    }
    
    console.log(`[STORAGE] Sucesso na chamada. Status HTTP: ${status}`);
    return true;
  }
};

export const getAllData = async (): Promise<StorageData> => {
  try {
    const [citizens, demands, appointments, documents] = await Promise.all([
      crud.getCitizens(),
      crud.getDemands(),
      crud.getAppointments(),
      crud.getDocuments()
    ]);
    return { citizens, demands, appointments, documents };
  } catch (err: any) {
    console.error("Falha ao carregar dados consolidados:", err);
    return { citizens: [], demands: [], appointments: [], documents: [] };
  }
};
