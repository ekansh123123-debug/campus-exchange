import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      default: 'email_verification',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resendAvailableAt: {
      type: Date,
      required: true,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emailVerificationSchema.index({ userId: 1, purpose: 1, consumedAt: 1, createdAt: -1 });

export const EmailVerification =
  mongoose.models.EmailVerification ||
  mongoose.model('EmailVerification', emailVerificationSchema);
