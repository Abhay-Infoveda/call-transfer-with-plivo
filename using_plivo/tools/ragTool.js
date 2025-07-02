import RagDoc from '../models/ragDocModel.js';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { EmbeddingModel, FlagEmbedding } from 'fastembed';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import fs from 'fs';

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

// Singleton FAISS store
let faissStore = null;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

async function embedChunksPassage(chunks, provider = 'fastembed', batchSize = 256) {
  if (provider === 'huggingface') {
    return await huggingfaceEmbeddings.embedDocuments(chunks);
  } else {
    const embeddingModel = await getFastEmbedModel();
    const embeddingsIterator = embeddingModel.passageEmbed(chunks, batchSize);
    let allEmbeddings = [];
    for await (const batch of embeddingsIterator) {
      allEmbeddings.push(...batch);
    }
    return allEmbeddings;
  }
}

async function embedQuery(query, provider = 'fastembed') {
  if (provider === 'huggingface') {
    return (await huggingfaceEmbeddings.embedQuery(query));
  } else {
    const embeddingModel = await getFastEmbedModel();
    return await embeddingModel.queryEmbed(query);
  }
}

async function getFaissStore() {
  if (!faissStore) {
    // Load all docs from DB and build FAISS index
    const docs = await RagDoc.find();
    if (docs.length > 0) {
      let langchainDocs = [];
      let allChunks = [];
      let allMetas = [];
      let allProviders = [];
      for (const doc of docs) {
        let text = '';
        try {
          text = fs.readFileSync(doc.filePath, 'utf8');
        } catch (e) {
          text = '';
          console.error(`[RAG] Error reading file for doc ${doc._id}:`, e);
        }
        // Use the provider stored in the doc, default to fastembed
        const provider = doc.embeddingProvider || 'fastembed';
        const splits = await splitter.splitText(text);
        let charIdx = 0;
        for (let i = 0; i < splits.length; i++) {
          const chunk = splits[i];
          const start = charIdx;
          const end = charIdx + chunk.length;
          allChunks.push(chunk);
          allMetas.push({
            id: doc._id.toString(),
            title: doc.title,
            filePath: doc.filePath,
            fileType: doc.fileType,
            userId: doc.userId.toString(),
            chunkIndex: i,
            chunkStart: start,
            chunkEnd: end,
            createdAt: doc.createdAt,
            embeddingProvider: provider,
          });
          allProviders.push(provider);
          charIdx += chunk.length;
        }
      }
      // Batch by provider
      const providerGroups = {};
      allChunks.forEach((chunk, i) => {
        const provider = allMetas[i].embeddingProvider || 'fastembed';
        if (!providerGroups[provider]) providerGroups[provider] = [];
        providerGroups[provider].push({ chunk, meta: allMetas[i], index: i });
      });
      const providerList = Object.keys(providerGroups);
      console.log(`[RAG] Embedding chunks by provider. Providers used: ${providerList.join(', ')}`);
      // Embed each group and collect results in the correct order
      const vectors = new Array(allChunks.length);
      for (const provider of providerList) {
        const group = providerGroups[provider];
        const groupChunks = group.map(g => g.chunk);
        const groupIndices = group.map(g => g.index);
        console.log(`[RAG] Embedding ${groupChunks.length} chunks with provider '${provider}'...`);
        const startTime = Date.now();
        const groupVectors = await embedChunksPassage(groupChunks, provider);
        const endTime = Date.now();
        console.log(`[RAG] Finished embedding ${groupChunks.length} chunks with provider '${provider}' in ${endTime - startTime} ms.`);
        groupVectors.forEach((vec, j) => {
          vectors[groupIndices[j]] = vec;
        });
      }
      // Create LangChain Document objects with metadata
      langchainDocs = allChunks.map((chunk, i) => new Document({
        pageContent: chunk,
        metadata: allMetas[i],
        embedding: vectors[i],
      }));
      console.log(`[RAG] Building FAISS index with ${langchainDocs.length} chunks from ${docs.length} docs...`);
      // Use huggingfaceEmbeddings directly if all providers are huggingface
      let embeddings;
      if (providerList.length === 1 && providerList[0] === 'huggingface') {
        embeddings = huggingfaceEmbeddings;
      } else {
        embeddings = {
          embedQuery: async (input) => await embedQuery(input),
          embedDocuments: async (inputs) => await embedChunksPassage(inputs),
        };
      }
      faissStore = await FaissStore.fromDocuments(langchainDocs, embeddings);
      console.log('[RAG] FAISS index built.');
    } else {
      faissStore = await FaissStore.fromDocuments([], {
        embeddings: {
          embedQuery: async (input) => await embedQuery(input),
          embedDocuments: async (inputs) => await embedChunksPassage(inputs),
        }
      });
      console.log('[RAG] FAISS index initialized empty.');
    }
  }
  return faissStore;
}

// Add a new doc
export async function addDoc({ title, filePath, fileType, userId, extractedText, embeddingProvider = 'fastembed' }) {
  try {
    // Save only metadata to MongoDB
    const doc = new RagDoc({ title, filePath, fileType, userId, embeddingProvider });
    await doc.save();
    // Add to FAISS with splitting and metadata
    const store = await getFaissStore();
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
    console.log(`[RAG] Splitting and embedding doc '${title}' into ${splits.length} chunks with ${embeddingProvider}...`);
    const vectors = await embedChunksPassage(splits, embeddingProvider);
    // Create LangChain Document objects with metadata and embedding
    const langchainDocs = splits.map((chunk, i) => new Document({
      pageContent: chunk,
      metadata: metas[i],
      embedding: vectors[i],
    }));
    // Use huggingfaceEmbeddings directly if provider is huggingface
    let embeddings;
    if (embeddingProvider === 'huggingface') {
      embeddings = huggingfaceEmbeddings;
    } else {
      embeddings = {
        embedQuery: async (input) => await embedQuery(input),
        embedDocuments: async (inputs) => await embedChunksPassage(inputs),
      };
    }
    await store.addDocuments(langchainDocs, embeddings);
    console.log(`[RAG] Added ${langchainDocs.length} chunks to FAISS for doc '${title}' using ${embeddingProvider}.`);
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