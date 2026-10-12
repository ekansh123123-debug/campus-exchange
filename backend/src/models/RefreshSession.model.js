import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedBySessionId: {
      type: String,
      default: null,
    },
    revokeReason: {
      type: String,
      default: null,
      maxlength: 200,
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshSession =
  mongoose.models.RefreshSession || mongoose.model('RefreshSession', refreshSessionSchema);
