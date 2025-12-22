
import { GoogleGenAI } from "@google/genai";
import { StorageData } from "./types";

// Função utilitária para esperar (delay)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Função de execução com Retentativa (Retry) para lidar com erro 429 (Quota)
async function callWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error?.message?.includes('429') || error?.status === 429 || JSON.stringify(error).includes('429');
      
      if (isQuotaError && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 2000; // 2s, 4s...
        console.warn(`[IA] Limite de cota atingido. Tentando novamente em ${waitTime/1000}s... (Tentativa ${i + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDocumentContent = async (prompt: string, type: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um ${type} oficial para o Vereador Ghabriel do Zezinho sobre: ${prompt}. Retorne apenas HTML básico.`,
    });
    return response.text?.replace(/```html/g, '').replace(/```/g, '').trim() || "Falha ao gerar.";
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
          { text: "Extraia o texto. Retorne JSON: { 'title': '...', 'content': '...' }" }
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
    const context = {
      total: data.citizens.length,
      demandas: data.demands.length
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `Você é Assessor do Vereador Ghabriel do Zezinho em Nova Friburgo. Dados: ${JSON.stringify(context)}.`,
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
  });
};

export const searchElectionData = async (query: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `Analista Político. Dados: Zezinho (2016: 1.654v, 2020: 1.427v), Ghabriel (2024: 1.541v). Áureo Federal: 2018 (312v), 2022 (159v em NF). Use Google Search para quociente eleitoral e leis.`,
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      const sources = chunks.map((c: any) => c.web).filter((w: any) => w?.uri).map((w: any) => `\n- [${w.title}](${w.uri})`).join('');
      if (sources) text += `\n\n**Referências:**${sources}`;
    }
    return text;
  });
};

export const generateExecutiveSummary = async (data: StorageData): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Resuma o status do gabinete: ${data.citizens.length} cidadãos e ${data.demands.length} demandas.`
    });
    return response.text || "Resumo indisponível.";
  });
};
