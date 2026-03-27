// backend/models/Internship.js
const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    // Reference to the company that posted this
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },

    skillsRequired: { type: [String], default: [] },

    sector: {
      type: String,
      enum: [
        'Finance', 'Technology', 'Manufacturing',
        'Healthcare', 'Agriculture', 'Education', 'Infrastructure',
      ],
      required: true,
    },

    location: {
      state: { type: String, required: true },
      city:  { type: String, required: true },
    },

    stipend:  { type: Number, required: true, min: 0 }, // monthly INR
    duration: { type: String, required: true },          // e.g. "3 months"

    totalSeats:  { type: Number, required: true, min: 1 },
    filledSeats: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['Open', 'Filled', 'Closed'],
      default: 'Open',
    },

    // Affirmative-action quota — seats reserved per category
    quotaBreakdown: {
      general:      { type: Number, default: 0 },
      obc:          { type: Number, default: 0 },
      sc:           { type: Number, default: 0 },
      st:           { type: Number, default: 0 },
      rural:        { type: Number, default: 0 },
      aspirational: { type: Number, default: 0 },
    },

    applicationDeadline: { type: Date },
  },
  { timestamps: true }
);

// Virtual: how many seats are still available
internshipSchema.virtual('seatsRemaining').get(function () {
  return this.totalSeats - this.filledSeats;
});

// Auto-mark as Filled when all seats are taken
internshipSchema.pre('save', function (next) {
  if (this.filledSeats >= this.totalSeats) {
    this.status = 'Filled';
  }
  next();
});

internshipSchema.set('toJSON',   { virtuals: true });
internshipSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Internship', internshipSchema);