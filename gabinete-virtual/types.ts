
export type DemandStatus = 'Não iniciada' | 'Em andamento' | 'Aguardando execução' | 'Resolvida';
export type DemandPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface Demand {
  id: string;
  citizenId?: string;
  citizenName?: string;
  title: string;
  description: string;
  status: DemandStatus;
  priority: DemandPriority;
  responsible?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  numero: string;
  complemento?: string;
}

export interface Citizen {
  id: string;
  name: string;
  birthDate: string;
  cpf: string;
  susCard: string;
  phone: string;
  address: Address;
  demands: string[];
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType = 'ofícios' | 'projetos' | 'requerimentos' | 'documentos';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64
}

export interface DocumentRecord {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface StorageData {
  citizens: Citizen[];
  demands: Demand[];
  appointments: Appointment[];
  documents: DocumentRecord[];
}
