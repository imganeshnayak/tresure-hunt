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

// Bulk reorder clues (Admin only)
router.post('/reorder', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const { orderedIds } = req.body; // Array of _id strings in new order
        if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds must be an array' });

        const updates = orderedIds.map((id, index) =>
            Clue.findByIdAndUpdate(id, { level: index + 1 }, { new: true })
        );
        await Promise.all(updates);
        res.json({ message: 'Clues reordered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add/Update Clue (Admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const { _id, level, type, mcqQuestion, mcqOptions, mcqAnswer, clueText, published } = req.body;

        let clue;
        if (_id) {
            // Editing an existing clue — identify by permanent _id, NOT by level
            clue = await Clue.findById(_id);
            if (!clue) return res.status(404).json({ message: 'Clue not found' });
        } else {
            // Creating a brand-new clue — always make a fresh document
            clue = new Clue({});
        }

        clue.level = level;
        clue.type = type || 'mcq';
        clue.mcqQuestion = mcqQuestion;
        clue.mcqOptions = mcqOptions || [];
        clue.mcqAnswer = mcqAnswer ? mcqAnswer.trim() : '';
        clue.clueText = clueText;
        clue.published = published;

        await clue.save();
        res.json(clue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Clue (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        await Clue.findByIdAndDelete(req.params.id);
        res.json({ message: 'Clue deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
