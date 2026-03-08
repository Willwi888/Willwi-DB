
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Song, Language, ProjectType, ReleaseCategory } from "../types";

export const GRANDMA_SYSTEM_INSTRUCTION = `
你現在是 Willwi 官方平台的「代班阿嬤」。
語氣慢、暖，不用解釋技術，像是在跟孫子聊天一樣，但對 Willwi 的作品瞭如指掌。
`;

/**
 * 透過 AI 搜尋發現藝術家的完整作品集
 */
export const getArtistDiscographyViaAI = async (artistName: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `請使用 Google Search 搜尋音樂人「${artistName}」在 Spotify 上的完整作品清單。
      我需要獲取目前所有的專輯 (Albums) 與單曲 (Singles)，包含發行日期。
      
      已知作品量約為 79 張以上。
      請列出：作品名稱、發行年份、作品類型 (Album/Single/EP)、以及該作品在 Spotify 的連結。
      
      請嚴格以 JSON 格式回傳陣列。
      格式：[{"name": "標題", "release_date": "2025", "album_type": "single", "spotify_url": "連結"}]`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              release_date: { type: Type.STRING },
              album_type: { type: Type.STRING },
              spotify_url: { type: Type.STRING }
            },
            required: ["name", "spotify_url"]
          }
        }
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Discography Discovery Error:", error);
    return [];
  }
};

/**
 * 生成作品推薦視覺圖
 */
export const generateSongVisual = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A cinematic, moody, minimalist album cover art for a music track titled: ${prompt}. High aesthetic, dark atmosphere, artistic, 4k, suitable for a professional musician.` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

/**
 * 使用 Veo 生成宣傳短片
 */
export const generatePromoVideo = async (prompt: string): Promise<string | null> => {
  // 注意：呼叫此函數前需確保使用者已透過 window.aistudio.openSelectKey() 選擇金鑰
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A poetic, high-end cinematic music video snippet for: ${prompt}. Slow motion, abstract lighting, dreamlike texture, 1080p.`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video generation error:", error);
    return null;
  }
};

export const getLatestWillwiInfo = async (): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `請使用 Google Search 搜尋關於「Willwi 陳威兒」最新的網路資訊與動態。
      請用優雅、溫暖的語氣，以繁體中文撰寫一段約 100 字的簡短介紹，總結他近期的活動或作品。`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    const text = response.text || "";
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((c: any) => { if (c.web) sources.push({ title: c.web.title, uri: c.web.uri }); });
    }
    return { text, sources };
  } catch (error) {
    console.error("AI Latest Info Error:", error);
    return { text: "目前無法取得最新資訊，請稍後再試。" };
  }
};

export const checkSpam = async (message: string): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Please analyze the following message and determine if it is spam, a bot submission, or contains inappropriate/offensive content. Return a JSON object with a single boolean field "isSpam".\n\nMessage: "${message}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSpam: { type: Type.BOOLEAN }
          },
          required: ["isSpam"]
        }
      }
    });
    const result = JSON.parse(response.text || '{"isSpam": false}');
    return result.isSpam;
  } catch (error) {
    console.error("Spam check error:", error);
    return false; // Default to false if check fails
  }
};

export const getChatResponse = async (
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<{ text: string; sources?: { title: string; uri: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction: GRANDMA_SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }] },
    history: history
  });
  const result = await chat.sendMessage({ message });
  const text = result.text;
  const sources: { title: string; uri: string }[] = [];
  const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
      chunks.forEach((c: any) => { if (c.web) sources.push({ title: c.web.title, uri: c.web.uri }); });
  }
  return { text, sources };
};
