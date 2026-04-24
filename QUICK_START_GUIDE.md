# 🚀 HealthAI Platform - QUICK START GUIDE

**Status**: ✅ All Systems Operational

---

## 🎯 What You Have

A complete AI-powered healthcare platform with:
- **Advanced AI Chatbot** with 131 symptoms, 41 diseases, 5 ML models
- **Doctor Assistant** with disease information and precautions
- **Professional Frontend** with dark theme and real-time chat
- **3 Servers Running**: Angular (4200), Node.js (3000), Python (5000)

---

## 🌐 Access Points

| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | http://localhost:4200 | User interface |
| **Node.js API** | http://localhost:3000 | User management, appointments |
| **Python API** | http://localhost:5000 | AI chatbot, doctor assistant |

---

## 💬 Test the Chatbot

### Via Frontend
1. Open http://localhost:4200
2. Go to Chatbot section
3. Type: "I have a headache"
4. Get AI response with severity score

### Via Command Line
```bash
# Symptom query
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"I have a headache and fever"}'

# Disease query
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about diabetes"}'

# Greeting
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## 🧠 Chatbot Capabilities

### What It Can Do
✅ Analyze symptoms and suggest diseases  
✅ Provide disease information and precautions  
✅ Calculate symptom severity (1-10 scale)  
✅ Detect emergencies and alert immediately  
✅ Give health tips and wellness advice  
✅ Answer medication questions  
✅ Track conversation history  

### Example Queries
- "I have a headache and fever"
- "Tell me about diabetes"
- "What should I do about chest pain?"
- "Give me health tips"
- "Hello"

---

## 📊 System Features

### Doctor Assistant (8 endpoints)
- Get disease information
- Get precautions
- Search diseases
- Compare diseases
- Get statistics

### Chatbot (6 endpoints)
- Send message (AI response)
- Get symptom suggestions
- Get health tips
- View conversation history
- Clear history

### HealthAI Core (11 endpoints)
- Analyze symptoms
- Predict diagnosis
- Analyze lab results
- Emergency guidance
- Medication review
- Health metrics analysis
- Doctor recommendation

---

## 🔧 Server Status

Check if servers are running:

```bash
# Check Angular (4200)
curl http://localhost:4200

# Check Node.js (3000)
curl http://localhost:3000/api/health

# Check Python (5000)
curl http://localhost:5000/api/healthai/status
```

---

## 📁 Key Files

### Frontend
- `src/app/features/chatbot/components/advanced-chatbot/` - Chatbot UI

### Backend (Python)
- `python_backend/advanced_ai_chatbot.py` - Advanced chatbot engine
- `python_backend/healthai-api-routes.py` - API routes
- `python_backend/healthai-doctor-assistant.py` - Doctor service

### Datasets
- `python_backend/ai/datasets/` - 131 symptoms, 41 diseases
- `python_backend/ai/trained_models/` - 5 ML models

---

## 🚀 Start/Stop Servers

### Start All Servers
```bash
# Terminal 1: Angular
cd Health.AI
npm start

# Terminal 2: Node.js
cd Health.AI/backend
npm start

# Terminal 3: Python
cd Health.AI/python_backend
python healthai-app.py
```

### Stop Servers
```bash
# Press Ctrl+C in each terminal
```

---

## 🧪 Quick Tests

### Test 1: Symptom Analysis
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"I have a headache and mild fever"}'
```

**Expected Response**:
- Symptoms detected: headache, mild fever
- Severity score: 4/10
- Recommendations provided

### Test 2: Disease Information
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about diabetes"}'
```

**Expected Response**:
- Disease description
- Precautions listed
- Doctor consultation guidance

### Test 3: Emergency Detection
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"I have chest pain"}'
```

**Expected Response**:
- Emergency alert
- Action recommendations
- Urgent guidance

---

## 📊 Statistics

- **131 Symptoms** with severity scores
- **41 Diseases** with descriptions
- **39 Precautions** for diseases
- **4,921 Training Samples** for ML
- **5 Trained ML Models**
- **7 Intent Types** (emergency, symptoms, disease, greeting, tips, medication, general)
- **25+ API Endpoints**

---

## ✅ Verification

All systems operational:
- [x] Angular Frontend (Port 4200)
- [x] Node.js Backend (Port 3000)
- [x] Python Flask Backend (Port 5000)
- [x] Advanced AI Chatbot
- [x] All ML models loaded
- [x] All datasets loaded
- [x] All endpoints tested

---

## 🎯 Common Tasks

### Add a New Symptom
Edit: `python_backend/ai/datasets/healthai_symptom_severity.csv`

### Add a New Disease
Edit: `python_backend/ai/datasets/healthai_symptom_descriptions.csv`

### Update Chatbot Response
Edit: `python_backend/advanced_ai_chatbot.py` → `_initialize_responses()`

### Test New Endpoint
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"your test message"}'
```

---

## 🆘 Troubleshooting

### Chatbot Not Responding
1. Check Python backend is running: `curl http://localhost:5000/api/healthai/status`
2. Check frontend is calling correct endpoint: `http://localhost:5000/api/chatbot/message`
3. Check browser console for errors

### Symptoms Not Detected
1. Check symptom is in dataset: `python_backend/ai/datasets/healthai_symptom_severity.csv`
2. Check symptom name matches exactly
3. Restart Python backend

### Emergency Not Detected
1. Check keyword is in emergency list: `advanced_ai_chatbot.py` → `emergency_keywords`
2. Add new keyword if needed
3. Restart Python backend

---

## 📞 Support

For issues:
1. Check server logs in terminal
2. Check browser console (F12)
3. Verify all servers are running
4. Restart the affected server

---

## 🎉 You're All Set!

Your HealthAI platform is ready to use. Start with:

1. **Open Frontend**: http://localhost:4200
2. **Go to Chatbot**: Click Chatbot in navigation
3. **Type a Query**: "I have a headache"
4. **Get AI Response**: See intelligent analysis

Enjoy! 🚀

---

**Last Updated**: April 24, 2026  
**Status**: ✅ FULLY OPERATIONAL
