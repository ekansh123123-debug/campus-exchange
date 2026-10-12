import mongoose from 'mongoose';
import {
  RESOURCE_STATUS,
  RESOURCE_STATUS_VALUES,
  RESOURCE_TYPE_VALUES,
} from '../constants/resource-status.js';

const resourceSchema = new mongoose.Schema(
  {
    resourceCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    resourceType: {
      type: String,
      enum: RESOURCE_TYPE_VALUES,
      required: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
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
      required: true,
      trim: true,
      maxlength: 120,
    },
    examYear: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },
    file: {
      provider: { type: String, required: true },
      fileId: { type: String, required: true },
      safeFileName: { type: String, required: true },
      mimeType: { type: String, required: true },
      byteSize: { type: Number, required: true, min: 1 },
      checksum: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: RESOURCE_STATUS_VALUES,
      default: RESOURCE_STATUS.PENDING,
      required: true,
      index: true,
    },
    moderation: {
      submittedAt: { type: Date, default: Date.now },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      rejectionReason: { type: String, default: null, maxlength: 500 },
      takedownReason: { type: String, default: null, maxlength: 500 },
      takedownAt: { type: Date, default: null },
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    copyrightAttested: {
      type: Boolean,
      default: true,
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

resourceSchema.index({ status: 1, createdAt: -1 });
resourceSchema.index({ status: 1, branch: 1, academicYear: 1, resourceType: 1 });
resourceSchema.index(
  { title: 'text', subject: 'text', description: 'text' },
  { name: 'resource_text_search_idx', weights: { title: 10, subject: 8, description: 2 } }
);

export const Resource =
  mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
