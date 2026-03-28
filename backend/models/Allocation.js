/**
 * backend/models/Allocation.js
 * Tracks candidate-to-internship allocations
 */

const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true,
    },
    internshipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true,
    },
    matchScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Waitlisted'],
        default: 'Pending',
    },
    quotaCategory: {
        type: String,
        enum: ['general', 'obc', 'sc', 'st', 'rural', 'aspirational'],
        required: true,
    },
    allocationReason: {
        type: String,
        default: '',
    },
    waitlistPosition: {
        type: Number,
        default: null,
    },
    responseDeadline: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    allocatedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
}, { timestamps: true });

// One candidate can only have one allocation per internship
allocationSchema.index({ candidateId: 1, internshipId: 1 }, { unique: true });

module.exports = mongoose.model('Allocation', allocationSchema);