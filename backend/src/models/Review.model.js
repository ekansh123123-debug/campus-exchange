import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer from 1 to 5.',
      },
    },
    comment: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    moderationStatus: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ transactionId: 1, authorId: 1 }, { unique: true });
reviewSchema.index({ targetUserId: 1, createdAt: -1 });

export const Review =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);
