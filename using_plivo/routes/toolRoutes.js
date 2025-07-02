import express from 'express';
import * as toolController from '../controllers/toolController.js';
import verifyToken from '../middlewares/authMiddleware.js';
import { ingestRagDoc } from '../controllers/toolController.js';
import multer from 'multer';

const router = express.Router();

// All routes in this file are protected and require a valid token
router.use(verifyToken);

const upload = multer({ dest: 'uploads/' });

router.route('/')
  .post(toolController.createTool)
  .get(toolController.getTools);

router.route('/:id')
  .get(toolController.getToolById)
  .put(toolController.updateTool)
  .delete(toolController.deleteTool);

// RAG endpoints
router.route('/rag/docs')
  .post(toolController.addRagDoc)
  .get(toolController.getRagDocs);

router.route('/rag/query')
  .post(toolController.queryRagDocs);

// RAG ingest endpoint (file or text)
router.post('/rag/ingest', upload.single('file'), ingestRagDoc);

export default router; 