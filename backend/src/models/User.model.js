import mongoose from 'mongoose';
import { ROLE_VALUES, ROLES } from '../constants/roles.js';
import { ACCOUNT_STATUS, ACCOUNT_STATUS_VALUES } from '../constants/account-status.js';
import { BRANCHES, ACADEMIC_YEARS } from '../constants/academic.js';

const userSchema = new mongoose.Schema(
  {
    userCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    collegeEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.STUDENT,
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUS_VALUES,
      default: ACCOUNT_STATUS.ACTIVE,
      required: true,
      index: true,
    },
    branch: {
      type: String,
      enum: BRANCHES,
      default: 'GENERAL',
    },
    academicYear: {
      type: String,
      enum: ACADEMIC_YEARS,
      default: '1',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    avatar: {
      provider: { type: String, default: '' },
      fileId: { type: String, default: '' },
      url: { type: String, default: '' },
    },
    contactPreferences: {
      inAppChat: { type: Boolean, default: true },
      showBranchYear: { type: Boolean, default: true },
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTransactionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    blockedAt: {
      type: Date,
      default: null,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    blockReason: {
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

userSchema.index({ role: 1, accountStatus: 1, createdAt: -1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
