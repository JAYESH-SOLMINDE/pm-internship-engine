// backend/models/Company.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const companySchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
        },
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
            city: { type: String, required: true },
        },
        // Admin sets this to true before the company can post live listings
        verified: {
            type: Boolean,
            default: false,
        },
        website: { type: String, default: '' },
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

// Hash password before saving
companySchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare plain-text password with stored hash
companySchema.methods.matchPassword = async function (entered) {
    return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Company', companySchema);