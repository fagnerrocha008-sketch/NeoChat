import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAIResponse = async (
  history: { role: string; text: string }[],
  lastMessage: string
): Promise<string> => {
  if (!apiKey) return "Erro: API Key não configurada.";

  try {
    // Filter out messages that might be purely functional/audio blobs for the text-only model context
    // or ensure they have text representations.
    const safeHistory = history.map(h => ({
        role: h.role,
        text: h.text || "[Mensagem de Áudio]"
    }));

    const model = 'gemini-2.5-flash';
    
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: "Você é o 'Neo', um assistente de IA integrado em um aplicativo de chat futurista. Você é amigável, conciso, usa emojis ocasionalmente e fala português do Brasil fluentemente. Responda como se fosse um amigo trocando mensagens rápidas. Se o usuário enviar um áudio (representado por [Áudio enviado]), diga que ouviu e faça um comentário simpático sobre áudios.",
      },
    });
    
    // If the last message was audio (empty text or placeholder), send a representative text
    const messageToSend = lastMessage || "[Áudio enviado pelo usuário]";

    const result = await chat.sendMessage({
      message: messageToSend
    });

    return result.text || "Desculpe, não consegui processar isso.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Estou tendo problemas de conexão no momento 😓";
  }
};