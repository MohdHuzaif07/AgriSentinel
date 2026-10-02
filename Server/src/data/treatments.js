/**
 * treatments.js — Structured PlantVillage Treatment Knowledge Base
 *
 * Keyed by disease class name (matching ML output).
 * Each entry has: treatment, medicine (pesticide/fungicide), prevention.
 */

const TREATMENT_KB = {
  'Tomato_Early_blight': {
    disease: 'Tomato Early Blight',
    crop: 'Tomato',
    treatment: 'Remove and destroy infected leaves immediately. Apply fungicide at first sign of infection. Ensure adequate plant spacing for air circulation. Avoid wetting foliage when watering.',
    medicine: 'Chlorothalonil (Bravo 500), Mancozeb (Dithane M-45), or Azoxystrobin (Amistar). Apply every 7-10 days during humid conditions.',
    prevention: 'Use disease-resistant tomato varieties. Rotate crops annually. Apply mulch to prevent soil splash. Water at base of plant in mornings. Remove plant debris after harvest.'
  },
  'Tomato_Late_blight': {
    disease: 'Tomato Late Blight',
    crop: 'Tomato',
    treatment: 'Immediately remove and destroy all infected plant material. Do not compost infected material. Apply copper-based fungicide or systemic fungicide within 24 hours. Report outbreak to local agricultural officer if spread is rapid.',
    medicine: 'Copper oxychloride (Blitox-50), Metalaxyl + Mancozeb (Ridomil Gold MZ), or Cymoxanil + Mancozeb (Curzate M). Apply every 5-7 days.',
    prevention: 'Plant certified disease-free seeds. Maintain field hygiene. Avoid overhead irrigation. Scout fields regularly during cool, wet weather. Use resistant varieties where available.'
  },
  'Tomato_healthy': {
    disease: 'Healthy Tomato',
    crop: 'Tomato',
    treatment: 'No disease detected. Your tomato crop appears healthy. Continue regular monitoring and good agronomic practices.',
    medicine: 'No pesticide required. Consider preventive copper spray if nearby fields show disease.',
    prevention: 'Continue crop rotation, balanced fertilization, and regular scouting. Maintain plant spacing. Remove weeds to reduce humidity.'
  },
  'Potato_Early_blight': {
    disease: 'Potato Early Blight',
    crop: 'Potato',
    treatment: 'Remove infected leaves. Improve field drainage. Apply appropriate fungicide starting from the earliest signs. Avoid water stress during tuber development.',
    medicine: 'Mancozeb (Indofil M-45), Chlorothalonil (Kavach), or Iprodione (Rovral). Spray every 7-14 days depending on disease pressure.',
    prevention: 'Use certified seed tubers. Maintain adequate potassium nutrition. Crop rotation with non-solanaceous crops. Destroy volunteer potato plants. Harvest when vines are dry.'
  },
  'Potato_Late_blight': {
    disease: 'Potato Late Blight',
    crop: 'Potato',
    treatment: 'This is a HIGH PRIORITY disease. Immediately apply systemic fungicide. Remove and destroy infected haulm. If >20% of leaves affected, consider emergency defoliation. Contact agricultural officer for guidance.',
    medicine: 'Metalaxyl + Mancozeb (Ridomil Gold), Dimethomorph + Mancozeb (Acrobat MZ), or Cymoxanil + Famoxadone (Equation Pro). Apply every 5-7 days in severe cases.',
    prevention: 'Plant resistant varieties (e.g. Kufri Jyoti). Use certified seed. Apply preventive fungicide before symptoms appear during monsoon. Avoid overhead irrigation. Destroy crop residues.'
  },
  'Potato_healthy': {
    disease: 'Healthy Potato',
    crop: 'Potato',
    treatment: 'No disease detected. Your potato crop appears healthy. Maintain current management practices.',
    medicine: 'No pesticide required. Consider preventive fungicide spray if weather is cool and wet (Late Blight conditions).',
    prevention: 'Maintain good soil drainage. Avoid over-irrigation. Scout twice weekly during vulnerable growth stages. Remove and destroy any infected volunteer plants.'
  },
  'Pepper_bell_Bacterial_spot': {
    disease: 'Pepper Bell Bacterial Spot',
    crop: 'Bell Pepper',
    treatment: 'Remove and destroy infected leaves and fruits. Apply copper-based bactericide. Reduce leaf wetness. Avoid working in field when plants are wet to prevent spreading bacteria.',
    medicine: 'Copper hydroxide (Kocide 3000), Copper oxychloride (Blitox), or streptomycin sulfate (Agrimycin-17) combined with copper. Apply every 5-7 days.',
    prevention: 'Use disease-free certified seed. Treat seeds with hot water (52°C for 30 minutes). Avoid overhead irrigation. Use resistant pepper varieties. Practice 2-3 year crop rotation.'
  },
  'Pepper_bell_healthy': {
    disease: 'Healthy Bell Pepper',
    crop: 'Bell Pepper',
    treatment: 'No disease detected. Your bell pepper crop appears healthy.',
    medicine: 'No pesticide required. Maintain preventive copper sprays during high humidity periods.',
    prevention: 'Use certified disease-free seed. Stake plants to improve air circulation. Water at base in morning. Scout regularly during warm, wet weather for bacterial spot symptoms.'
  }
};

/**
 * Get treatment information by ML disease class name.
 * Returns null if disease not found in KB.
 */
export const getTreatmentByDisease = (diseaseName) => {
  if (!diseaseName) return null;

  // Direct lookup
  if (TREATMENT_KB[diseaseName]) {
    return TREATMENT_KB[diseaseName];
  }

  // Fuzzy match — try case-insensitive
  const normalized = diseaseName.toLowerCase();
  for (const [key, value] of Object.entries(TREATMENT_KB)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }

  return null;
};

export { TREATMENT_KB };
