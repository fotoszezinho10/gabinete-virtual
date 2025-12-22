
import { GoogleGenAI } from "@google/genai";
import { StorageData } from "./types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Função de retentativa com Jitter (variação aleatória) para evitar bloqueios de rede
async function callWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toUpperCase();
      const isQuota = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('QUOTA');
      
      if (isQuota && i < maxRetries - 1) {
        // Espera progressiva: 8s, 16s... com um pouco de variação aleatória
        const waitTime = (Math.pow(2, i) * 8000) + (Math.random() * 2000); 
        console.warn(`[IA] Limite atingido. Tentativa ${i + 1}/${maxRetries}. Aguardando ${Math.round(waitTime/1000)}s...`);
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
  if (!apiKey || apiKey === "undefined") throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

export const generateDocumentContent = async (prompt: string, type: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere um ${type} oficial para o Vereador Ghabriel do Zezinho: ${prompt}`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
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
          { text: "Extraia o texto em JSON: { 'title': '...', 'content': '...' }" }
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `Assessor Legislativo. Cidadãos: ${data.citizens.length}, Demandas: ${data.demands.length}.`,
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
        systemInstruction: "Analista Eleitoral de Nova Friburgo. Use busca para dados do TSE e quocientes.",
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
      contents: `Resuma o status do gabinete: ${data.citizens.length} cidadãos e ${data.demands.length} demandas.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "Resumo indisponível.";
  });
};
