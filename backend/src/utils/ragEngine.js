/**
 * HealthAI RAG Engine
 * ─────────────────────────────────────────────────────────────────────────
 * Upgrades from keyword search → semantic vector search using:
 *   - OpenAI text-embedding-3-small  (embeddings)
 *   - Pinecone                        (vector store)
 *   - LangChain                       (orchestration)
 *
 * SETUP (one-time):
 *   1. Add to backend/.env:
 *        PINECONE_API_KEY=your_key
 *        PINECONE_INDEX=healthai-medical
 *   2. Run once to embed all articles:
 *        node src/utils/embedKnowledgeBase.js
 *   3. Done — all queries now use semantic search automatically.
 *
 * FALLBACK: If Pinecone is not configured, falls back to keyword search.
 */

const { MEDICAL_KB, retrieveContext: keywordRetrieve } = require('./medicalKnowledgeBase');

let pineconeClient = null;
let pineconeIndex   = null;
let embedModel      = null;
let ragReady        = false;

// ── Initialize Pinecone + Embeddings ─────────────────────────────────────
async function initRAG() {
  if (ragReady) return true;

  const hasPinecone = process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX;
  const hasOpenAI   = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai');

  if (!hasPinecone || !hasOpenAI) {
    console.log('[RAG] Pinecone/OpenAI not configured — using keyword fallback');
    return false;
  }

  try {
    const { Pinecone }       = require('@pinecone-database/pinecone');
    const { OpenAIEmbeddings } = require('@langchain/openai');

    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    pineconeIndex  = pineconeClient.index(process.env.PINECONE_INDEX);
    embedModel     = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });

    ragReady = true;
    console.log('[RAG] Pinecone vector search ready ✅');
    return true;
  } catch (err) {
    console.warn('[RAG] Init failed, using keyword fallback:', err.message);
    return false;
  }
}

// ── Semantic vector search ────────────────────────────────────────────────
async function vectorSearch(query, topN = 3) {
  try {
    const queryEmbedding = await embedModel.embedQuery(query);
    const results = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: topN,
      includeMetadata: true,
    });

    return results.matches
      .filter(m => m.score > 0.3)
      .map(m => ({
        id:       m.metadata.id,
        title:    m.metadata.title,
        specialty: m.metadata.specialty,
        content:  m.metadata.content,
        source:   m.metadata.source,
        tags:     m.metadata.tags ? JSON.parse(m.metadata.tags) : [],
        score:    m.score,
      }));
  } catch (err) {
    console.warn('[RAG] Vector search failed, falling back to keyword:', err.message);
    return null;
  }
}

// ── Main retrieval function (auto-selects best method) ───────────────────
async function retrieveContextSemantic(query, topN = 3) {
  const ready = await initRAG();

  if (ready) {
    const results = await vectorSearch(query, topN);
    if (results && results.length > 0) return results;
  }

  // Fallback to keyword search
  return keywordRetrieve(query, topN);
}

// ── Build RAG prompt (async version with semantic search) ─────────────────
async function buildRAGPromptSemantic(userMessage, language = 'en') {
  const context = await retrieveContextSemantic(userMessage);

  const systemPrompt = language === 'ar'
    ? 'أنت مساعد طبي ذكي لمنصة HealthAI. استخدم المعلومات الطبية المقدمة للإجابة بدقة. لا تقدم تشخيصاً طبياً نهائياً. اقترح دائماً استشارة طبيب مرخص.'
    : language === 'fr'
    ? 'Vous êtes un assistant médical intelligent pour la plateforme HealthAI. Utilisez les informations médicales fournies pour répondre avec précision. Ne posez jamais de diagnostic définitif. Recommandez toujours de consulter un médecin qualifié.'
    : 'You are an intelligent medical AI assistant for HealthAI platform. Use ONLY the provided medical knowledge context to answer. Be accurate, empathetic, and clear. NEVER provide a definitive diagnosis. Always recommend consulting a licensed physician. If the context does not cover the question, say so honestly.';

  const contextText = context.length > 0
    ? `\n\nMEDICAL KNOWLEDGE CONTEXT (use this to answer):\n${context.map(a => `[${a.title} — ${a.source}]\n${a.content}`).join('\n\n')}`
    : '\n\n(No specific medical context found — answer from general medical knowledge, but be conservative.)';

  return {
    systemPrompt: systemPrompt + contextText,
    contextUsed: context.map(a => ({ title: a.title, source: a.source, score: a.score })),
    method: ragReady ? 'vector' : 'keyword',
  };
}

module.exports = { retrieveContextSemantic, buildRAGPromptSemantic, initRAG };
