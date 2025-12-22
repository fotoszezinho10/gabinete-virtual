
import { GoogleGenAI } from "@google/genai";
import { StorageData } from "./types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    console.error("ERRO CRÍTICO: API_KEY não encontrada no ambiente. Verifique as variáveis no Vercel.");
    throw new Error("Chave API não configurada.");
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
    Não use blocos de código markdown como \`\`\`html.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    return response.text?.replace(/```html/g, '').replace(/```/g, '').trim() || "Falha ao gerar texto.";
  } catch (error) {
    console.error("Erro na geração de documento:", error);
    return "Erro ao conectar com a IA. Verifique os logs do console.";
  }
};

export const analyzeDocumentImage = async (base64Image: string): Promise<{ title: string; content: string }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { 
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Extraia o texto deste documento oficial. Retorne JSON: { 'title': 'título', 'content': 'texto com <br/>' }" }
        ] 
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro no scanner vision:", error);
    throw error;
  }
};

export const chatWithCabinetData = async (query: string, data: StorageData): Promise<string> => {
  try {
    const ai = getAI();
    const context = {
      totalCidadaos: data.citizens.length,
      demandas: data.demands.map(d => ({ t: d.title, s: d.status, p: d.priority }))
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `Você é o Assessor do Gabinete do Vereador Ghabriel do Zezinho. Dados: ${JSON.stringify(context)}. Use Google Search para leis de Nova Friburgo.`,
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const sources = chunks.map((c: any) => c.web).filter((w: any) => w?.uri).map((w: any) => `\n- [${w.title}](${w.uri})`).join('');
      if (sources) text += `\n\n**Fontes:**${sources}`;
    }
    return text;
  } catch (error) {
    console.error("Erro no Chat IA:", error);
    return "Erro ao processar sua dúvida. Verifique sua chave API.";
  }
};

export const searchElectionData = async (query: string): Promise<string> => {
  try {
    const ai = getAI();
    const systemInstruction = `Você é o Analista de Inteligência Política do Gabinete. 
    DADOS OFICIAIS:
    - 2016: Zezinho do Caminhão (Vereador) -> 1.654 votos.
    - 2020: Zezinho do Caminhão (Vereador) -> 1.427 votos.
    - 2024: Ghabriel do Zezinho (Vereador) -> 1.541 votos.
    - Áureo Ribeiro (Federal): 2018 (312 votos em NF), 2022 (159 votos em NF).
    Use Google Search para comparar com outros candidatos ou buscar quocientes eleitorais do TSE.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const sources = chunks.map((c: any) => c.web).filter((w: any) => w?.uri).map((w: any) => `\n- [${w.title}](${w.uri})`).join('');
      if (sources) text += `\n\n**Análise baseada em registros oficiais:**${sources}`;
    }
    return text;
  } catch (error: any) {
    console.error("Erro na pesquisa eleitoral:", error);
    return `Erro técnico: ${error.message || "Falha na API"}. Certifique-se de que a API_KEY no Vercel está correta.`;
  }
};

export const generateExecutiveSummary = async (data: StorageData): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Resuma o status do gabinete: ${data.citizens.length} cidadãos, ${data.demands.length} demandas.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "Resumo indisponível.";
  } catch {
    return "Erro ao gerar resumo.";
  }
};
