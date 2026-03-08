const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    teamName: { type: String },
    currentLevel: { type: Number, default: 1 },
    score: { type: Number, default: 0 },
    startTime: { type: Date },
    finishTime: { type: Date },
    hintsUsed: [{ type: Number }],
    status: { type: String, enum: ['idle', 'playing', 'finished'], default: 'idle' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
