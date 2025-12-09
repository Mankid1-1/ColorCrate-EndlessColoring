import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Key Validation
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in .env.local");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

// Serve Static Files (Frontend)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// API Routes
app.post('/api/generate', async (req, res) => {
    try {
        const { theme, ageGroup, style, tier, variationIndex = 0 } = req.body;

        if (!theme || !ageGroup || !style) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const isPro = tier === 'PRO';
        // Model Selection
        const modelName = isPro
            ? 'gemini-3-pro-image-preview'
            : 'gemini-2.5-flash-image';

        // Prompt Engineering (Matches the frontend logic)
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

        const imageConfig = {
            aspectRatio: "3:4"
        };
        // @ts-ignore - SDK types might be slighty off in this context but this is valid
        if (isPro) { imageConfig.imageSize = "2K"; }

        console.log(`[Server] Generating for "${theme}" using ${modelName}`);

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig },
        });

        if (!response || !response.candidates || response.candidates.length === 0) {
            throw new Error("Empty response from Gemini API");
        }

        // Extract Image Data
        for (const candidate of response.candidates) {
            if (!candidate.content || !candidate.content.parts) continue;
            for (const part of candidate.content.parts) {
                // @ts-ignore
                if (part.inlineData && part.inlineData.data) {
                    // @ts-ignore
                    const base64Data = part.inlineData.data;
                     // @ts-ignore
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    const dataUrl = `data:${mimeType};base64,${base64Data}`;
                    return res.json({ imageUrl: dataUrl });
                }
            }
        }

        throw new Error("No image data found in response");

    } catch (error) {
        console.error("[Server] Generation Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate image" });
    }
});

// Helper for Prompt
const getAgeInstructions = (age) => {
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

// Catch-all for React Router (Single Page App)
// Updated for Express 5 compatibility (using regex to avoid splat errors)
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
