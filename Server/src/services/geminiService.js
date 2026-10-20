/**
 * geminiService.js — Google Gemini AI Inference Provider for AgriSentinel
 *
 * Replaces the slow ResNet-50 inference with high-speed Google Gemini Vision API.
 * Preserves the exact PlantVillage 8-class classification schema and downstream contracts.
 */

import dns from 'node:dns';
import dotenv from 'dotenv';
dotenv.config();

// Ensure IPv4 first to eliminate Windows TLS handshake delays
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where not supported
}

export const DISEASE_CLASSES = [
  'Tomato_Early_blight',
  'Tomato_Late_blight',
  'Tomato_healthy',
  'Potato_Early_blight',
  'Potato_Late_blight',
  'Potato_healthy',
  'Pepper_bell_Bacterial_spot',
  'Pepper_bell_healthy'
];

/**
 * Normalizes raw disease output into one of the 8 canonical PlantVillage classes.
 */
export const normalizeDiseaseName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') {
    return DISEASE_CLASSES[0];
  }

  const clean = rawName.trim();
  if (DISEASE_CLASSES.includes(clean)) {
    return clean;
  }

  const lower = clean.toLowerCase().replace(/[\s-]+/g, '_');
  for (const cls of DISEASE_CLASSES) {
    const clsLower = cls.toLowerCase();
    if (clsLower === lower || lower.includes(clsLower) || clsLower.includes(lower)) {
      return cls;
    }
  }

  // Keyword-based fallback
  const isTomato = lower.includes('tomato');
  const isPotato = lower.includes('potato');
  const isPepper = lower.includes('pepper') || lower.includes('bell');
  const isHealthy = lower.includes('healthy');
  const isLate = lower.includes('late');

  if (isTomato) {
    if (isHealthy) return 'Tomato_healthy';
    if (isLate) return 'Tomato_Late_blight';
    return 'Tomato_Early_blight';
  }
  if (isPotato) {
    if (isHealthy) return 'Potato_healthy';
    if (isLate) return 'Potato_Late_blight';
    return 'Potato_Early_blight';
  }
  if (isPepper) {
    if (isHealthy) return 'Pepper_bell_healthy';
    return 'Pepper_bell_Bacterial_spot';
  }

  return DISEASE_CLASSES[0];
};

/**
 * Perform disease diagnosis on an image buffer or base64 data URL using Gemini Vision API.
 *
 * @param {Buffer|string} imageInput - Buffer or Base64 data URI
 * @param {string} mimeType - Image MIME type (default image/jpeg)
 * @returns {Promise<{success: boolean, disease: string, predictedDisease: string, confidence: number, isMock: boolean}>}
 */
export const diagnoseWithGemini = async (imageInput, mimeType = 'image/jpeg') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  let base64Data = '';
  let detectedMime = mimeType;

  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:image')) {
      const [header, data] = imageInput.split(',');
      detectedMime = header.split(':')[1]?.split(';')[0] || mimeType;
      base64Data = data;
    } else {
      base64Data = imageInput;
    }
  } else if (Buffer.isBuffer(imageInput)) {
    base64Data = imageInput.toString('base64');
  } else {
    throw new Error('Unsupported image input format. Expected Buffer or Base64 string.');
  }

  const prompt = `You are an expert plant pathologist and agronomist.
Inspect this crop leaf photo and identify the plant disease condition.
You MUST classify it into exactly one of these 8 PlantVillage classes:
- Tomato_Early_blight
- Tomato_Late_blight
- Tomato_healthy
- Potato_Early_blight
- Potato_Late_blight
- Potato_healthy
- Pepper_bell_Bacterial_spot
- Pepper_bell_healthy

Assess visible leaf symptoms (e.g. concentric target rings for early blight, water-soaked dark lesions for late blight, dark angular spots for bacterial spot, or intact healthy green tissue) and provide a diagnostic confidence score between 0.00 and 1.00.

Return ONLY a valid JSON object matching this exact schema:
{
  "disease": "<exact class from the list above>",
  "confidence": <float between 0.00 and 1.00>
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: detectedMime,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  };

  // Controlled retry with backoff for transient failures
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          console.warn(`[Gemini Service] Transient error (${response.status}), retrying in ${(attempt + 1) * 1000}ms...`);
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
          continue;
        }
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini API returned empty candidate response');
      }

      const parsed = JSON.parse(rawText);
      const normalized = normalizeDiseaseName(parsed.disease);
      let conf = parseFloat(parsed.confidence);
      if (isNaN(conf) || conf <= 0) conf = 0.90;
      conf = Math.max(0.01, Math.min(0.99, parseFloat(conf.toFixed(4))));

      return {
        success: true,
        disease: normalized,
        predictedDisease: normalized,
        confidence: conf,
        isMock: false
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw new Error(`Gemini inference failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
};
