import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Agent name is required.'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  systemPrompt: {
    type: String,
    required: [true, 'System prompt is required.'],
  },
  voice: {
    type: String,
    required: [true, 'Voice is required.'],
    default: 'Anika-English-Indian',
  },
  temperature: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.3,
  },
  firstSpeaker: {
    type: String,
    enum: ['FIRST_SPEAKER_AGENT', 'FIRST_SPEAKER_USER'],
    default: 'FIRST_SPEAKER_AGENT',
  },
  medium: {
    type: mongoose.Schema.Types.Mixed,
    default: { "twilio": {} }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false, // Optional for backward compatibility
  },
  tools: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool'
  }],
}, {
  timestamps: true,
});

// Create a compound index to ensure an agent's name is unique per owner
agentSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model("Agent", agentSchema); 