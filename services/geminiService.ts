import { GoogleGenAI } from "@google/genai";
import { AppTier, GenerationParams } from "../types";

// Validate API Key presence
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

// Note: In a real production app, this should be proxied through a backend to hide the key.
// For this standalone demo, we use it directly.
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

const MAX_RETRIES = 3;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateColoringPage = async (params: GenerationParams): Promise<string> => {
  const { theme, ageGroup, style, tier, variationIndex = 0 } = params;

  if (!apiKey) {
      console.warn("Missing GEMINI_API_KEY. Using mock mode if configured or failing.");
  }

  const isPro = tier === AppTier.PRO;
  // Fallback to flash if pro not available or for speed
  const modelName = isPro 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';

  // Enhanced prompt engineering: Separation of Concerns
  const prompt = `
    [ROLE]
    You are a professional illustrator specializing in high-quality vector-style coloring book pages.
    
    [TASK]
    Generate a single, high-contrast, black-and-white coloring page image.

    [CONTENT SPECIFICATION]
    - SUBJECT: ${theme}
    - VARIATION: This is page #${variationIndex + 1} of a book. Ensure unique composition.
    - TARGET AUDIENCE: ${ageGroup}
    - STYLE MODIFIER: ${style}

    [VISUAL CONSTRAINTS - CRITICAL]
    1. STROKE STYLE:
       - Use clean, continuous, vector-quality black lines.
       - NO shading, NO greyscale, NO gradients, NO texture fill.
       - All shapes must be closed (no gaps) to allow for digital "bucket fill".
    
    2. COMPLEXITY BY AGE:
       ${getAgeInstructions(ageGroup)}

    3. COMPOSITION:
       - Subject centered but dynamic.
       - Clear separation between foreground and background.
       - Background should contain simple, colorable elements relative to the theme (e.g., stars, bubbles, leaves) but not clutter the main subject.
    
    [OUTPUT FORMAT]
    - Pure Black (#000000) lines on Pure White (#FFFFFF) background.
    - Aspect Ratio: 3:4 (Portrait).
  `;

  // Construct image configuration
  const imageConfig: any = {
    aspectRatio: "3:4"
  };

  if (isPro) {
    // Only Pro model supports 2K currently in this SDK version mapping
    imageConfig.imageSize = "2K";
  }

  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Gemini] Generation Attempt ${attempt}/${MAX_RETRIES} for "${theme}"`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig
          },
        });

        // Runtime Validation of Response Structure
        if (!response || !response.candidates || response.candidates.length === 0) {
            throw new Error("Empty response from Gemini API");
        }

        for (const candidate of response.candidates) {
          if (!candidate.content || !candidate.content.parts) continue;

          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const base64Data = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';

              // Basic validation that we got a string
              if (typeof base64Data !== 'string' || base64Data.length < 100) {
                  continue; // Skip invalid data
              }

              return `data:${mimeType};base64,${base64Data}`;
            }
          }
        }

        throw new Error("No valid image data found in candidates.");
      } catch (error: any) {
        console.error(`[Gemini] Error on attempt ${attempt}:`, error);
        lastError = error;

        // Don't retry on Auth errors
        if (error.message?.includes('API_KEY') || error.status === 403) {
            throw error;
        }

        if (attempt < MAX_RETRIES) {
            await wait(1000 * attempt); // Exponential backoffish
        }
      }
  }

  throw lastError || new Error("Failed to generate image after retries.");
};

const getAgeInstructions = (age: string) => {
    if (age.includes("Toddler")) {
        return `- ULTRA SIMPLE. Thick bold outlines (5px+). Minimal details. Big simple shapes only. No background clutter.`;
    } else if (age.includes("Preschool")) {
        return `- SIMPLE. Bold outlines. Easy to color shapes. Fun and cute character proportions.`;
    } else if (age.includes("Teen") || age.includes("Adult")) {
        return `- DETAILED. Fine lines. Intricate patterns (zentangle/mandala elements where appropriate). Complex background scenes.`;
    } else {
        return `- BALANCED. Standard coloring book style. Mix of broad and fine details.`;
    }
}
