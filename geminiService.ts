
import { GoogleGenAI } from "@google/genai";
import { StorageData } from "./types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function callWithRetry(fn: () => Promise<any>, maxRetries = 2): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toUpperCase();
      // Se for erro de cota ou limite exaurido
      if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        if (i < maxRetries - 1) {
          await delay(5000 * (i + 1));
          continue;
        }
        // Erro amigável para o usuário sobre o AI Studio
        throw new Error("LIMITE_API_ESTOURADO");
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

// Usando Flash Lite para documentos (mais rápido e cota maior)
export const generateDocumentContent = async (prompt: string, type: string): Promise<string> => {
  return callWithRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
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
      model: 'gemini-3-flash-preview', // Flash é suficiente para OCR e mais barato que Pro
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
        systemInstruction: `Assessor Legislativo. Cidadãos: ${data.citizens.length}, Demandas: ${data.demands.length}. Use Google Search para fatos externos.`,
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
        systemInstruction: "Analista Eleitoral. Use o Google Search para dados do TSE e notícias de Nova Friburgo.",
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
      model: 'gemini-flash-lite-latest',
      contents: `Resuma o status: ${data.citizens.length} cidadãos e ${data.demands.length} demandas.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "Resumo indisponível.";
  });
};
