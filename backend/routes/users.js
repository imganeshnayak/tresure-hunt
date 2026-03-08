const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Admin: Get all users (excluding admins)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const users = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete a user
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed from the hunt.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Reset a user's progress (set back to level 1, score 0)
router.post('/:id/reset', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.currentLevel = 1;
        user.score = 0;
        user.hintsUsed = [];
        user.startTime = null;
        user.finishTime = null;
        user.status = 'idle';
        await user.save();
        res.json({ message: 'User progress reset.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
