/**
 * verify_gemini_integration.js
 * Comprehensive automated verification test for Gemini ML Inference and Multilingual Translation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { diagnoseWithGemini, normalizeDiseaseName } from './src/services/geminiService.js';
import {
  translateText,
  translateTreatmentBundle,
  localizeReport
} from './src/services/translationService.js';
import { callMLService } from './src/queues/mlWorker.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('🚀 AgriSentinel Gemini API Inference & Translation Verification');
  console.log('='.repeat(70));

  // --- Test 1: Normalize Disease Names ---
  console.log('\n--- 1. Testing Disease Name Normalization ---');
  assert(normalizeDiseaseName('Tomato_Early_blight') === 'Tomato_Early_blight', 'Exact match for Tomato_Early_blight');
  assert(normalizeDiseaseName('tomato early blight') === 'Tomato_Early_blight', 'Fuzzy lower case match');
  assert(normalizeDiseaseName('Potato Late Blight') === 'Potato_Late_blight', 'Fuzzy match for Potato Late Blight');
  assert(normalizeDiseaseName('Healthy Tomato Plant') === 'Tomato_healthy', 'Fuzzy match for Tomato healthy');
  assert(normalizeDiseaseName('Pepper Bell Bacterial Spot') === 'Pepper_bell_Bacterial_spot', 'Fuzzy match for Bell Pepper Bacterial Spot');

  // --- Test 2: Gemini Multimodal Vision Inference ---
  console.log('\n--- 2. Testing Gemini Multimodal Vision Inference ---');
  const sampleImagePath = path.resolve('../ML_service/data/plantvillage/Tomato_Early_blight/0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B 8389.JPG');
  assert(fs.existsSync(sampleImagePath), 'Sample leaf image exists');

  const imageBuffer = fs.readFileSync(sampleImagePath);
  const dataUri = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  const visionStart = Date.now();
  const prediction = await diagnoseWithGemini(dataUri, 'image/jpeg');
  const visionLatency = Date.now() - visionStart;

  console.log(`⏱️ Vision latency: ${visionLatency}ms`);
  console.log('Prediction result:', prediction);

  assert(prediction.success === true, 'Prediction returns success: true');
  assert(prediction.disease === 'Tomato_Early_blight', `Disease correctly diagnosed as Tomato_Early_blight (got ${prediction.disease})`);
  assert(prediction.confidence >= 0.70 && prediction.confidence <= 1.0, `Confidence score is realistic and calibrated (${prediction.confidence})`);
  assert(prediction.isMock === false, 'isMock is false (real AI model inference)');

  // --- Test 3: mlWorker callMLService Integration ---
  console.log('\n--- 3. Testing mlWorker.callMLService Pipeline ---');
  const workerStart = Date.now();
  const workerResult = await callMLService(dataUri);
  const workerLatency = Date.now() - workerStart;
  console.log(`⏱️ Worker first call latency: ${workerLatency}ms`);
  assert(workerResult.success === true, 'callMLService returns success');
  assert(workerResult.disease === 'Tomato_Early_blight', 'callMLService diagnoses Tomato_Early_blight');

  // Second call must be a cache hit
  const cacheStart1 = Date.now();
  const cachedWorkerResult = await callMLService(dataUri);
  const cacheLatency1 = Date.now() - cacheStart1;
  console.log(`⏱️ Worker second call latency (cache hit): ${cacheLatency1}ms`);
  assert(cachedWorkerResult.success === true, 'cached worker call returns success');
  assert(cacheLatency1 < 50, `Worker cache hit is near-instantaneous (${cacheLatency1}ms)`);

  // --- Test 4: Multilingual Translation Service (Tamil & Hindi) ---
  console.log('\n--- 4. Testing Gemini Multilingual Translation (ta & hi) ---');
  const sampleTreatment = {
    disease: 'Tomato Early Blight',
    treatment: 'Remove and destroy infected leaves immediately. Apply fungicide at first sign of infection.',
    medicine: 'Chlorothalonil (Bravo 500) or Mancozeb (Dithane M-45). Apply every 7-10 days.',
    prevention: 'Use disease-resistant tomato varieties. Rotate crops annually. Apply mulch to prevent soil splash.'
  };

  // 4a. Translate to Tamil
  const taStart = Date.now();
  const taBundle = await translateTreatmentBundle(sampleTreatment, 'ta');
  const taLatency = Date.now() - taStart;
  console.log(`⏱️ Tamil translation latency: ${taLatency}ms`);
  console.log('Tamil translated bundle:', taBundle);

  assert(Boolean(taBundle.disease), 'Tamil disease name is present');
  assert(Boolean(taBundle.treatment), 'Tamil treatment advice is present');
  assert(taBundle.medicine.includes('Chlorothalonil') || taBundle.medicine.includes('Mancozeb'), 'Tamil medicine preserved active chemical ingredients');
  assert(taBundle.medicine.includes('7-10'), 'Tamil medicine preserved application interval numbers (7-10)');

  // 4b. Translate to Hindi
  const hiStart = Date.now();
  const hiBundle = await translateTreatmentBundle(sampleTreatment, 'hi');
  const hiLatency = Date.now() - hiStart;
  console.log(`⏱️ Hindi translation latency: ${hiLatency}ms`);
  console.log('Hindi translated bundle:', hiBundle);

  assert(Boolean(hiBundle.disease), 'Hindi disease name is present');
  assert(Boolean(hiBundle.treatment), 'Hindi treatment advice is present');
  assert(hiBundle.medicine.includes('Chlorothalonil') || hiBundle.medicine.includes('Mancozeb'), 'Hindi medicine preserved active chemical ingredients');
  assert(hiBundle.medicine.includes('7-10'), 'Hindi medicine preserved application interval numbers (7-10)');

  // 4c. English passthrough
  const enBundle = await translateTreatmentBundle(sampleTreatment, 'en');
  assert(enBundle.treatment === sampleTreatment.treatment, 'English passthrough returns original immediately');

  // --- Test 5: Cache Verification ---
  console.log('\n--- 5. Testing Translation Caching ---');
  const cacheStart = Date.now();
  const cachedTa = await translateTreatmentBundle(sampleTreatment, 'ta');
  const cacheLatency = Date.now() - cacheStart;
  console.log(`⏱️ Translation cache hit latency: ${cacheLatency}ms`);
  assert(cacheLatency < 20, `Translation cache retrieval is instantaneous (${cacheLatency}ms)`);
  assert(cachedTa.treatment === taBundle.treatment, 'Cached translation matches original translation');

  // --- Test 6: Report Localization ---
  console.log('\n--- 6. Testing Full Report Object Localization ---');
  const mockReport = {
    reportId: 'rep_test_123',
    cropType: 'Tomato',
    disease: 'Tomato_Early_blight',
    confidence: 0.95,
    treatment: sampleTreatment.treatment,
    medicine: sampleTreatment.medicine,
    prevention: sampleTreatment.prevention,
    officerRecommendation: 'Please apply fungicide early morning.',
    officerMedicine: 'Mancozeb 75% WP',
    officerNotes: 'Check nearby rows in 3 days.'
  };

  const localizedTamilReport = await localizeReport(mockReport, 'ta');
  assert(localizedTamilReport.reportId === 'rep_test_123', 'Report ID remains unchanged');
  assert(localizedTamilReport.cropType === 'Tomato', 'Crop type remains unchanged');
  assert(localizedTamilReport.confidence === 0.95, 'Confidence score remains unchanged');
  assert(Boolean(localizedTamilReport.treatment), 'Treatment localized');
  assert(Boolean(localizedTamilReport.officerRecommendation), 'Officer recommendation localized');

  // --- Test 7: Error Resilience & Security ---
  console.log('\n--- 7. Testing Error Resilience & Security ---');
  // Translation fallback when given invalid input
  const fallbackResult = await translateText('', 'ta');
  assert(fallbackResult === '', 'Empty text fallback handled safely');

  // Verify API key is NOT exposed in any public model or output
  const outputString = JSON.stringify({ prediction, workerResult, taBundle, hiBundle, localizedTamilReport });
  const exposedKey = process.env.GEMINI_API_KEY || '';
  assert(exposedKey === '' || !outputString.includes(exposedKey), 'Gemini API key is NEVER exposed in model responses or outputs');

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('='.repeat(70));
}

runTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
