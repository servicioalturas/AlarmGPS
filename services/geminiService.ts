import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates } from '../types';

export const searchLocation = async (query: string): Promise<{ coords: Coordinates, description: string } | null> => {
  try {
    // Initialize instance here to ensure process.env is available and to avoid top-level module evaluation crashes
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the geographical coordinates (latitude and longitude) for the following location: "${query}". Provide a short description (max 1 sentence).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER, description: "Latitude of the location" },
            lng: { type: Type.NUMBER, description: "Longitude of the location" },
            description: { type: Type.STRING, description: "Short description of the location" }
          },
          required: ["lat", "lng", "description"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    return {
      coords: { lat: data.lat, lng: data.lng },
      description: data.description
    };

  } catch (error) {
    console.error("Error searching location with Gemini:", error);
    return null;
  }
};
