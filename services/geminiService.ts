
import { GoogleGenAI } from "@google/genai";

// Guideline: Always use process.env.API_KEY directly during initialization.
export const getTravelAdvice = async (userPrompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: "Tu es l'assistant de 'MON BILLET SECURISE', une plateforme de billetterie en Côte d'Ivoire. Aide les voyageurs à choisir leurs trajets, donne des conseils sur les villes ivoiriennes (Abidjan, Yamoussoukro, etc.), les prix moyens et les précautions de voyage. Sois poli, concis et utilise un ton chaleureux ivoirien.",
      },
    });
    // Guideline: Access generated text via the .text property (not a method).
    // Always provide a fallback to ensure we return a string as expected by the application.
    return response.text ?? "Désolé, je n'ai pas pu générer de réponse pour le moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Désolé, je rencontre une petite panne technique. Essayez de me demander plus tard !";
  }
};
