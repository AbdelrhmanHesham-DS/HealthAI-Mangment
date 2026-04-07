const Doctor = require('../models/Doctor');
const { retrieveContext, buildRAGPrompt } = require('../utils/medicalKnowledgeBase');

// ── Medical knowledge base ────────────────────────────────────────────────
const MEDICAL_KB = {
  cardiology: {
    keywords: ['chest pain', 'heart', 'palpitation', 'shortness of breath', 'breathless', 'irregular heartbeat', 'racing heart', 'heart attack', 'angina', 'blood pressure', 'hypertension', 'edema', 'swollen legs', 'fatigue heart'],
    conditions: ['Angina', 'Arrhythmia', 'Heart Failure', 'Hypertension', 'Myocardial Infarction', 'Pericarditis'],
    urgency: { 'chest pain': 'high', 'heart attack': 'emergency', 'palpitation': 'medium' },
    followUp: ['How long have you had chest pain?', 'Does the pain radiate to your arm or jaw?', 'Do you have a history of heart disease?'],
  },
  neurology: {
    keywords: ['headache', 'migraine', 'dizziness', 'vertigo', 'seizure', 'numbness', 'tingling', 'memory loss', 'confusion', 'stroke', 'tremor', 'weakness', 'fainting', 'blackout', 'vision changes', 'double vision'],
    conditions: ['Migraine', 'Tension Headache', 'Vertigo', 'Epilepsy', 'TIA', 'Multiple Sclerosis', 'Parkinson\'s'],
    urgency: { 'stroke': 'emergency', 'seizure': 'emergency', 'migraine': 'medium', 'headache': 'low' },
    followUp: ['Is the headache sudden and severe?', 'Do you experience nausea or light sensitivity?', 'Have you had any recent head injury?'],
  },
  dermatology: {
    keywords: ['rash', 'skin', 'acne', 'eczema', 'psoriasis', 'itching', 'hives', 'blisters', 'mole', 'lesion', 'dry skin', 'hair loss', 'nail', 'sunburn', 'wound', 'scar'],
    conditions: ['Eczema', 'Psoriasis', 'Acne Vulgaris', 'Urticaria', 'Dermatitis', 'Melanoma', 'Fungal Infection'],
    urgency: { 'mole': 'medium', 'rash': 'low', 'blisters': 'medium' },
    followUp: ['How long have you had this skin condition?', 'Is it spreading or getting worse?', 'Have you used any new products recently?'],
  },
  pediatrics: {
    keywords: ['child', 'baby', 'infant', 'toddler', 'fever child', 'vaccination', 'growth', 'development', 'pediatric', 'newborn', 'kid', 'children'],
    conditions: ['Fever', 'Ear Infection', 'RSV', 'Croup', 'Hand Foot Mouth', 'Chickenpox', 'Growth Delay'],
    urgency: { 'high fever': 'high', 'infant': 'high', 'baby': 'medium' },
    followUp: ['How old is the child?', 'What is their temperature?', 'Are they eating and drinking normally?'],
  },
  orthopedics: {
    keywords: ['bone', 'joint', 'knee', 'back pain', 'spine', 'fracture', 'sprain', 'arthritis', 'shoulder', 'hip', 'ankle', 'wrist', 'neck pain', 'muscle pain', 'sports injury', 'swollen joint'],
    conditions: ['Osteoarthritis', 'Rheumatoid Arthritis', 'Herniated Disc', 'Fracture', 'Tendinitis', 'Bursitis', 'Scoliosis'],
    urgency: { 'fracture': 'high', 'back pain': 'medium', 'joint pain': 'low' },
    followUp: ['Did the pain start after an injury?', 'Is the joint swollen or warm?', 'Does the pain worsen with movement?'],
  },
  pulmonology: {
    keywords: ['cough', 'breathing', 'lung', 'asthma', 'wheeze', 'bronchitis', 'pneumonia', 'shortness of breath', 'chest tightness', 'sleep apnea', 'snoring', 'copd', 'oxygen', 'inhaler'],
    conditions: ['Asthma', 'COPD', 'Pneumonia', 'Bronchitis', 'Sleep Apnea', 'Pulmonary Embolism', 'Pleurisy'],
    urgency: { 'pneumonia': 'high', 'asthma attack': 'emergency', 'cough': 'low' },
    followUp: ['Is the cough dry or productive?', 'Do you smoke or have you smoked?', 'Does breathing difficulty worsen at night?'],
  },
  psychiatry: {
    keywords: ['anxiety', 'depression', 'stress', 'panic', 'mental health', 'mood', 'sleep problem', 'insomnia', 'trauma', 'ptsd', 'ocd', 'phobia', 'hallucination', 'bipolar', 'eating disorder', 'sad', 'hopeless', 'suicidal'],
    conditions: ['Major Depression', 'Generalized Anxiety', 'PTSD', 'Bipolar Disorder', 'OCD', 'Panic Disorder', 'Insomnia'],
    urgency: { 'suicidal': 'emergency', 'panic': 'high', 'depression': 'medium', 'anxiety': 'medium' },
    followUp: ['How long have you been feeling this way?', 'Is this affecting your daily life?', 'Have you had any previous mental health treatment?'],
  },
  gastroenterology: {
    keywords: ['stomach', 'abdomen', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'bloating', 'heartburn', 'acid reflux', 'ibs', 'crohn', 'colitis', 'liver', 'jaundice', 'blood in stool', 'abdominal pain'],
    conditions: ['GERD', 'IBS', 'Crohn\'s Disease', 'Ulcerative Colitis', 'Peptic Ulcer', 'Hepatitis', 'Gallstones'],
    urgency: { 'blood in stool': 'high', 'severe abdominal pain': 'high', 'nausea': 'low' },
    followUp: ['Is the pain constant or comes and goes?', 'Have you noticed any blood in your stool?', 'Does eating make it better or worse?'],
  },
  endocrinology: {
    keywords: ['diabetes', 'thyroid', 'hormone', 'weight gain', 'weight loss', 'fatigue', 'thirst', 'frequent urination', 'insulin', 'blood sugar', 'adrenal', 'pituitary', 'menopause', 'testosterone'],
    conditions: ['Type 2 Diabetes', 'Hypothyroidism', 'Hyperthyroidism', 'Cushing\'s Syndrome', 'PCOS', 'Adrenal Insufficiency'],
    urgency: { 'diabetic emergency': 'emergency', 'thyroid': 'medium', 'diabetes': 'medium' },
    followUp: ['Do you have a family history of diabetes?', 'Have you noticed changes in your weight recently?', 'Are you experiencing excessive thirst or urination?'],
  },
  ophthalmology: {
    keywords: ['eye', 'vision', 'blurry', 'blind', 'cataract', 'glaucoma', 'red eye', 'eye pain', 'floaters', 'dry eye', 'contact lens', 'glasses', 'retina'],
    conditions: ['Glaucoma', 'Cataract', 'Macular Degeneration', 'Conjunctivitis', 'Dry Eye Syndrome', 'Retinal Detachment'],
    urgency: { 'sudden vision loss': 'emergency', 'eye pain': 'high', 'red eye': 'medium' },
    followUp: ['Is the vision loss sudden or gradual?', 'Do you see flashes or floaters?', 'Is there pain associated with the vision change?'],
  },
  general: {
    keywords: ['fever', 'cold', 'flu', 'tired', 'fatigue', 'general', 'checkup', 'routine', 'vaccination', 'weight', 'blood test', 'physical exam'],
    conditions: ['Common Cold', 'Influenza', 'Fatigue Syndrome', 'Vitamin Deficiency', 'Anemia'],
    urgency: { 'high fever': 'high', 'fever': 'medium', 'cold': 'low' },
    followUp: ['How long have you had these symptoms?', 'Do you have any chronic conditions?', 'Are you currently taking any medications?'],
  },
};

// ── Conversation context store (in-memory, keyed by session) ─────────────
const sessions = new Map();

// ── Confidence scoring ────────────────────────────────────────────────────
function calcConfidence(text, specialtyKey, urgency) {
  const lower = text.toLowerCase();
  const data = MEDICAL_KB[specialtyKey] || MEDICAL_KB.general;
  const matchedKeywords = data.keywords.filter(k => lower.includes(k)).length;
  const totalKeywords = data.keywords.length;
  // Base: keyword match ratio (40–85%), boosted by urgency clarity
  let base = Math.min(85, 40 + Math.round((matchedKeywords / Math.max(totalKeywords, 1)) * 60));
  if (urgency === 'emergency') base = Math.min(95, base + 10);
  if (urgency === 'high')      base = Math.min(90, base + 5);
  return base;
}

function getSource(specialtyKey) {
  const sources = {
    cardiology:      'ACC/AHA Cardiovascular Guidelines 2023',
    neurology:       'AAN Neurology Practice Guidelines',
    dermatology:     'AAD Clinical Dermatology Guidelines',
    pediatrics:      'AAP Pediatric Care Guidelines 2023',
    orthopedics:     'AAOS Orthopedic Practice Guidelines',
    pulmonology:     'GINA / ATS Respiratory Guidelines 2023',
    psychiatry:      'APA DSM-5-TR & Practice Guidelines',
    gastroenterology:'ACG Gastroenterology Guidelines 2022',
    endocrinology:   'ADA Standards of Care 2024',
    ophthalmology:   'AAO Eye Care Clinical Guidelines',
    general:         'WHO & USPSTF General Health Guidelines 2024',
  };
  return sources[specialtyKey] || 'General Medical Knowledge Base';
}

function buildReasons(text, specialtyKey, urgency) {
  const lower = text.toLowerCase();
  const data  = MEDICAL_KB[specialtyKey] || MEDICAL_KB.general;
  const reasons = [];
  const matched = data.keywords.filter(k => lower.includes(k));
  if (matched.length > 0)
    reasons.push(`Symptom keywords detected: ${matched.slice(0, 4).join(', ')}`);
  const urgencyTriggers = Object.entries(data.urgency || {}).filter(([k]) => lower.includes(k));
  if (urgencyTriggers.length > 0)
    reasons.push(`Urgency trigger: "${urgencyTriggers[0][0]}" → ${urgencyTriggers[0][1]} priority`);
  reasons.push(`Specialty matched: ${specialtyKey} (${matched.length} of ${data.keywords.length} keywords)`);
  const conf = calcConfidence(text, specialtyKey, urgency);
  reasons.push(`AI confidence: ${conf}% based on symptom-keyword overlap`);
  return reasons;
}

function detectSpecialty(text) {
  const lower = text.toLowerCase();
  let best = { key: null, score: 0 };
  for (const [key, data] of Object.entries(MEDICAL_KB)) {
    const score = data.keywords.filter(k => lower.includes(k)).length;
    if (score > best.score) best = { key, score };
  }
  return best.key;
}

function detectUrgency(text, specialtyKey) {
  const lower = text.toLowerCase();
  const data = MEDICAL_KB[specialtyKey];
  if (!data) return 'low';
  for (const [trigger, level] of Object.entries(data.urgency || {})) {
    if (lower.includes(trigger)) return level;
  }
  return 'low';
}

function buildResponse(userText, session, doctors) {
  const lower = userText.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|سلام|مرحبا|bonjour)/.test(lower)) {
    return {
      text: "Hello! 👋 I'm your AI Health Assistant. I'm here to help you understand your symptoms and find the right specialist.\n\nPlease describe what you're experiencing — be as detailed as you can. For example:\n• *\"I have a severe headache and feel nauseous\"*\n• *\"My knee has been swollen and painful for 3 days\"*\n• *\"I feel anxious and can't sleep\"*",
      type: 'text',
    };
  }

  // Thanks
  if (/thank|شكر|merci/.test(lower)) {
    return {
      text: "You're welcome! 😊 Remember, this is general health guidance only. Please consult a licensed doctor for a proper diagnosis. Is there anything else I can help you with?",
      type: 'text',
    };
  }

  // Emergency keywords — expanded list
  const emergencyWords = [
    "can't breathe", "cannot breathe", "chest crushing", "chest pain",
    "heart attack", "stroke", "unconscious", "overdose", "severe bleeding",
    "i'm dying", "im dying", "dying", "suicidal", "kill myself",
    "can't move", "cannot move", "paralyzed", "seizure", "convulsion",
    "severe chest", "crushing pain", "no pulse", "not breathing"
  ];
  if (emergencyWords.some(w => lower.includes(w))) {
    return {
      text: '🚨 **EMERGENCY — Call 123 (Egypt Emergency) or go to the nearest ER immediately!**\n\nThe symptoms you described may indicate a life-threatening condition. Do not wait — seek emergency care right now.\n\nIf you are with someone, ask them to call for help while you stay calm.',
      type: 'text',
      urgency: 'emergency',
      confidence: 99,
      source: 'Emergency Medical Protocol',
    };
  }

  const specialtyKey = detectSpecialty(userText);
  const urgency = specialtyKey ? detectUrgency(userText, specialtyKey) : 'low';
  const data = MEDICAL_KB[specialtyKey] || MEDICAL_KB.general;

  // Build a rich, conversational response
  const specialtyName = specialtyKey ? specialtyKey.charAt(0).toUpperCase() + specialtyKey.slice(1) : 'General Practice';
  const possibleConditions = data.conditions.slice(0, 3).join(', ');

  let responseText = '';

  // Urgency banner
  if (urgency === 'high') {
    responseText += '⚠️ **Your symptoms may need prompt medical attention.**\n\n';
  }

  responseText += `Based on what you've described, your symptoms suggest a possible **${specialtyName}** concern.\n\n`;
  responseText += `**Possible conditions** that match your symptoms include:\n`;
  data.conditions.slice(0, 4).forEach(c => { responseText += `• ${c}\n`; });

  responseText += `\n**What I recommend:**\n`;

  if (urgency === 'high') {
    responseText += `• See a ${specialtyName} specialist **as soon as possible** — within 24–48 hours\n`;
    responseText += `• If symptoms worsen suddenly, go to the emergency room\n`;
  } else if (urgency === 'medium') {
    responseText += `• Schedule an appointment with a ${specialtyName} specialist within the next few days\n`;
    responseText += `• Monitor your symptoms and note any changes\n`;
  } else {
    responseText += `• A consultation with a ${specialtyName} specialist is advisable\n`;
    responseText += `• Keep track of when symptoms occur and their severity\n`;
  }

  responseText += `• Avoid self-medicating without professional guidance\n`;
  responseText += `\n⚠️ *This is AI-generated health information, not a medical diagnosis. Always consult a licensed physician.*`;

  // Follow-up question
  const followUp = data.followUp?.[Math.floor(Math.random() * (data.followUp?.length || 1))];
  if (followUp) {
    responseText += `\n\n💬 **${followUp}**`;
  }

  return {
    text: responseText,
    type: 'doctor-card',
    specialtyKey,
    urgency,
    confidence: calcConfidence(userText, specialtyKey, urgency),
    source: getSource(specialtyKey),
    reasons: buildReasons(userText, specialtyKey, urgency),
    doctors: doctors.slice(0, 3),
    suggestions: [
      `Tell me more about ${specialtyName} conditions`,
      'What tests might I need?',
      'How urgent is this?',
      'What lifestyle changes help?',
    ],
  };
}

function buildFollowUp(userText, session) {
  const lower = userText.toLowerCase();

  if (lower.includes('test') || lower.includes('diagnosis') || lower.includes('exam')) {
    const specialty = session.lastSpecialty;
    const tests = {
      cardiology: 'ECG, Echocardiogram, Stress Test, Blood lipid panel, Troponin levels',
      neurology: 'MRI Brain, CT Scan, EEG, Nerve Conduction Study, Lumbar Puncture',
      dermatology: 'Skin biopsy, Patch test, Dermoscopy, KOH test for fungal infections',
      orthopedics: 'X-Ray, MRI, CT Scan, Bone density scan, Joint fluid analysis',
      pulmonology: 'Chest X-Ray, Spirometry, CT Chest, Bronchoscopy, Pulse Oximetry',
      psychiatry: 'Psychological evaluation, PHQ-9, GAD-7, Sleep study, Blood tests to rule out organic causes',
      gastroenterology: 'Endoscopy, Colonoscopy, Abdominal ultrasound, Stool test, H. pylori test',
      endocrinology: 'HbA1c, Thyroid panel (TSH, T3, T4), Fasting glucose, Hormone levels',
      ophthalmology: 'Visual acuity test, Tonometry, Fundoscopy, OCT scan, Visual field test',
      general: 'Complete Blood Count (CBC), Metabolic panel, Urinalysis, Chest X-Ray',
    };
    const testList = tests[specialty] || tests.general;
    return { text: `For **${specialty || 'general'}** concerns, common diagnostic tests include:\n\n${testList.split(', ').map(t => `• ${t}`).join('\n')}\n\nYour doctor will determine which tests are appropriate based on your specific symptoms and medical history.`, type: 'text' };
  }

  if (lower.includes('lifestyle') || lower.includes('diet') || lower.includes('exercise') || lower.includes('prevent')) {
    const specialty = session.lastSpecialty;
    const tips = {
      cardiology: '• Eat a heart-healthy diet (low sodium, low saturated fat)\n• Exercise 30 min/day, 5 days/week\n• Quit smoking\n• Manage stress\n• Monitor blood pressure regularly',
      neurology: '• Maintain regular sleep schedule\n• Stay hydrated\n• Manage stress with meditation\n• Avoid known migraine triggers\n• Regular gentle exercise',
      dermatology: '• Use SPF 30+ sunscreen daily\n• Moisturize regularly\n• Avoid harsh soaps\n• Stay hydrated\n• Eat antioxidant-rich foods',
      orthopedics: '• Maintain healthy weight\n• Low-impact exercise (swimming, cycling)\n• Strengthen core muscles\n• Use proper posture\n• Warm up before exercise',
      pulmonology: '• Quit smoking immediately\n• Avoid air pollutants\n• Use air purifier at home\n• Practice breathing exercises\n• Stay up to date on flu vaccines',
      psychiatry: '• Regular exercise (proven to reduce anxiety/depression)\n• Consistent sleep schedule\n• Limit caffeine and alcohol\n• Practice mindfulness or meditation\n• Maintain social connections',
      gastroenterology: '• Eat smaller, more frequent meals\n• Avoid trigger foods (spicy, fatty)\n• Stay hydrated\n• Increase fiber intake\n• Reduce stress',
      general: '• Balanced diet with fruits and vegetables\n• Regular physical activity\n• Adequate sleep (7-9 hours)\n• Stay hydrated\n• Regular health checkups',
    };
    const tipList = tips[specialty] || tips.general;
    return { text: `**Lifestyle recommendations for ${specialty || 'general health'}:**\n\n${tipList}\n\nThese are general guidelines. Your doctor may have specific recommendations based on your condition.`, type: 'text' };
  }

  if (lower.includes('urgent') || lower.includes('serious') || lower.includes('emergency') || lower.includes('how bad')) {
    const urgency = session.lastUrgency;
    const msgs = {
      emergency: '🚨 **SEEK EMERGENCY CARE IMMEDIATELY.** Call emergency services or go to the nearest ER.',
      high: '⚠️ **This is moderately urgent.** You should see a doctor within 24–48 hours. If symptoms worsen, go to the ER.',
      medium: '🟡 **This needs attention soon.** Schedule an appointment within the next few days.',
      low: '🟢 **This is not immediately urgent.** However, you should still consult a doctor to get a proper diagnosis.',
    };
    return { text: msgs[urgency] || msgs.low, type: 'text' };
  }

  if (lower.includes('more about') || lower.includes('tell me about') || lower.includes('explain')) {
    const specialty = session.lastSpecialty;
    const info = {
      cardiology: 'Cardiology deals with disorders of the heart and blood vessels. Common conditions include coronary artery disease, heart failure, arrhythmias, and hypertension. Cardiologists use tests like ECG, echocardiogram, and stress tests to diagnose and treat these conditions.',
      neurology: 'Neurology focuses on disorders of the nervous system including the brain, spinal cord, and nerves. Neurologists treat conditions like migraines, epilepsy, stroke, Parkinson\'s disease, and multiple sclerosis.',
      dermatology: 'Dermatology covers conditions affecting the skin, hair, and nails. Dermatologists treat everything from acne and eczema to skin cancer. They also perform cosmetic procedures.',
      orthopedics: 'Orthopedics deals with the musculoskeletal system — bones, joints, muscles, tendons, and ligaments. Orthopedic surgeons treat fractures, arthritis, sports injuries, and spine conditions.',
      pulmonology: 'Pulmonology focuses on diseases of the respiratory system. Pulmonologists treat asthma, COPD, pneumonia, sleep apnea, and lung cancer.',
      psychiatry: 'Psychiatry is the medical specialty focused on mental health. Psychiatrists diagnose and treat conditions like depression, anxiety, bipolar disorder, schizophrenia, and PTSD using therapy and medication.',
      gastroenterology: 'Gastroenterology covers the digestive system from mouth to anus. Gastroenterologists treat GERD, IBS, Crohn\'s disease, liver disease, and perform procedures like endoscopy and colonoscopy.',
    };
    const text = info[specialty] || `${specialty} is a medical specialty focused on diagnosing and treating specific conditions. A specialist in this field has advanced training beyond general medicine.`;
    return { text, type: 'text' };
  }

  return null;
}

// ── Main controller ───────────────────────────────────────────────────────

// POST /api/symptom/chat
exports.chat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const sid = sessionId || 'anon';
    if (!sessions.has(sid)) sessions.set(sid, { history: [], lastSpecialty: null, lastUrgency: 'low', turnCount: 0 });
    const session = sessions.get(sid);
    session.turnCount++;

    // Try follow-up first if we have context
    if (session.lastSpecialty) {
      const followUp = buildFollowUp(message, session);
      if (followUp) {
        session.history.push({ role: 'user', text: message });
        session.history.push({ role: 'bot', ...followUp });
        return res.json({ ...followUp, sessionId: sid });
      }
    }

    // Detect specialty and fetch matching doctors
    const specialtyKey = detectSpecialty(message);
    let doctors = [];
    if (specialtyKey && specialtyKey !== 'general') {
      doctors = await Doctor.find({ specialtyKey }).sort({ rating: -1 }).limit(3);
    } else {
      doctors = await Doctor.find().sort({ rating: -1 }).limit(3);
    }

    const response = buildResponse(message, session, doctors);

    // Enrich response with semantic RAG context
    const { retrieveContextSemantic } = require('../utils/ragEngine');
    const ragContext = await retrieveContextSemantic(message);
    if (ragContext.length > 0 && !response.text.includes('EMERGENCY')) {
      response.ragContext = ragContext.map(a => ({
        title: a.title,
        source: a.source,
        score: a.score,
      }));
    }

    // Update session context
    if (response.specialtyKey) session.lastSpecialty = response.specialtyKey;
    if (response.urgency) session.lastUrgency = response.urgency;
    session.history.push({ role: 'user', text: message });
    session.history.push({ role: 'bot', text: response.text });

    res.json({ ...response, sessionId: sid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/symptom/reset
exports.reset = (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) sessions.delete(sessionId);
  res.json({ message: 'Session reset' });
};

// ── Guided Symptom Flow ───────────────────────────────────────────────────
const flowSessions = new Map();

const FLOW_STEPS = [
  { key: 'symptoms',   question: "What are your main symptoms? (e.g. fever, headache, chest pain)" },
  { key: 'duration',   question: "How long have you had these symptoms? (e.g. 2 days, 1 week)" },
  { key: 'severity',   question: "How would you rate the severity? (mild / moderate / severe)" },
  { key: 'fever',      question: "Do you have a fever? If yes, what is your temperature?" },
  { key: 'breathing',  question: "Are you experiencing any difficulty breathing or shortness of breath? (yes / no)" },
  { key: 'history',    question: "Do you have any known medical conditions or allergies? (or type 'none')" },
];

function analyzeFlowAnswers(answers) {
  const symptoms  = (answers.symptoms  || '').toLowerCase();
  const severity  = (answers.severity  || '').toLowerCase();
  const fever     = (answers.fever     || '').toLowerCase();
  const breathing = (answers.breathing || '').toLowerCase();

  // Emergency check first
  const emergencyTerms = ['chest pain', 'can\'t breathe', 'cannot breathe', 'heart attack',
    'stroke', 'unconscious', 'severe bleeding', 'dying', 'suicidal', 'seizure'];
  if (emergencyTerms.some(t => symptoms.includes(t))) {
    return {
      urgency: 'emergency',
      condition: 'Possible Medical Emergency',
      specialty: 'Emergency Medicine',
      specialtyKey: 'general',
      recommendation: '🚨 EMERGENCY — Call 123 or go to the nearest ER immediately. Do not wait.',
      confidence: 99,
      source: 'Emergency Medical Protocol',
    };
  }

  // Breathing difficulty
  if (breathing === 'yes' || breathing.includes('yes')) {
    return {
      urgency: 'high',
      condition: 'Respiratory Distress',
      specialty: 'Pulmonologist',
      specialtyKey: 'pulmonology',
      recommendation: 'Seek medical attention within 24 hours. Breathing difficulty can indicate asthma, pneumonia, or other serious conditions.',
      confidence: 82,
      source: 'GINA / ATS Respiratory Guidelines 2023',
    };
  }

  // Fever + cough/cold
  const hasFever = fever !== 'no' && fever !== 'none' && fever.length > 0 && !fever.includes('no');
  if (hasFever && (symptoms.includes('cough') || symptoms.includes('cold') || symptoms.includes('flu'))) {
    const isHigh = fever.includes('39') || fever.includes('40') || fever.includes('high');
    return {
      urgency: isHigh ? 'high' : 'medium',
      condition: isHigh ? 'Possible Flu / Viral Infection (High Fever)' : 'Possible Flu / Viral Infection',
      specialty: 'General Practitioner',
      specialtyKey: 'general',
      recommendation: isHigh
        ? 'See a doctor within 24 hours. High fever with cough may indicate flu, COVID-19, or pneumonia.'
        : 'Rest, stay hydrated, and monitor symptoms. See a doctor if symptoms worsen after 3 days.',
      confidence: 75,
      source: 'WHO & USPSTF General Health Guidelines 2024',
    };
  }

  // Headache / neurological
  if (symptoms.includes('headache') || symptoms.includes('migraine') || symptoms.includes('dizz')) {
    const isSevere = severity.includes('severe');
    return {
      urgency: isSevere ? 'high' : 'medium',
      condition: isSevere ? 'Severe Headache — Possible Migraine or Neurological Issue' : 'Headache / Migraine',
      specialty: 'Neurologist',
      specialtyKey: 'neurology',
      recommendation: isSevere
        ? 'Sudden severe headache ("thunderclap") requires immediate evaluation. See a neurologist urgently.'
        : 'Track headache frequency and triggers. Schedule a neurology consultation if recurring.',
      confidence: 72,
      source: 'AAN Neurology Practice Guidelines',
    };
  }

  // Stomach / GI
  if (symptoms.includes('stomach') || symptoms.includes('nausea') || symptoms.includes('vomit') ||
      symptoms.includes('diarrhea') || symptoms.includes('abdom')) {
    return {
      urgency: 'medium',
      condition: 'Gastrointestinal Issue',
      specialty: 'Gastroenterologist',
      specialtyKey: 'gastroenterology',
      recommendation: 'Avoid spicy/fatty foods, stay hydrated. See a gastroenterologist if symptoms persist beyond 3 days.',
      confidence: 68,
      source: 'ACG Gastroenterology Guidelines 2022',
    };
  }

  // Joint / bone pain
  if (symptoms.includes('joint') || symptoms.includes('knee') || symptoms.includes('back') ||
      symptoms.includes('bone') || symptoms.includes('muscle')) {
    return {
      urgency: 'low',
      condition: 'Musculoskeletal Pain',
      specialty: 'Orthopedic Specialist',
      specialtyKey: 'orthopedics',
      recommendation: 'Rest the affected area. Apply ice/heat. See an orthopedic specialist if pain persists beyond 1 week.',
      confidence: 70,
      source: 'AAOS Orthopedic Practice Guidelines',
    };
  }

  // Anxiety / mental health
  if (symptoms.includes('anxiet') || symptoms.includes('depress') || symptoms.includes('stress') ||
      symptoms.includes('panic') || symptoms.includes('sleep')) {
    return {
      urgency: 'medium',
      condition: 'Mental Health Concern',
      specialty: 'Psychiatrist',
      specialtyKey: 'psychiatry',
      recommendation: 'Mental health is as important as physical health. Schedule a consultation with a psychiatrist or therapist.',
      confidence: 73,
      source: 'APA DSM-5-TR & Practice Guidelines',
    };
  }

  // Default — general
  const specialtyKey = detectSpecialty(symptoms) || 'general';
  const data = MEDICAL_KB[specialtyKey] || MEDICAL_KB.general;
  return {
    urgency: 'low',
    condition: data.conditions[0] || 'General Health Concern',
    specialty: specialtyKey.charAt(0).toUpperCase() + specialtyKey.slice(1),
    specialtyKey,
    recommendation: 'Based on your symptoms, a consultation with a specialist is recommended. Monitor your symptoms and seek care if they worsen.',
    confidence: calcConfidence(symptoms, specialtyKey, 'low'),
    source: getSource(specialtyKey),
  };
}

// POST /api/symptom/flow
exports.flow = async (req, res) => {
  try {
    const { answer, sessionId } = req.body;
    const sid = sessionId || ('flow_' + Date.now());

    // New session — return first question
    if (!flowSessions.has(sid)) {
      flowSessions.set(sid, { step: 0, answers: {}, totalSteps: FLOW_STEPS.length });
      return res.json({
        sessionId: sid,
        step: 0,
        totalSteps: FLOW_STEPS.length,
        question: FLOW_STEPS[0].question,
        key: FLOW_STEPS[0].key,
        done: false,
      });
    }

    const session = flowSessions.get(sid);

    // Save the answer for the current step
    if (answer !== undefined && session.step < FLOW_STEPS.length) {
      const currentKey = FLOW_STEPS[session.step].key;
      session.answers[currentKey] = answer;
      session.step++;
    }

    // Check for emergency in any answer
    const allAnswers = Object.values(session.answers).join(' ').toLowerCase();
    const emergencyTerms = ['chest pain', "can't breathe", 'heart attack', 'stroke', 'unconscious', 'dying', 'suicidal', 'seizure'];
    if (emergencyTerms.some(t => allAnswers.includes(t))) {
      flowSessions.delete(sid);
      return res.json({
        sessionId: sid,
        done: true,
        emergency: true,
        result: {
          urgency: 'emergency',
          condition: 'Possible Medical Emergency',
          specialty: 'Emergency Medicine',
          specialtyKey: 'general',
          recommendation: '🚨 EMERGENCY — Call 123 or go to the nearest ER immediately!',
          confidence: 99,
          source: 'Emergency Medical Protocol',
        },
        answers: session.answers,
      });
    }

    // More steps remaining
    if (session.step < FLOW_STEPS.length) {
      return res.json({
        sessionId: sid,
        step: session.step,
        totalSteps: FLOW_STEPS.length,
        question: FLOW_STEPS[session.step].question,
        key: FLOW_STEPS[session.step].key,
        done: false,
      });
    }

    // All steps done — analyze and return result
    const result = analyzeFlowAnswers(session.answers);

    // Add explainability reasons based on answers
    const symptomsText = session.answers.symptoms || '';
    result.reasons = [
      `Symptoms reported: ${symptomsText}`,
      `Duration: ${session.answers.duration || 'not specified'}`,
      `Severity: ${session.answers.severity || 'not specified'}`,
      `Fever: ${session.answers.fever || 'not reported'}`,
      `Breathing difficulty: ${session.answers.breathing || 'not reported'}`,
      `Confidence: ${result.confidence}% — based on symptom pattern matching`,
    ].filter(r => !r.includes('not specified') && !r.includes('not reported'));

    // Fetch matching doctors
    let doctors = [];
    try {
      doctors = await Doctor.find({ specialtyKey: result.specialtyKey }).sort({ rating: -1 }).limit(3);
    } catch (_) {}

    flowSessions.delete(sid);
    return res.json({
      sessionId: sid,
      done: true,
      result: { ...result, doctors },
      answers: session.answers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/symptom/flow/reset
exports.flowReset = (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) flowSessions.delete(sessionId);
  res.json({ message: 'Flow session reset' });
};

// POST /api/symptom/analyze — Quick symptom analysis (for tests and simple queries)
exports.analyze = async (req, res) => {
  try {
    const { symptoms, age, gender } = req.body;
    if (!symptoms) return res.status(400).json({ message: 'Symptoms are required' });

    const lower = symptoms.toLowerCase();

    // Emergency detection
    const emergencyWords = [
      "can't breathe", "cannot breathe", "chest pain", "heart attack",
      "stroke", "unconscious", "overdose", "severe bleeding",
      "i'm dying", "im dying", "suicidal", "kill myself",
      "seizure", "convulsion", "not breathing", "no pulse", "crushing pain"
    ];
    
    if (emergencyWords.some(w => lower.includes(w))) {
      return res.json({
        specialty: 'Emergency Medicine',
        specialtyKey: 'general',
        urgency: 'emergency',
        confidence: 99,
        condition: 'Medical Emergency',
        recommendation: '🚨 EMERGENCY — Call 123 (Egypt Emergency) or go to the nearest hospital immediately!',
        reasons: [
          'Emergency keywords detected in symptoms',
          'Immediate medical attention required',
          'Do not delay — seek help now',
          'Confidence: 99% — critical situation'
        ],
        source: 'Emergency Medical Protocol',
      });
    }

    // Detect specialty
    const specialtyKey = detectSpecialty(symptoms);
    const urgency = specialtyKey ? detectUrgency(symptoms, specialtyKey) : 'low';
    const data = MEDICAL_KB[specialtyKey] || MEDICAL_KB.general;
    const confidence = calcConfidence(symptoms, specialtyKey, urgency);
    const reasons = buildReasons(symptoms, specialtyKey, urgency);

    // Get specialty name
    const specialtyName = specialtyKey ? specialtyKey.charAt(0).toUpperCase() + specialtyKey.slice(1) : 'General Practice';

    // Build recommendation
    let recommendation = '';
    if (urgency === 'high') {
      recommendation = `See a ${specialtyName} specialist as soon as possible — within 24–48 hours. If symptoms worsen, go to the emergency room.`;
    } else if (urgency === 'medium') {
      recommendation = `Schedule an appointment with a ${specialtyName} specialist within the next few days. Monitor your symptoms.`;
    } else {
      recommendation = `A consultation with a ${specialtyName} specialist is advisable. Keep track of your symptoms.`;
    }

    // Get possible conditions
    const condition = data.conditions[0] || 'General Health Concern';

    // Fetch matching doctors
    let doctors = [];
    try {
      if (specialtyKey && specialtyKey !== 'general') {
        doctors = await Doctor.find({ specialtyKey }).sort({ rating: -1 }).limit(3);
      } else {
        doctors = await Doctor.find().sort({ rating: -1 }).limit(3);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }

    res.json({
      specialty: specialtyName,
      specialtyKey,
      urgency,
      confidence,
      condition,
      recommendation,
      reasons,
      source: getSource(specialtyKey),
      doctors: doctors.slice(0, 3),
      possibleConditions: data.conditions.slice(0, 4),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
