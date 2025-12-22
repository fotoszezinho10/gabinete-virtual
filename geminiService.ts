
import { GoogleGenAI } from "@google/genai";
import { StorageData } from "./types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callWithRetry(fn: () => Promise<any>, maxRetries = 4): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Sempre criar uma nova instância para garantir o uso da chave mais recente
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error);
      const isQuotaError = error?.message?.includes('429') || error?.status === 429 || errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError && i < maxRetries - 1) {
        // Aumentando o tempo de espera: 5s, 10s, 20s... para dar tempo da cota resetar
        const waitTime = Math.pow(2, i) * 5000; 
        console.warn(`[Gabinete IA] Cota excedida. Tentativa ${i + 1}/${maxRetries}. Aguardando ${waitTime/1000}s para tentar novamente...`);
        await delay(waitTime);
        continue;
      }
      
      console.error("[Gabinete IA] Erro definitivo após tentativas:", error);
      throw error;
    }
  }
  throw lastError;
}

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    console.error("ERRO: API_KEY não configurada corretamente nas variáveis de ambiente do Vercel.");
    throw new Error("API_KEY_INVALID");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDocumentContent = async (prompt: string, type: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é redator oficial. Escreva um ${type} para o Vereador Ghabriel do Zezinho sobre: ${prompt}. Use HTML simples.`,
    });
    return response.text?.replace(/```html/g, '').replace(/```/g, '').trim() || "Falha ao gerar conteúdo.";
  });
};

export const analyzeDocumentImage = async (base64Image: string): Promise<{ title: string; content: string }> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { 
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Extraia o texto deste documento. Retorne apenas JSON: { 'title': 'título', 'content': 'conteúdo' }" }
        ] 
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const chatWithCabinetData = async (query: string, data: StorageData): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const context = `Gabinete do Vereador Ghabriel do Zezinho. Total Cidadãos: ${data.citizens.length}. Total Demandas: ${data.demands.length}.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `Aja como Assessor Legislativo em Nova Friburgo. Contexto: ${context}. Use Google Search para legislação e notícias locais.`,
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const sources = chunks
        .map((c: any) => c.web)
        .filter((w: any) => w?.uri)
        .map((w: any) => `\n- [${w.title}](${w.uri})`)
        .join('');
      if (sources) text += `\n\n**Fontes consultadas:**${sources}`;
    }
    return text;
  });
};

export const searchElectionData = async (query: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `Analista Político. Dados Fixos: 2016 (Zezinho 1654v), 2020 (Zezinho 1427v), 2024 (Ghabriel 1541v). Áureo Federal em NF: 2018 (312v), 2022 (159v). Use Google Search para outros dados do TSE.`,
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const sources = chunks.map((c: any) => c.web).filter((w: any) => w?.uri).map((w: any) => `\n- [${w.title}](${w.uri})`).join('');
      if (sources) text += `\n\n**Referências oficiais:**${sources}`;
    }
    return text;
  });
};

export const generateExecutiveSummary = async (data: StorageData): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resuma brevemente o status: ${data.citizens.length} cidadãos e ${data.demands.length} demandas.`
    });
    return response.text || "Resumo indisponível.";
  } catch (error) {
    console.warn("Falha silenciosa no resumo executivo para poupar cota.");
    return "Clique em 'Resumo IA' para gerar uma análise detalhada (sujeito a disponibilidade de cota).";
  }
};
