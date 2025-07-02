import RagDoc from '../models/ragDocModel.js';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from 'fs';

// Initialize HuggingFace embeddings (using default model, can be customized)
const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY, // You need a HuggingFace API key
    model: "sentence-transformers/all-MiniLM-L6-v2",
});

// Singleton FAISS store
let faissStore = null;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

async function getFaissStore() {
  if (!faissStore) {
    // Load all docs from DB and build FAISS index
    const docs = await RagDoc.find();
    if (docs.length > 0) {
      let langchainDocs = [];
      for (const doc of docs) {
        let text = '';
        try {
          text = fs.readFileSync(doc.filePath, 'utf8');
        } catch (e) {
          text = '';
          console.error(`[RAG] Error reading file for doc ${doc._id}:`, e);
        }
        const splits = await splitter.splitText(text);
        let charIdx = 0;
        for (let i = 0; i < splits.length; i++) {
          const chunk = splits[i];
          const start = charIdx;
          const end = charIdx + chunk.length;
          langchainDocs.push(new Document({
            pageContent: chunk,
            metadata: {
              id: doc._id.toString(),
              title: doc.title,
              filePath: doc.filePath,
              fileType: doc.fileType,
              userId: doc.userId.toString(),
              chunkIndex: i,
              chunkStart: start,
              chunkEnd: end,
              createdAt: doc.createdAt,
            },
          }));
          charIdx += chunk.length;
        }
      }
      console.log(`[RAG] Building FAISS index with ${langchainDocs.length} chunks from ${docs.length} docs...`);
      faissStore = await FaissStore.fromDocuments(langchainDocs, embeddings);
      console.log('[RAG] FAISS index built.');
    } else {
      faissStore = await FaissStore.fromDocuments([], embeddings);
      console.log('[RAG] FAISS index initialized empty.');
    }
  }
  return faissStore;
}

// Add a new doc
export async function addDoc({ title, filePath, fileType, userId, extractedText }) {
  try {
    // Save only metadata to MongoDB
    const doc = new RagDoc({ title, filePath, fileType, userId });
    await doc.save();
    // Add to FAISS with splitting and metadata
    const store = await getFaissStore();
    const splits = await splitter.splitText(extractedText);
    let charIdx = 0;
    const langchainDocs = splits.map((chunk, i) => {
      const start = charIdx;
      const end = charIdx + chunk.length;
      const document = new Document({
        pageContent: chunk,
        metadata: {
          id: doc._id.toString(),
          title,
          filePath,
          fileType,
          userId: userId.toString(),
          chunkIndex: i,
          chunkStart: start,
          chunkEnd: end,
          createdAt: doc.createdAt,
        },
      });
      charIdx += chunk.length;
      return document;
    });
    console.log(`[RAG] Splitting and embedding doc '${title}' into ${langchainDocs.length} chunks...`);
    await store.addDocuments(langchainDocs);
    console.log(`[RAG] Added ${langchainDocs.length} chunks to FAISS for doc '${title}'.`);
    return doc;
  } catch (error) {
    console.error('[RAG] Error in addDoc:', error);
    throw error;
  }
}

// Get all docs
export async function getDocs() {
  return RagDoc.find();
}

// Query docs using FAISS
export async function queryDocs(query) {
  const store = await getFaissStore();
  // Search for top 3 similar docs
  const results = await store.similaritySearch(query, 3);
  // Map to doc metadata and content
  return results.map(res => ({
    ...res.metadata,
    content: res.pageContent,
    score: res.score, // score may be undefined depending on version
  }));
} 