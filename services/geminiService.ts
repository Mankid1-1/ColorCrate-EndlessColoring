import { AppTier, GenerationParams } from "../types";

// Determine API URL (Dev vs Prod)
// In development with Vite proxy, or production serving same origin, relative path works.
// However, for Capacitor mobile apps, we need a full URL if the backend is remote.
// For now, we assume the backend is hosted at the same origin or configured via env.

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
// If VITE_API_URL is empty, it uses relative path (works for web served by same express).
// For mobile, user must set VITE_API_URL to the hosted backend IP/Domain.

export const generateColoringPage = async (params: GenerationParams): Promise<string> => {
  const { theme, ageGroup, style, tier, variationIndex = 0 } = params;

  try {
      console.log(`[Service] Requesting generation for "${theme}"`);

      const response = await fetch(`${API_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              theme,
              ageGroup,
              style,
              tier,
              variationIndex
          })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.imageUrl) {
          throw new Error("Invalid response from server: No image URL");
      }

      return data.imageUrl;

  } catch (error: any) {
      console.error("[Service] Generation failed:", error);
      throw error;
  }
};
