import RagDoc from '../models/ragDocModel.js';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { EmbeddingModel, FlagEmbedding } from 'fastembed';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import fs from 'fs';
import path from 'path';

// Initialize FastEmbed embedding model (async)
let embeddingModelPromise = null;
function getFastEmbedModel() {
  if (!embeddingModelPromise) {
    embeddingModelPromise = FlagEmbedding.init({
      model: EmbeddingModel.BGESmallEN // You can change model if needed
    });
  }
  return embeddingModelPromise;
}

// Initialize HuggingFace embeddings (sync)
const huggingfaceEmbeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: 'sentence-transformers/all-MiniLM-L6-v2',
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// Per-user FAISS stores in memory
const userFaissStores = new Map(); // userId -> FaissStore
const FAISS_DIR = path.join(process.cwd(), 'faiss_indices');
if (!fs.existsSync(FAISS_DIR)) {
  fs.mkdirSync(FAISS_DIR);
}

async function embedChunksPassage(chunks, provider = 'fastembed', batchSize = 256) {
  if (provider === 'huggingface') {
    return await huggingfaceEmbeddings.embedDocuments(chunks);
  } else {
    const embeddingModel = await getFastEmbedModel();
    const embeddingsIterator = embeddingModel.passageEmbed(chunks, batchSize);
    let allEmbeddings = [];
    for await (const batch of embeddingsIterator) {
      if (Array.isArray(batch)) {
        allEmbeddings.push(...batch.map(v => Array.from(v)));
      } else {
        allEmbeddings.push(Array.from(batch));
      }
    }
    return allEmbeddings;
  }
}

async function embedQuery(query, provider = 'fastembed') {
  if (provider === 'huggingface') {
    return (await huggingfaceEmbeddings.embedQuery(query));
  } else {
    const embeddingModel = await getFastEmbedModel();
    const result = await embeddingModel.queryEmbed(query);
    return Array.from(result); // Convert Float32Array to Array
  }
}

// Helper: get FAISS index directory path for a user
function getFaissFilePath(userId) {
  return path.join(FAISS_DIR, userId); // Use directory, not file
}

// Helper: load a user's FAISS index from disk, or create new if not exists
async function getUserFaissStore(userId) {
  if (userFaissStores.has(userId)) {
    return userFaissStores.get(userId);
  }
  const faissPath = getFaissFilePath(userId);
  let store;
  if (fs.existsSync(faissPath)) {
    store = await FaissStore.load(faissPath);
    // Set the embeddings property after loading
    store.embeddings = {
      embedQuery: async (input) => await embedQuery(input),
      embedDocuments: async (inputs) => await embedChunksPassage(inputs),
    };
    console.log(`[RAG] Loaded FAISS index for user ${userId} from disk.`);
  } else {
    store = await FaissStore.fromDocuments([], {
      embedQuery: async (input) => await embedQuery(input),
      embedDocuments: async (inputs) => await embedChunksPassage(inputs),
    });
    console.log(`[RAG] Created new FAISS index for user ${userId}.`);
  }
  userFaissStores.set(userId, store);
  return store;
}

// Helper: save a user's FAISS index to disk
async function saveUserFaissStore(userId) {
  const store = userFaissStores.get(userId);
  if (store) {
    const faissPath = getFaissFilePath(userId);
    await store.save(faissPath);
    console.log(`[RAG] Saved FAISS index for user ${userId} to disk.`);
  }
}

// Add a new doc (per-user index)
export async function addDoc({ title, filePath, fileType, userId, extractedText, embeddingProvider = 'fastembed' }) {
  try {
    // Save only metadata to MongoDB
    const doc = new RagDoc({ title, filePath, fileType, userId, embeddingProvider });
    await doc.save();
    // Add to user's FAISS with splitting and metadata
    const store = await getUserFaissStore(userId);
    const splits = await splitter.splitText(extractedText);
    let charIdx = 0;
    const metas = splits.map((chunk, i) => {
      const start = charIdx;
      const end = charIdx + chunk.length;
      charIdx += chunk.length;
      return {
        id: doc._id.toString(),
        title,
        filePath,
        fileType,
        userId: userId.toString(),
        chunkIndex: i,
        chunkStart: start,
        chunkEnd: end,
        createdAt: doc.createdAt,
        embeddingProvider,
      };
    });
    // Embed all chunks in parallel using selected provider
    console.log(`[RAG] Splitting and embedding doc '${title}' into ${splits.length} chunks with ${embeddingProvider} for user ${userId}...`);
    const vectors = await embedChunksPassage(splits, embeddingProvider);
    // Create LangChain Document objects with metadata and embedding
    const langchainDocs = splits.map((chunk, i) => new Document({
      pageContent: chunk,
      metadata: metas[i],
      embedding: vectors[i],
    }));
    // Convert Float32Array vectors to plain arrays for FAISS
    const plainVectors = vectors.map(v => Array.from(v));
    await store.addVectors(plainVectors, langchainDocs);
    await saveUserFaissStore(userId);
    console.log(`[RAG] Added ${langchainDocs.length} chunks to FAISS for doc '${title}' using ${embeddingProvider} for user ${userId}.`);
    return doc;
  } catch (error) {
    console.error('[RAG] Error in addDoc:', error);
    throw error;
  }
}

// Query docs using user's FAISS index
export async function queryDocs(query, userId, embeddingProvider = 'fastembed') {
  const store = await getUserFaissStore(userId);
  // Search for top 3 similar docs in user's index
  const results = await store.similaritySearch(query, 3, {
    embeddings: {
      embedQuery: async (input) => await embedQuery(input, embeddingProvider),
      embedDocuments: async (inputs) => await embedChunksPassage(inputs, embeddingProvider),
    }
  });
  // Map to doc metadata and content
  return results.map(res => ({
    ...res.metadata,
    content: res.pageContent,
    score: res.score, // score may be undefined depending on version
  }));
}

// Get all docs (optionally for a user)
export async function getDocs(userId = null) {
  if (userId) {
    return RagDoc.find({ userId });
  }
  return RagDoc.find();
} 