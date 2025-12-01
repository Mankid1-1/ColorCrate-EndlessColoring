import { GoogleGenAI } from "@google/genai";
import { AppTier, GenerationParams } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateColoringPage = async (params: GenerationParams): Promise<string> => {
  const { theme, ageGroup, style, tier, variationIndex = 0 } = params;

  const isPro = tier === AppTier.PRO;
  const modelName = isPro 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';

  // Enhanced prompt for "x20" quality
  const prompt = `
    Design a premium coloring book page.
    
    METADATA:
    - Subject: "${theme}"
    - Style: ${style}
    - Target Audience: ${ageGroup}
    - Variation Index: #${variationIndex + 1} (Ensure this page is distinct from others in the same book)
    
    VISUAL REQUIREMENTS:
    1. STRICT BLACK AND WHITE ONLY. No gray, no shading, no gradients, no color.
    2. LINE WORK: 
       - Crisp, clean, continuous vector-like lines.
       - Outer contours: Thick and bold.
       - Inner details: Medium thickness.
       - Background elements: Thinner lines.
    3. COMPOSITION:
       - Centered subject with balanced negative space.
       - Entirely closed shapes (no gaps in lines) so users can "fill" with color bucket tools digitally if they want.
       - If the theme implies a scene, fill the background with appropriate simple elements (clouds, grass, bubbles) but keep it colorable.
    
    AGE APPROPRIATENESS:
    - If ${ageGroup} contains "Toddler": Ultra-simple shapes, minimal detail, very thick lines.
    - If ${ageGroup} contains "Adult": Intricate patterns, zentangle elements, high detail.

    OUTPUT:
    - Pure white background (#FFFFFF).
    - Pure black lines (#000000).
    - High contrast.
  `;

  // Construct image configuration
  // Note: imageSize is ONLY supported by gemini-3-pro-image-preview.
  // gemini-2.5-flash-image will error (500) if imageSize is provided.
  const imageConfig: any = {
    aspectRatio: "3:4"
  };

  if (isPro) {
    imageConfig.imageSize = "2K";
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }

    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};