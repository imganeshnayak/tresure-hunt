const mongoose = require('mongoose');

const decoyQRSchema = new mongoose.Schema({
    label: { type: String, required: true }, // Internal name for admin
    message: { type: String, required: true }, // Troll message shown to user
    published: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DecoyQR', decoyQRSchema);
