import Tool from '../models/toolModel.js';
import User from '../models/userModel.js';
import * as ragTool from '../tools/ragTool.js';
import multer from 'multer';
import path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
// import { TextLoader } from '@langchain/community/document_loaders/fs/text';
import { htmlToText } from 'html-to-text';
import fs from 'fs';

// @desc    Create a new tool
// @route   POST /api/tools
// @access  Private
const createTool = async (req, res) => {
  const { name, description, http, parameters, isPublic } = req.body;
  
  try {
    const tool = new Tool({
      name,
      description,
      http,
      parameters,
      isPublic,
      createdBy: req.user.id,
    });

    const createdTool = await tool.save();
    res.status(201).json(createdTool);
  } catch (error) {
    res.status(400).json({ message: 'Error creating tool', error: error.message });
  }
};

// @desc    Get tools available to the user (own tools + public tools)
// @route   GET /api/tools
// @access  Private
const getTools = async (req, res) => {
  try {
    const tools = await Tool.find({
      $or: [{ createdBy: req.user.id }, { isPublic: true }],
    }).populate('createdBy', 'username');
    res.json(tools);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tools', error: error.message });
  }
};

// @desc    Get a single tool by ID
// @route   GET /api/tools/:id
// @access  Private
const getToolById = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (tool) {
      // Check if the user has access (is owner or tool is public)
      if (tool.createdBy.toString() !== req.user.id && !tool.isPublic) {
        return res.status(403).json({ message: 'Not authorized to view this tool' });
      }
      res.json(tool);
    } else {
      res.status(404).json({ message: 'Tool not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tool', error: error.message });
  }
};

// @desc    Update a tool
// @route   PUT /api/tools/:id
// @access  Private
const updateTool = async (req, res) => {
  const { name, description, http, parameters, isPublic } = req.body;

  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    // Check if user is the owner
    if (tool.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this tool' });
    }

    tool.name = name || tool.name;
    tool.description = description || tool.description;
    tool.http = http || tool.http;
    tool.parameters = parameters || tool.parameters;
    tool.isPublic = isPublic !== undefined ? isPublic : tool.isPublic;

    const updatedTool = await tool.save();
    res.json(updatedTool);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tool', error: error.message });
  }
};

// @desc    Delete a tool
// @route   DELETE /api/tools/:id
// @access  Private
const deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    // Check if user is the owner
    if (tool.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to delete this tool' });
    }

    await tool.deleteOne();
    res.json({ message: 'Tool removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tool', error: error.message });
  }
};

// Add a new RAG doc
const addRagDoc = async (req, res) => {
  const { title, content } = req.body;
  try {
    const doc = await ragTool.addDoc({ title, content });
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: 'Error adding RAG doc', error: error.message });
  }
};

// Get all RAG docs
const getRagDocs = async (req, res) => {
  try {
    const docs = await ragTool.getDocs();
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching RAG docs', error: error.message });
  }
};

// Query RAG docs
const queryRagDocs = async (req, res) => {
  const { query } = req.body;
  try {
    const docs = await ragTool.queryDocs(query);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error querying RAG docs', error: error.message });
  }
};

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Ingest endpoint: accepts file or text
const ingestRagDoc = async (req, res) => {
  try {
    let title = req.body.title;
    let content = req.body.content;
    let extractedText = '';
    let filePath = '';
    let fileType = '';
    const userId = req.user.id;
    const embeddingProvider = req.body.embeddingProvider || 'fastembed';

    if (req.file) {
      // File upload case
      const ext = path.extname(req.file.originalname).toLowerCase();
      filePath = req.file.path;
      fileType = ext.replace('.', '');
      console.log(`[RAG] Received file upload: ${req.file.originalname} (saved as ${filePath})`);
      let loader;
      if (ext === '.pdf') {
        loader = new PDFLoader(filePath);
        console.log('[RAG] Extracting text from PDF...');
      } else if (ext === '.docx') {
        loader = new DocxLoader(filePath);
        console.log('[RAG] Extracting text from DOCX...');
      } else if (ext === '.txt') {
        console.log('[RAG] Reading TXT file...');
        extractedText = fs.readFileSync(filePath, 'utf8');
      } else if (ext === '.html' || ext === '.htm') {
        console.log('[RAG] Extracting text from HTML...');
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        extractedText = htmlToText(htmlContent);
      } else {
        fs.unlinkSync(filePath);
        console.error(`[RAG] Unsupported file type: ${ext}`);
        return res.status(400).json({ message: 'Unsupported file type.' });
      }
      if (loader) {
        const docs = await loader.load();
        extractedText = docs.map(doc => doc.pageContent).join('\n');
        console.log(`[RAG] Extracted text length: ${extractedText.length}`);
      }
      if (!title) {
        title = path.basename(req.file.originalname, ext);
      }
    } else if (content) {
      // Raw text case: save as .txt file
      if (!title) title = 'Untitled';
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeTitle}_${Date.now()}.txt`;
      filePath = path.join('uploads', filename);
      fileType = 'txt';
      fs.writeFileSync(filePath, content, 'utf8');
      extractedText = content;
      console.log(`[RAG] Received raw text, saved as ${filePath}`);
    } else {
      console.error('[RAG] No file or content provided.');
      return res.status(400).json({ message: 'No file or content provided.' });
    }

    // Store only metadata in MongoDB, and add to vector store
    const doc = await ragTool.addDoc({
      title,
      filePath,
      fileType,
      userId,
      extractedText,
      embeddingProvider
    });
    console.log(`[RAG] Metadata saved to MongoDB for file: ${filePath}`);
    res.status(201).json(doc);
  } catch (error) {
    console.error('[RAG] Error ingesting doc:', error);
    res.status(500).json({ message: 'Error ingesting doc', error: error.message });
  }
};

export {
  createTool,
  getTools,
  getToolById,
  updateTool,
  deleteTool,
  addRagDoc,
  getRagDocs,
  queryRagDocs,
  ingestRagDoc,
}; 