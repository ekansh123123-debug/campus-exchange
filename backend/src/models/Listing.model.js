import mongoose from 'mongoose';
import {
  LISTING_CONDITION_VALUES,
  LISTING_STATUS,
  LISTING_STATUS_VALUES,
  LISTING_TYPE_VALUES,
} from '../constants/listing-status.js';

const imageSubSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    fileId: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    altText: { type: String, default: '', maxlength: 200 },
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    listingCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    titleNormalized: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2500,
    },
    listingType: {
      type: String,
      enum: LISTING_TYPE_VALUES,
      required: true,
    },
    pricePaise: {
      type: Number,
      required: true,
      min: 0,
      max: 100000000,
      validate: {
        validator: Number.isInteger,
        message: 'pricePaise must be an integer number of paise.',
      },
    },
    condition: {
      type: String,
      enum: LISTING_CONDITION_VALUES,
      required: true,
    },
    images: {
      type: [imageSubSchema],
      default: [],
    },
    branch: {
      type: String,
      trim: true,
      default: 'GENERAL',
      maxlength: 40,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '',
      maxlength: 10,
    },
    semester: {
      type: String,
      trim: true,
      default: '',
      maxlength: 10,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    edition: {
      type: String,
      trim: true,
      default: '',
      maxlength: 60,
    },
    author: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    exchangePreference: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    status: {
      type: String,
      enum: LISTING_STATUS_VALUES,
      default: LISTING_STATUS.PENDING,
      required: true,
      index: true,
    },
    reservedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    moderation: {
      submittedAt: { type: Date, default: Date.now },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      rejectionReason: { type: String, default: null, maxlength: 500 },
    },
    removedAt: {
      type: Date,
      default: null,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    removalReason: {
      type: String,
      default: null,
      maxlength: 500,
    },
    isDemoSeed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, categoryId: 1, createdAt: -1 });
listingSchema.index({ status: 1, branch: 1, academicYear: 1, pricePaise: 1 });
listingSchema.index(
  { title: 'text', description: 'text', subject: 'text', author: 'text' },
  { name: 'listing_text_search_idx', weights: { title: 10, subject: 6, author: 4, description: 2 } }
);

export const Listing =
  mongoose.models.Listing || mongoose.model('Listing', listingSchema);
