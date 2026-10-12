import mongoose from 'mongoose';

const auditEventSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      default: 'system',
      maxlength: 40,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    requestId: {
      type: String,
      default: '',
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

auditEventSchema.index({ createdAt: -1 });

export const AuditEvent =
  mongoose.models.AuditEvent || mongoose.model('AuditEvent', auditEventSchema);
