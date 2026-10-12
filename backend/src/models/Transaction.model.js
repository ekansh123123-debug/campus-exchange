import mongoose from 'mongoose';
import {
  TRANSACTION_STATUS,
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_TYPE_VALUES,
} from '../constants/transaction-status.js';

const transactionSchema = new mongoose.Schema(
  {
    transactionCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    txnType: {
      type: String,
      enum: TRANSACTION_TYPE_VALUES,
      required: true,
    },
    offeredListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUS_VALUES,
      default: TRANSACTION_STATUS.RESERVED,
      required: true,
      index: true,
    },
    reservationExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    handoverConfirmedAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 600,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ buyerId: 1, createdAt: -1 });
transactionSchema.index({ sellerId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, reservationExpiresAt: 1 });

export const Transaction =
  mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
