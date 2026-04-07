/**
 * One-time script to embed all medical KB articles into Pinecone.
 * Run once: node src/utils/embedKnowledgeBase.js
 *
 * Requirements:
 *   PINECONE_API_KEY=...  in backend/.env
 *   PINECONE_INDEX=healthai-medical
 *   OPENAI_API_KEY=sk-...
 *
 * Pinecone index settings:
 *   Dimensions: 1536  (text-embedding-3-small)
 *   Metric: cosine
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { MEDICAL_KB } = require('./medicalKnowledgeBase');

async function embed() {
  const { Pinecone }         = require('@pinecone-database/pinecone');
  const { OpenAIEmbeddings } = require('@langchain/openai');

  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
    console.error('❌ PINECONE_API_KEY and PINECONE_INDEX must be set in .env');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY must be set in .env');
    process.exit(1);
  }

  console.log('🔗 Connecting to Pinecone...');
  const pc    = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(process.env.PINECONE_INDEX);

  console.log('🧠 Loading OpenAI embeddings model...');
  const embedder = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });

  console.log(`📚 Embedding ${MEDICAL_KB.length} medical articles...`);

  const vectors = [];
  for (const article of MEDICAL_KB) {
    const text = `${article.title}\n${article.content}`;
    const embedding = await embedder.embedQuery(text);
    vectors.push({
      id: article.id,
      values: embedding,
      metadata: {
        id:        article.id,
        title:     article.title,
        specialty: article.specialty,
        content:   article.content.substring(0, 1000), // Pinecone metadata limit
        source:    article.source,
        tags:      JSON.stringify(article.tags),
      },
    });
    console.log(`  ✅ Embedded: ${article.title}`);
  }

  console.log('📤 Uploading vectors to Pinecone...');
  // Upsert in batches of 10
  for (let i = 0; i < vectors.length; i += 10) {
    await index.upsert(vectors.slice(i, i + 10));
  }

  console.log(`\n✅ Done! ${vectors.length} articles embedded into Pinecone index "${process.env.PINECONE_INDEX}"`);
  console.log('🚀 Your RAG system is now using semantic vector search!');
  process.exit(0);
}

embed().catch(err => {
  console.error('❌ Embedding failed:', err.message);
  process.exit(1);
});
