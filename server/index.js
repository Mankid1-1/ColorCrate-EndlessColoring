import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Trust the first proxy (e.g. load balancer) so rate limiting works correctly
app.set('trust proxy', 1);

// Security: Add Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://aistudiocdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(cors());
app.use(express.json());

// Rate Limiter for Generation Endpoint
// Limit to 10 requests per minute per IP to prevent abuse and manage API costs
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  message: { error: 'Too many generation requests, please try again later.' },
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & 8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// API Key Validation
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in .env.local");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

// Serve Static Files (Frontend)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Allowed values for validation
const ALLOWED_AGE_GROUPS = [
  'Toddler (1-3)',
  'Preschool (3-5)',
  'School Age (5-10)',
  'Teen/Adult (10+)'
];

const ALLOWED_STYLES = [
  'Cute Cartoon',
  'Realistic Nature',
  'Mandala Pattern',
  'Fantasy & Magic',
  'Pixel Art',
  'Minimalist',
  'Abstract Shapes',
  'Stained Glass',
  'Super Kawaii',
  'Comic Book Style'
];

// API Routes
app.post('/api/generate', generateLimiter, async (req, res) => {
    try {
        const { theme, ageGroup, style, tier, variationIndex = 0 } = req.body;

        // Input Validation
        if (!theme || !ageGroup || !style) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (typeof theme !== 'string' || theme.length > 200) {
            return res.status(400).json({ error: "Invalid theme (max 200 chars)" });
        }

        // SANITIZATION: Remove control characters and newlines to prevent prompt injection
        const sanitizedTheme = theme.replace(/[\r\n\x00-\x1F\x7F]/g, " ").trim();

        if (!ALLOWED_AGE_GROUPS.includes(ageGroup)) {
            return res.status(400).json({ error: "Invalid age group" });
        }

        if (!ALLOWED_STYLES.includes(style)) {
            return res.status(400).json({ error: "Invalid style" });
        }

        if (typeof variationIndex !== 'number') {
             return res.status(400).json({ error: "Invalid variation index" });
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
    - SUBJECT: ${sanitizedTheme}
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

        console.log(`[Server] Generating for "${sanitizedTheme}" (Original: "${theme}") using ${modelName}`);

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
        // Security: Don't leak internal error details to the client
        res.status(500).json({ error: "Failed to generate image. Please try again later." });
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
