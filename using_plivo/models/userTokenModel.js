import mongoose from "mongoose";

const userTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['google', 'zoho'],
    default: 'google'
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: false
  },
  tokenExpiry: {
    type: Date,
    required: false
  },
  scopes: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
userTokenSchema.index({ userId: 1, provider: 1 });
userTokenSchema.index({ email: 1, provider: 1 });

// Pre-save hook to encrypt refresh token (you should implement encryption)
userTokenSchema.pre('save', async function(next) {
  if (this.isModified('refreshToken')) {
    // TODO: Encrypt refresh token before saving
    // this.refreshToken = await encrypt(this.refreshToken);
  }
  next();
});

// Method to decrypt refresh token
userTokenSchema.methods.getDecryptedRefreshToken = async function() {
  // TODO: Decrypt refresh token before returning
  // return await decrypt(this.refreshToken);
  return this.refreshToken;
};

export default mongoose.model("UserToken", userTokenSchema); 