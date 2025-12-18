import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";

// Ensure API Key exists
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const generateSpeech = async (
  text: string,
  voice: VoiceName = VoiceName.Kore,
  style?: string
): Promise<string> => {
  try {
    // If a style is provided, format the prompt to guide the model's tone.
    // Example: "Say cheerfully: Hello world"
    const effectiveText = style && style.trim() 
      ? `Say ${style.trim()}: ${text}` 
      : text;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [{ text: effectiveText }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned from the model.");
    }

    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};