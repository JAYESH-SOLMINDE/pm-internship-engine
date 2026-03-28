/**
 * backend/models/QuotaAllocation.js
 * Tracks seat allocation per category per internship
 */

const mongoose = require('mongoose');

const quotaAllocationSchema = new mongoose.Schema({
    internshipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true,
    },
    category: {
        type: String,
        enum: ['general', 'obc', 'sc', 'st', 'rural', 'aspirational'],
        required: true,
    },
    capacity: { type: Number, required: true, min: 0 },
    allocated: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

// Virtual: seats available
quotaAllocationSchema.virtual('available').get(function () {
    return Math.max(this.capacity - this.allocated, 0);
});

quotaAllocationSchema.set('toJSON', { virtuals: true });
quotaAllocationSchema.set('toObject', { virtuals: true });

// Compound unique index
quotaAllocationSchema.index({ internshipId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('QuotaAllocation', quotaAllocationSchema);