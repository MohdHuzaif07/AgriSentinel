/**
 * translationService.js — Gemini-Powered Multilingual Agricultural Translation Service
 *
 * Provides translation for dynamic agricultural advice (treatments, pesticides,
 * prevention measures, officer notes) into Tamil (ta), Hindi (hi), and English (en).
 *
 * Preserves chemical formulas, commercial brand names, units, and intervals.
 * Incorporates an in-memory LRU cache to eliminate duplicate API requests.
 */

import dns from 'node:dns';
import dotenv from 'dotenv';
dotenv.config();

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi'];

// In-memory translation cache to avoid redundant API calls for common agricultural texts
const translationCache = new Map();
const MAX_CACHE_ITEMS = 500;

const getCacheKey = (targetLang, text) => {
  if (!text) return null;
  return `${targetLang}::${text.length}::${text.slice(0, 40)}::${text.slice(-40)}`;
};

const LANGUAGE_NAMES = {
  ta: 'Tamil',
  hi: 'Hindi',
  en: 'English'
};

/**
 * Translate a single dynamic text string using Gemini API.
 *
 * @param {string} text - Source text (typically English)
 * @param {string} targetLang - Target language code ('ta', 'hi', 'en')
 * @returns {Promise<string>} Translated text (or original text on failure/en)
 */
export const translateText = async (text, targetLang = 'en') => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return text;
  }

  const lang = (targetLang || 'en').toLowerCase().trim();
  if (lang === 'en' || !SUPPORTED_LANGUAGES.includes(lang)) {
    return text;
  }

  const cacheKey = getCacheKey(lang, text);
  if (cacheKey && translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return text; // Graceful fallback
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const targetLanguageName = LANGUAGE_NAMES[lang] || 'Tamil';

  const prompt = `You are an expert multilingual agricultural translator and agronomist.
Translate the following text into ${targetLanguageName} (${lang}).

Rules:
1. Preserve technical agricultural terms, chemical fungicide/pesticide names (e.g. Chlorothalonil, Mancozeb, Copper oxychloride), brand names, units, days, percentages, and numbers exactly.
2. Provide fluent, natural phrasing suitable for local farmers.
3. Return ONLY a valid JSON object matching this schema:
{
  "translatedText": "<translated text here>"
}

Text to translate:
"${text.replace(/"/g, '\\"')}"`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      console.warn(`[Translation Service] Gemini API returned ${response.status}. Using original text.`);
      return text;
    }

    const data = await response.json();
    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawOutput) return text;

    const parsed = JSON.parse(rawOutput);
    const translated = parsed.translatedText || text;

    // Cache the result
    if (cacheKey) {
      if (translationCache.size >= MAX_CACHE_ITEMS) {
        const firstKey = translationCache.keys().next().value;
        translationCache.delete(firstKey);
      }
      translationCache.set(cacheKey, translated);
    }

    return translated;
  } catch (err) {
    console.warn(`[Translation Service] Translation error: ${err.message}. Falling back to original.`);
    return text;
  }
};

/**
 * Translate an entire agricultural treatment bundle into the target language.
 * Batch-translates disease name, treatment, medicine, and prevention in a single Gemini API call.
 *
 * @param {Object} bundle - { disease, treatment, medicine, prevention }
 * @param {string} targetLang - Target language code ('ta', 'hi', 'en')
 * @returns {Promise<Object>} Localized bundle matching the original keys
 */
export const translateTreatmentBundle = async (bundle, targetLang = 'en') => {
  if (!bundle || typeof bundle !== 'object') return bundle;

  const lang = (targetLang || 'en').toLowerCase().trim();
  if (lang === 'en' || !SUPPORTED_LANGUAGES.includes(lang)) {
    return bundle;
  }

  const bundleKey = `${lang}::bundle::${bundle.disease || ''}`;
  if (translationCache.has(bundleKey)) {
    return { ...bundle, ...translationCache.get(bundleKey) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return bundle;

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const targetLanguageName = LANGUAGE_NAMES[lang] || 'Tamil';

  const prompt = `You are an expert multilingual agricultural translator and agronomist.
Translate this agricultural disease and treatment advice from English into ${targetLanguageName} (${lang}).

CRITICAL PRESERVATION RULES:
1. Preserve chemical active ingredients (e.g. Chlorothalonil, Mancozeb, Copper oxychloride, Metalaxyl, Dimethomorph, Azoxystrobin) and brand names in English/Latin characters.
2. Keep all numbers, ratios, units, temperatures (e.g. 52°C, 30 minutes), and intervals (e.g. 5-7 days, 7-10 days, 2-3 years) intact.
3. For the disease name, provide the native name followed by the English name in parentheses, e.g. "தக்காளி இலைக்கருகல் (Tomato Early Blight)".
4. Return ONLY a valid JSON object with the exact same keys:

Input:
${JSON.stringify({
  disease: bundle.disease || '',
  treatment: bundle.treatment || '',
  medicine: bundle.medicine || '',
  prevention: bundle.prevention || ''
}, null, 2)}

Schema:
{
  "disease": "<translated disease name>",
  "treatment": "<translated treatment advice>",
  "medicine": "<translated medicine/pesticide recommendations>",
  "prevention": "<translated preventive measures>"
}`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      console.warn(`[Translation Service] Bundle translation returned ${response.status}. Using original.`);
      return bundle;
    }

    const data = await response.json();
    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawOutput) return bundle;

    const parsed = JSON.parse(rawOutput);
    const translatedBundle = {
      disease: parsed.disease || bundle.disease,
      treatment: parsed.treatment || bundle.treatment,
      medicine: parsed.medicine || bundle.medicine,
      prevention: parsed.prevention || bundle.prevention
    };

    // Cache bundle
    if (translationCache.size >= MAX_CACHE_ITEMS) {
      const firstKey = translationCache.keys().next().value;
      translationCache.delete(firstKey);
    }
    translationCache.set(bundleKey, translatedBundle);

    return { ...bundle, ...translatedBundle };
  } catch (err) {
    console.warn(`[Translation Service] Bundle translation failed: ${err.message}`);
    return bundle;
  }
};

/**
 * Localizes a MongoDB Report document or plain object for client display.
 * Translates dynamic human-readable fields without modifying database records.
 *
 * @param {Object} report - Report document or object
 * @param {string} targetLang - Target language ('en', 'ta', 'hi')
 * @returns {Promise<Object>} Cloned report with localized dynamic fields
 */
export const localizeReport = async (report, targetLang = 'en') => {
  if (!report) return report;
  const lang = (targetLang || 'en').toLowerCase().trim();
  if (lang === 'en' || !SUPPORTED_LANGUAGES.includes(lang)) {
    return report;
  }

  // Convert Mongoose document to plain object if needed
  const reportObj = typeof report.toObject === 'function' ? report.toObject() : { ...report };

  // Translate treatment bundle
  const localizedBundle = await translateTreatmentBundle({
    disease: reportObj.disease,
    treatment: reportObj.treatment,
    medicine: reportObj.medicine,
    prevention: reportObj.prevention
  }, lang);

  reportObj.disease = localizedBundle.disease || reportObj.disease;
  reportObj.treatment = localizedBundle.treatment || reportObj.treatment;
  reportObj.medicine = localizedBundle.medicine || reportObj.medicine;
  reportObj.prevention = localizedBundle.prevention || reportObj.prevention;

  // Translate officer recommendation fields if present
  if (reportObj.officerRecommendation) {
    reportObj.officerRecommendation = await translateText(reportObj.officerRecommendation, lang);
  }
  if (reportObj.officerMedicine) {
    reportObj.officerMedicine = await translateText(reportObj.officerMedicine, lang);
  }
  if (reportObj.officerNotes) {
    reportObj.officerNotes = await translateText(reportObj.officerNotes, lang);
  }

  return reportObj;
};

export { SUPPORTED_LANGUAGES };
