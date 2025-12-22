
import { GoogleGenAI } from "@google/genai";
import { StorageData } from "./types";

// Função para garantir que sempre criamos uma instância nova com a chave atualizada
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Chave API não configurada no ambiente.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDocumentContent = async (prompt: string, type: string): Promise<string> => {
  try {
    const ai = getAI();
    const fullPrompt = `Você é o redator oficial do Gabinete do Vereador Ghabriel do Zezinho, na Câmara Municipal de Nova Friburgo.
    Crie um rascunho de um(a) ${type} oficial.
    Contexto do usuário: ${prompt}.
    O texto deve ser profissional, seguir normas gramaticais de redação oficial e estar pronto para revisão.
    IMPORTANTE: Retorne APENAS o texto formatado em HTML simples (use <p>, <br/>, <b>). 
    Não use blocos de código markdown como \`\`\`html ou explicações adicionais. Comece o texto diretamente.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    let text = response.text || "";
    text = text.replace(/```html/g, '').replace(/```/g, '').trim();
    return text || "Não foi possível gerar o conteúdo.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "Erro ao conectar com o serviço de IA. Verifique se a chave API no Vercel está correta.";
  }
};

export const analyzeDocumentImage = async (base64Image: string): Promise<{ title: string; content: string }> => {
  try {
    const ai = getAI();
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };
    const textPart = {
      text: "Analise esta imagem de um documento oficial. Extraia o texto completo de forma organizada. Retorne um JSON com os campos 'title' (um título curto) e 'content' (o texto extraído com <br/> para quebras de linha). Não adicione comentários."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [imagePart, textPart] },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || '{"title": "Documento Digitalizado", "content": "Falha na extração"}');
  } catch (error) {
    console.error("AI Vision Error:", error);
    throw error;
  }
};

export const generateExecutiveSummary = async (data: StorageData): Promise<string> => {
  try {
    const ai = getAI();
    const stats = {
      total: data.citizens.length,
      demandas: data.demands.length,
      resolvidas: data.demands.filter(d => d.status === 'Resolvida').length,
      urgentes: data.demands.filter(d => d.priority === 'Urgente' && d.status !== 'Resolvida').length
    };

    const prompt = `Analise os dados do gabinete e escreva um breve relatório estratégico (máximo 3 parágrafos). 
    Cidadãos: ${stats.total}, Demandas: ${stats.demandas}, Resolvidas: ${stats.resolvidas}, Urgentes: ${stats.urgentes}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Resumo indisponível.";
  } catch (error) {
    return "Erro ao gerar resumo.";
  }
};

export const chatWithCabinetData = async (query: string, data: StorageData): Promise<string> => {
  try {
    const ai = getAI();
    
    const context = {
      totalCidadaos: data.citizens.length,
      demandas: data.demands.map(d => ({ t: d.title, s: d.status, p: d.priority }))
    };

    const systemInstruction = `Você é o Assessor do Gabinete Virtual do Vereador Ghabriel do Zezinho. Use os dados internos: ${JSON.stringify(context)}.
    
    Ao realizar pesquisas externas para responder ao usuário sobre LEGISLAÇÃO MUNICIPAL de Nova Friburgo, utilize PRIORITARIAMENTE:
    1. https://cespro.com.br/visualizarLegislacao.php?cdMunicipio=6811 (Base Completa de Leis)
    2. https://sapl.novafriburgo.rj.leg.br/ (Processo Legislativo e Requerimentos)
    
    Seja direto, profissional e sempre cite as fontes das leis ou dados encontrados.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    let resultText = response.text || "Sem resposta.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      const sources = chunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri)
        .map((web: any) => `\n- [${web.title || 'Link'}](${web.uri})`)
        .join('');
      if (sources) resultText += `\n\n**Fontes:**${sources}`;
    }
    return resultText;
  } catch (error) {
    return "Erro ao processar sua dúvida. Verifique a conexão.";
  }
};
