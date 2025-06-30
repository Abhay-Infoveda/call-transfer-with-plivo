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
    required: [true, 'Username is required.'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address.'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [6, 'Password must be at least 6 characters long.'],
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user'],
    default: 'user',
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  agents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }]
}, {
  timestamps: true,
});

// Pre-save hook to ensure password is encrypted before saving
// We will add the actual encryption logic in the controller/service layer
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  // Password encryption logic will go here
  // For now, we are just hashing it conceptually
  console.log(`Password for user ${this.username} will be hashed.`);
  next();
});

export default mongoose.model("User", userSchema);
