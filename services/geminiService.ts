
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize with the environment variable directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDocumentForFields = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `זהה שדות חתימה ומידע נדרש בטקסט המשפטי הבא. החזר רשימת JSON של סוגי שדות (SIGNATURE, TEXT, DATE, ID_NUMBER) ותוויות עבורם.
      טקסט המסמך: ${text.substring(0, 3000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              label: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    // Access response.text as a property and trim it as recommended for JSON extraction
    const jsonStr = response.text?.trim() || '[]';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return [];
  }
};
