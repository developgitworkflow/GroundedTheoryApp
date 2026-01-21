
import { GoogleGenAI, Type } from "@google/genai";
import { Code } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const suggestCodes = async (textChunk: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following qualitative data excerpt and suggest 5-7 short, grounded theory 'Open Codes' (1-3 words each). 
      Focus on actions, processes, and in-vivo codes.
      
      Excerpt: "${textChunk}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            codes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const json = JSON.parse(response.text || '{"codes": []}');
    return json.codes || [];
  } catch (error) {
    console.error("Error fetching code suggestions:", error);
    return [];
  }
};

export const generateTheoreticalMemo = async (codes: string[], context: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Based on the following codes: [${codes.join(', ')}] and the context provided below, write a brief theoretical memo (approx 150 words) connecting these concepts. Focus on potential relationships (Axial Coding).

      Context: "${context}"`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating memo:", error);
    return "Failed to generate memo.";
  }
};

export const suggestOntology = async (codes: Code[]): Promise<{ parent: string; children: string[] }[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  try {
    const codeList = codes.map(c => c.name).join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a Grounded Theory expert performing Axial Coding. 
      Organize the following list of Open Codes into a 2-level hierarchical ontology (Categories -> Sub-codes).
      Group related codes under existing names if they fit, or create abstract Category names.
      
      List of Codes: ${codeList}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ontology: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parent: { type: Type.STRING, description: "The Category Name" },
                  children: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of exact code names from the input that belong here" 
                  }
                }
              }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || '{"ontology": []}');
    return json.ontology || [];
  } catch (error) {
    console.error("Error suggesting ontology:", error);
    return [];
  }
};
