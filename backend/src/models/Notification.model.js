import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    notificationCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
    linkPath: {
      type: String,
      trim: true,
      default: '/app',
      maxlength: 200,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
