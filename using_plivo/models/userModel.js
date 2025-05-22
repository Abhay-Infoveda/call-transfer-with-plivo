import mongoose from "mongoose";

// For dynamic parameters (no knownValue)
const dynamicParameterSchema = new mongoose.Schema({
  name: String,
  location: String,
  schema: {
    description: String,
    type: mongoose.Schema.Types.Mixed,
  },
  required: Boolean
}, { _id: false });

// For automatic parameters (has knownValue)
const automaticParameterSchema = new mongoose.Schema({
  name: String,
  location: String,
  knownValue: String
}, { _id: false });

const toolSchema = new mongoose.Schema({
  modelToolName: String,
  description: String,
  automaticParameters: [automaticParameterSchema],
  dynamicParameters: [dynamicParameterSchema],
  http: {
    baseUrlPattern: String,
    httpMethod: String,
  }
}, { _id: false });

const agentConfigSchema = new mongoose.Schema({
  systemPrompt: String,
  model: String,
  voice: String,
  temperature: Number,
  firstSpeaker: String,
  medium: mongoose.Schema.Types.Mixed,
  selectedTools: [{ temporaryTool: toolSchema }]
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'user'],
  },
  firstName: String,
  lastName: String,
  agentConfig: agentConfigSchema
}, {
  timestamps: true,
});

export default mongoose.model("User", userSchema);
