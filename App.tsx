
import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardTab from './components/DashboardTab';
import AgendaTab from './components/AgendaTab';
import CadastrosTab from './components/CadastrosTab';
import DemandasTab from './components/DemandasTab';
import DocumentosTab from './components/DocumentosTab';
import InteligenciaTab from './components/InteligenciaTab';
import RelatoriosTab from './components/RelatoriosTab';
import EleicoesTab from './components/EleicoesTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardTab />;
      case 'ia': return <InteligenciaTab />;
      case 'agenda': return <AgendaTab />;
      case 'cadastros': return <CadastrosTab />;
      case 'demandas': return <DemandasTab />;
      case 'documentos': return <DocumentosTab />;
      case 'relatorios': return <RelatoriosTab />;
      case 'eleicoes': return <EleicoesTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
