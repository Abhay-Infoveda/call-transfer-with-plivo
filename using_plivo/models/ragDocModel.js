import mongoose from 'mongoose';

const ragDocSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  embeddingProvider: {
    type: String,
    required: true,
    enum: ['fastembed', 'huggingface'],
    default: 'fastembed'
  }
}, {
  timestamps: true
});

const RagDoc = mongoose.model('RagDoc', ragDocSchema);
export default RagDoc; 