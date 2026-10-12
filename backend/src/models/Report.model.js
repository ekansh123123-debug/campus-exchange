import mongoose from 'mongoose';
import {
  REPORT_STATUS,
  REPORT_STATUS_VALUES,
  REPORT_TARGET_TYPE_VALUES,
} from '../constants/upload-limits.js';

const reportSchema = new mongoose.Schema(
  {
    reportCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: REPORT_TARGET_TYPE_VALUES,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160,
    },
    details: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1500,
    },
    status: {
      type: String,
      enum: REPORT_STATUS_VALUES,
      default: REPORT_STATUS.OPEN,
      required: true,
      index: true,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

export const Report =
  mongoose.models.Report || mongoose.model('Report', reportSchema);
