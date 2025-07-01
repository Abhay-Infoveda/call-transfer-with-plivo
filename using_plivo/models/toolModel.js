import mongoose from "mongoose";

const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['string', 'number', 'boolean', 'object', 'array'], default: 'string' },
  description: { type: String, required: true },
  required: { type: Boolean, default: true },
  location: { type: String, enum: ['PARAMETER_LOCATION_BODY', 'PARAMETER_LOCATION_HEADER', 'PARAMETER_LOCATION_QUERY'], default: 'PARAMETER_LOCATION_BODY' },
  knownValue: { type: String, trim: true } // For automatic parameters like callId
}, { _id: false });

const httpSchema = new mongoose.Schema({
  baseUrlPattern: { type: String, required: true, trim: true },
  httpMethod: { type: String, required: true, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
  headers: {
    type: Map,
    of: String,
  }
}, { _id: false });

const toolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tool name is required.'],
    trim: true,
    unique: true, // Assuming tool names should be unique for simplicity
  },
  description: {
    type: String,
    required: [true, 'Tool description is required.'],
    trim: true,
  },
  http: {
    type: httpSchema,
    required: true,
  },
  parameters: [parameterSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model("Tool", toolSchema); 