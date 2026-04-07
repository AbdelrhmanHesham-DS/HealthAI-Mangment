/**
 * HealthAI Medical Knowledge Base — RAG (Retrieval Augmented Generation)
 *
 * This is the vector-search-ready knowledge base.
 * Each entry has: id, title, content, tags, specialty, source
 *
 * HOW RAG WORKS IN THIS PROJECT:
 * ─────────────────────────────────────────────────────────────────────────
 * 1. User sends a message to MediAI or the chatbot
 * 2. The message is compared against this knowledge base (keyword/semantic search)
 * 3. The top matching articles are retrieved as "context"
 * 4. The context + user message is sent to OpenAI GPT
 * 5. GPT answers using the retrieved medical knowledge — not just its training data
 *
 * TO ENABLE FULL RAG WITH VECTOR DB (LangChain + Pinecone/FAISS):
 * ─────────────────────────────────────────────────────────────────────────
 * 1. npm install langchain @langchain/openai @pinecone-database/pinecone
 * 2. Add to .env:
 *    OPENAI_API_KEY=sk-...
 *    PINECONE_API_KEY=...
 *    PINECONE_INDEX=healthai-medical
 * 3. Run: node src/utils/embedKnowledgeBase.js  (embeds all articles)
 * 4. The RAG controller will automatically use vector search
 *
 * CURRENT STATE: Keyword-based retrieval (works without API keys)
 * UPGRADE PATH:  Replace retrieveContext() with vector similarity search
 */

const MEDICAL_KB = [
  // ── CARDIOLOGY ────────────────────────────────────────────────────────────
  {
    id: 'card-001', specialty: 'cardiology', title: 'Hypertension (High Blood Pressure)',
    tags: ['blood pressure', 'hypertension', 'heart', 'cardiovascular'],
    content: `Hypertension is defined as blood pressure consistently above 130/80 mmHg. It is a major risk factor for heart disease, stroke, and kidney failure. Symptoms are often absent ("silent killer"). Diagnosis requires multiple readings. Treatment includes lifestyle changes (low-sodium diet, exercise, weight loss, quit smoking) and medications (ACE inhibitors, beta-blockers, calcium channel blockers). Regular monitoring is essential. Normal BP: <120/80. Elevated: 120-129/<80. Stage 1 HTN: 130-139/80-89. Stage 2 HTN: ≥140/≥90. Hypertensive crisis: >180/>120.`,
    source: 'WHO Guidelines 2023'
  },
  {
    id: 'card-002', specialty: 'cardiology', title: 'Chest Pain — Differential Diagnosis',
    tags: ['chest pain', 'angina', 'heart attack', 'myocardial infarction', 'cardiac'],
    content: `Chest pain has many causes. Cardiac causes: angina (stable/unstable), myocardial infarction (STEMI/NSTEMI), pericarditis, aortic dissection. Non-cardiac: GERD, esophageal spasm, costochondritis, pneumonia, pulmonary embolism, anxiety. RED FLAGS requiring emergency care: crushing/pressure chest pain, radiation to arm/jaw/back, sweating, nausea, shortness of breath, sudden onset. Diagnosis: ECG, troponin, chest X-ray, echocardiogram. Treatment depends on cause. Never ignore chest pain — always seek immediate medical evaluation.`,
    source: 'ACC/AHA Guidelines'
  },
  {
    id: 'card-003', specialty: 'cardiology', title: 'Heart Failure',
    tags: ['heart failure', 'shortness of breath', 'edema', 'fatigue', 'cardiac'],
    content: `Heart failure occurs when the heart cannot pump enough blood to meet the body's needs. Types: HFrEF (reduced ejection fraction) and HFpEF (preserved EF). Symptoms: dyspnea on exertion, orthopnea, paroxysmal nocturnal dyspnea, leg edema, fatigue, reduced exercise tolerance. Causes: coronary artery disease, hypertension, cardiomyopathy, valvular disease. Diagnosis: BNP/NT-proBNP, echocardiogram, chest X-ray. Treatment: ACE inhibitors/ARBs, beta-blockers, diuretics, SGLT2 inhibitors, device therapy (ICD, CRT). Lifestyle: fluid restriction, daily weight monitoring, low-sodium diet.`,
    source: 'ESC Heart Failure Guidelines 2023'
  },

  // ── NEUROLOGY ─────────────────────────────────────────────────────────────
  {
    id: 'neuro-001', specialty: 'neurology', title: 'Migraine — Diagnosis and Treatment',
    tags: ['migraine', 'headache', 'nausea', 'light sensitivity', 'aura'],
    content: `Migraine is a neurological disorder characterized by recurrent moderate-to-severe headaches, often unilateral, pulsating, lasting 4-72 hours. Associated with nausea, vomiting, photophobia, phonophobia. Aura (visual/sensory disturbances) occurs in 25-30% of patients. Triggers: stress, hormonal changes, certain foods (tyramine, caffeine), sleep disruption, bright lights. Diagnosis: clinical (ICHD-3 criteria). Treatment: acute — triptans (sumatriptan), NSAIDs, antiemetics. Preventive — topiramate, propranolol, amitriptyline, CGRP antagonists. Lifestyle: regular sleep, hydration, trigger avoidance, stress management.`,
    source: 'IHS ICHD-3 Guidelines'
  },
  {
    id: 'neuro-002', specialty: 'neurology', title: 'Stroke — Recognition and Emergency Response',
    tags: ['stroke', 'facial drooping', 'arm weakness', 'speech', 'FAST', 'emergency'],
    content: `Stroke is a medical emergency. FAST acronym: Face drooping, Arm weakness, Speech difficulty, Time to call emergency. Types: ischemic (87%) — clot blocks blood flow; hemorrhagic (13%) — bleeding in brain. Symptoms: sudden numbness/weakness (face, arm, leg), confusion, trouble speaking/understanding, vision problems, severe headache, dizziness. Time is critical — "time is brain." Treatment window: tPA (clot-busting) within 4.5 hours for ischemic stroke. Mechanical thrombectomy up to 24 hours. Call 123 immediately. Risk factors: hypertension, atrial fibrillation, diabetes, smoking, high cholesterol.`,
    source: 'AHA/ASA Stroke Guidelines 2023'
  },

  // ── DIABETES ──────────────────────────────────────────────────────────────
  {
    id: 'endo-001', specialty: 'endocrinology', title: 'Type 2 Diabetes — Management',
    tags: ['diabetes', 'blood sugar', 'insulin', 'glucose', 'HbA1c', 'metformin'],
    content: `Type 2 diabetes is characterized by insulin resistance and relative insulin deficiency. Diagnosis: fasting glucose ≥126 mg/dL, 2-hour glucose ≥200 mg/dL, HbA1c ≥6.5%, or random glucose ≥200 with symptoms. Symptoms: polyuria, polydipsia, polyphagia, fatigue, blurred vision, slow wound healing. Treatment: lifestyle (diet, exercise, weight loss), metformin (first-line), SGLT2 inhibitors, GLP-1 agonists, insulin. Monitoring: HbA1c every 3 months (target <7%), daily blood glucose. Complications: retinopathy, nephropathy, neuropathy, cardiovascular disease. Prevention: Mediterranean diet, 150 min/week moderate exercise, weight loss 5-7%.`,
    source: 'ADA Standards of Care 2024'
  },
  {
    id: 'endo-002', specialty: 'endocrinology', title: 'Thyroid Disorders',
    tags: ['thyroid', 'hypothyroidism', 'hyperthyroidism', 'TSH', 'fatigue', 'weight'],
    content: `Hypothyroidism: TSH elevated, T4 low. Symptoms: fatigue, weight gain, cold intolerance, constipation, dry skin, depression, bradycardia. Treatment: levothyroxine. Hyperthyroidism: TSH low, T4/T3 elevated. Symptoms: weight loss, heat intolerance, palpitations, tremor, anxiety, diarrhea, exophthalmos (Graves'). Treatment: antithyroid drugs (methimazole), radioiodine, surgery. Thyroid nodules: most benign, evaluate with ultrasound and FNA if >1cm. Thyroid cancer: papillary (most common, good prognosis), follicular, medullary, anaplastic. Screening: TSH test for at-risk populations.`,
    source: 'ATA Guidelines 2023'
  },

  // ── MENTAL HEALTH ─────────────────────────────────────────────────────────
  {
    id: 'psych-001', specialty: 'psychiatry', title: 'Depression — Diagnosis and Treatment',
    tags: ['depression', 'sadness', 'hopeless', 'sleep', 'appetite', 'mood', 'PHQ-9'],
    content: `Major Depressive Disorder (MDD): ≥5 symptoms for ≥2 weeks including depressed mood or anhedonia. Symptoms: depressed mood, loss of interest, weight/appetite changes, sleep disturbance, psychomotor changes, fatigue, worthlessness/guilt, concentration difficulty, suicidal ideation. Screening: PHQ-9 (score ≥10 suggests depression). Treatment: mild-moderate — psychotherapy (CBT, IPT); moderate-severe — antidepressants (SSRIs: sertraline, fluoxetine; SNRIs: venlafaxine) + therapy. Acute suicidal risk: immediate psychiatric evaluation. Lifestyle: exercise (equivalent to antidepressant for mild depression), sleep hygiene, social support. Duration: treat for ≥6 months after remission.`,
    source: 'APA Practice Guidelines 2023'
  },
  {
    id: 'psych-002', specialty: 'psychiatry', title: 'Anxiety Disorders',
    tags: ['anxiety', 'panic', 'worry', 'fear', 'GAD', 'panic attack', 'stress'],
    content: `Generalized Anxiety Disorder (GAD): excessive worry about multiple topics for ≥6 months. Symptoms: restlessness, fatigue, concentration difficulty, irritability, muscle tension, sleep disturbance. GAD-7 screening tool. Panic Disorder: recurrent unexpected panic attacks (palpitations, sweating, trembling, shortness of breath, chest pain, dizziness, fear of dying). Treatment: CBT (first-line), SSRIs/SNRIs, benzodiazepines (short-term only). Social Anxiety: fear of social situations. Specific Phobias: intense fear of specific objects/situations. Lifestyle: mindfulness, breathing exercises, regular exercise, caffeine reduction, sleep hygiene.`,
    source: 'APA DSM-5-TR'
  },

  // ── RESPIRATORY ───────────────────────────────────────────────────────────
  {
    id: 'pulm-001', specialty: 'pulmonology', title: 'Asthma — Management',
    tags: ['asthma', 'wheeze', 'cough', 'shortness of breath', 'inhaler', 'bronchospasm'],
    content: `Asthma is chronic airway inflammation causing reversible airflow obstruction. Symptoms: wheezing, cough (especially nocturnal), chest tightness, dyspnea. Triggers: allergens, exercise, cold air, infections, smoke, NSAIDs. Diagnosis: spirometry (FEV1/FVC <0.7, reversibility ≥12% with bronchodilator). Classification: intermittent, mild/moderate/severe persistent. Treatment: SABA (albuterol) for rescue; ICS (fluticasone) for control; LABA + ICS for moderate-severe; biologics (dupilumab, omalizumab) for severe. Asthma action plan essential. Avoid triggers. Annual flu vaccine. Emergency: severe attack — nebulized SABA, systemic steroids, oxygen, hospital admission.`,
    source: 'GINA Guidelines 2023'
  },

  // ── GASTROENTEROLOGY ──────────────────────────────────────────────────────
  {
    id: 'gastro-001', specialty: 'gastroenterology', title: 'GERD — Gastroesophageal Reflux Disease',
    tags: ['heartburn', 'acid reflux', 'GERD', 'stomach', 'esophagus', 'regurgitation'],
    content: `GERD occurs when stomach acid frequently flows back into the esophagus. Symptoms: heartburn (burning chest pain after eating), regurgitation, dysphagia, chronic cough, hoarseness. Diagnosis: clinical; endoscopy for alarm symptoms (dysphagia, weight loss, bleeding, anemia). Treatment: lifestyle — elevate head of bed, avoid trigger foods (spicy, fatty, caffeine, alcohol, chocolate), eat smaller meals, don't lie down after eating, weight loss. Medications: antacids (immediate relief), H2 blockers (ranitidine), PPIs (omeprazole — most effective). Complications: esophagitis, Barrett's esophagus, esophageal adenocarcinoma. Surgery (Nissen fundoplication) for refractory cases.`,
    source: 'ACG GERD Guidelines 2022'
  },

  // ── ORTHOPEDICS ───────────────────────────────────────────────────────────
  {
    id: 'ortho-001', specialty: 'orthopedics', title: 'Lower Back Pain',
    tags: ['back pain', 'lumbar', 'spine', 'sciatica', 'disc', 'herniation'],
    content: `Lower back pain affects 80% of people at some point. Acute (<4 weeks): usually self-limiting. Chronic (>12 weeks): requires investigation. Red flags: fever, weight loss, night pain, neurological symptoms, trauma, age >50 or <20. Causes: muscle strain (most common), disc herniation, spinal stenosis, spondylolisthesis, osteoporosis fracture. Sciatica: pain radiating down leg (L4-S1 nerve roots). Diagnosis: clinical; MRI for red flags or persistent symptoms. Treatment: stay active (bed rest harmful), NSAIDs, muscle relaxants, physiotherapy, heat/ice. Surgery for severe neurological compromise. Prevention: core strengthening, proper posture, ergonomics, weight management.`,
    source: 'NICE Back Pain Guidelines 2023'
  },

  // ── DERMATOLOGY ───────────────────────────────────────────────────────────
  {
    id: 'derm-001', specialty: 'dermatology', title: 'Skin Rash — Common Causes',
    tags: ['rash', 'skin', 'eczema', 'psoriasis', 'urticaria', 'hives', 'dermatitis'],
    content: `Common skin rashes: Eczema (atopic dermatitis) — itchy, inflamed skin, often in flexural areas; treat with moisturizers, topical steroids, tacrolimus. Psoriasis — silvery plaques on elbows/knees/scalp; treat with topical steroids, vitamin D analogues, biologics. Urticaria (hives) — raised, itchy welts; often allergic; treat with antihistamines. Contact dermatitis — reaction to irritant/allergen; identify and avoid trigger. Tinea (ringworm) — fungal infection; treat with antifungals. Rosacea — facial redness/bumps; avoid triggers, topical metronidazole. URGENT: petechiae/purpura (possible meningococcemia), rapidly spreading rash with fever, blistering rash (Stevens-Johnson syndrome).`,
    source: 'AAD Clinical Guidelines'
  },

  // ── PEDIATRICS ────────────────────────────────────────────────────────────
  {
    id: 'peds-001', specialty: 'pediatrics', title: 'Fever in Children',
    tags: ['fever', 'child', 'temperature', 'pediatric', 'baby', 'infant'],
    content: `Fever in children: temperature ≥38°C (100.4°F). Most fevers are viral and self-limiting. URGENT: any fever in infant <3 months, fever >40°C, fever >5 days, fever with rash, stiff neck, severe headache, difficulty breathing, extreme irritability, seizure. Management: antipyretics (paracetamol/ibuprofen — NOT aspirin in children), adequate fluids, light clothing. Do NOT use cold baths. Febrile seizures: common (2-5% of children 6mo-5yr), usually benign, brief (<15 min), generalized. Causes: viral URTI (most common), UTI, pneumonia, meningitis (rare but serious). Vaccination history important. When to seek care: infant <3 months with any fever, child appears very ill, fever >5 days.`,
    source: 'AAP Fever Guidelines 2023'
  },

  // ── GENERAL HEALTH ────────────────────────────────────────────────────────
  {
    id: 'gen-001', specialty: 'general', title: 'Preventive Health Screenings',
    tags: ['checkup', 'screening', 'prevention', 'routine', 'blood test', 'physical'],
    content: `Recommended preventive screenings by age: All adults — blood pressure (every 2 years), cholesterol (every 5 years from age 35), diabetes screening (every 3 years from age 45), BMI assessment. Women — Pap smear (every 3 years from age 21), mammogram (every 1-2 years from age 40-50), bone density (from age 65). Men — prostate cancer discussion (from age 50). All — colorectal cancer screening (from age 45), skin cancer check, dental exam (every 6 months), eye exam (every 1-2 years). Vaccinations: flu (annual), COVID-19 (updated), Tdap (every 10 years), shingles (age 50+), pneumococcal (age 65+). Lifestyle: Mediterranean diet, 150 min/week moderate exercise, no smoking, limit alcohol, adequate sleep (7-9 hours).`,
    source: 'USPSTF Recommendations 2024'
  },
  {
    id: 'gen-002', specialty: 'general', title: 'COVID-19 and Respiratory Infections',
    tags: ['covid', 'coronavirus', 'flu', 'cold', 'respiratory', 'cough', 'fever'],
    content: `COVID-19: caused by SARS-CoV-2. Symptoms: fever, cough, fatigue, loss of taste/smell, shortness of breath, body aches. Diagnosis: PCR or rapid antigen test. Treatment: most mild cases — rest, fluids, antipyretics. High-risk patients: antivirals (Paxlovid, remdesivir). Prevention: vaccination, masks in high-risk settings, hand hygiene, ventilation. Long COVID: symptoms persisting >12 weeks. Influenza: seasonal, vaccine-preventable. Symptoms similar to COVID. Treatment: oseltamivir (Tamiflu) within 48 hours. Common cold: rhinovirus, self-limiting, 7-10 days. No antibiotic needed for viral infections.`,
    source: 'WHO COVID-19 Guidelines 2024'
  },
];

/**
 * Keyword-based retrieval (current implementation — no API key needed)
 * Returns top N most relevant articles for a given query
 */
function retrieveContext(query, topN = 3) {
  const q = query.toLowerCase();
  const scored = MEDICAL_KB.map(article => {
    let score = 0;
    // Tag matching (highest weight)
    article.tags.forEach(tag => { if (q.includes(tag)) score += 3; });
    // Title matching
    if (q.includes(article.title.toLowerCase())) score += 5;
    // Content keyword matching
    const words = q.split(/\s+/);
    words.forEach(word => { if (word.length > 3 && article.content.toLowerCase().includes(word)) score += 1; });
    // Specialty matching
    if (q.includes(article.specialty)) score += 2;
    return { article, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.article);
}

/**
 * Build a RAG-enhanced prompt for OpenAI
 * Retrieves relevant medical context and prepends it to the user message
 */
function buildRAGPrompt(userMessage, language = 'en') {
  const context = retrieveContext(userMessage);

  const systemPrompt = language === 'ar'
    ? 'أنت مساعد طبي ذكي. استخدم المعلومات الطبية المقدمة للإجابة بدقة. لا تقدم تشخيصاً طبياً. اقترح دائماً استشارة طبيب.'
    : language === 'fr'
    ? 'Vous êtes un assistant médical intelligent. Utilisez les informations médicales fournies pour répondre avec précision. Ne posez pas de diagnostic. Recommandez toujours de consulter un médecin.'
    : 'You are an intelligent medical AI assistant for HealthAI platform. Use the provided medical knowledge to answer accurately. NEVER provide a definitive diagnosis. Always recommend consulting a licensed physician. Be empathetic and clear.';

  const contextText = context.length > 0
    ? `\n\nRELEVANT MEDICAL KNOWLEDGE:\n${context.map(a => `[${a.title}]\n${a.content}`).join('\n\n')}`
    : '';

  return { systemPrompt: systemPrompt + contextText, contextUsed: context.map(a => a.title) };
}

module.exports = { MEDICAL_KB, retrieveContext, buildRAGPrompt };
