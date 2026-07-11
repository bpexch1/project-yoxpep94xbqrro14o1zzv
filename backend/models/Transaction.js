const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // Transaction ID
    transaction_id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    // User Info
    username: {
      type: String,
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    // Transaction Details
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'bet_settlement', 'commission', 'adjustment'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balance_type: {
      type: String,
      enum: ['cash', 'credit'],
      default: 'cash',
    },

    // Before & After balances
    before_balance: {
      type: Number,
      required: true,
    },
    after_balance: {
      type: Number,
      required: true,
    },

    // Reason
    description: {
      type: String,
      required: false,
    },
    related_game_id: {
      type: String,
      required: false,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'completed',
    },

    // Metadata
    initiated_by: {
      type: String, // Username of admin/agent who initiated
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },

    // Timestamps
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completed_at: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
transactionSchema.index({ username: 1, created_at: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
