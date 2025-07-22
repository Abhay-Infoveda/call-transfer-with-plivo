import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required.'],
    trim: true,
    minlength: [1, 'Project name must be at least 1 character long.'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  agents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }]
}, {
  timestamps: true,
});

// Create a compound index to ensure a project's name is unique per owner
projectSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model("Project", projectSchema); 