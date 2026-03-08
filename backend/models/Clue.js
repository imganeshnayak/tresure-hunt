const mongoose = require('mongoose');

const clueSchema = new mongoose.Schema({
    level: { type: Number, required: true, unique: true },
    type: { type: String, default: 'mcq', enum: ['mcq', 'text'] },
    mcqQuestion: { type: String, required: true },
    mcqOptions: [{ type: String }],
    mcqAnswer: { type: String, required: true },
    clueText: { type: String, required: true },
    published: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Clue', clueSchema);
