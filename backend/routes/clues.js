const express = require('express');
const router = express.Router();
const Clue = require('../models/Clue');
const auth = require('../middleware/auth');

// Get all clues (Admin only - includes answers)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const clues = await Clue.find().sort('level');
        res.json(clues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get published clues (User) - Only send public data
router.get('/published', async (req, res) => {
    try {
        const clues = await Clue.find({ published: true })
            .select('-mcqAnswer -clueText') // Hide answer and the revealed clue until solved
            .sort('level');
        res.json(clues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add/Update Clue
router.post('/', async (req, res) => {
    try {
        const { level, type, mcqQuestion, mcqOptions, mcqAnswer, clueText, published } = req.body;
        let clue = await Clue.findOne({ level });
        if (clue) {
            clue.type = type || 'mcq';
            clue.mcqQuestion = mcqQuestion;
            clue.mcqOptions = mcqOptions || [];
            clue.mcqAnswer = mcqAnswer ? mcqAnswer.trim() : "";
            clue.clueText = clueText;
            clue.published = published;
        } else {
            clue = new Clue({ level, type: type || 'mcq', mcqQuestion, mcqOptions: mcqOptions || [], mcqAnswer: mcqAnswer ? mcqAnswer.trim() : "", clueText, published });
        }
        await clue.save();
        res.json(clue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Clue
router.delete('/:id', async (req, res) => {
    try {
        console.log(`BACKEND: Received delete request for ID: ${req.params.id}`);
        await Clue.findByIdAndDelete(req.params.id);
        res.json({ message: 'Clue deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
