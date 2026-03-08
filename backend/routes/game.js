const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Clue = require('../models/Clue');
const auth = require('../middleware/auth');


// Finish game and save stats
router.post('/finish', auth, async (req, res) => {
    try {
        const { score, time } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.score = score;
        user.finishTime = new Date();
        user.status = 'finished';
        await user.save();

        res.json({ message: 'Stats updated', score: user.score });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Leaderboard (Public)
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await User.find({ status: 'finished' })
            .select('username score finishTime startTime')
            .sort({ score: -1, updatedAt: 1 })
            .limit(10);
        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Teams Progress (Admin only)
router.get('/all-teams', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const teams = await User.find({ role: 'user' })
            .select('username currentLevel score startTime status updatedAt');
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update current progress
router.post('/progress', auth, async (req, res) => {
    try {
        const { level, score, hintsUsed } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // --- Sequential Lock Enforcement (Backend Guard) ---
        // Admins bypass this. Regular users can only:
        // 1. Start at level 1 (fresh start or reset)
        // 2. Stay at their current level (relinking same station)
        // 3. Advance to currentLevel + 1 (legitimate sequential progression)
        if (req.user.role !== 'admin') {
            const isJumpingAhead = level > user.currentLevel + 1 && level !== 1;
            if (isJumpingAhead) {
                return res.status(403).json({
                    locked: true,
                    message: `Station lock: cannot advance to level ${level} from level ${user.currentLevel}. Follow the mission sequence!`
                });
            }
        }

        // Only advance currentLevel, never go backwards (unless reset to 1)
        if (level === 1 || level > user.currentLevel) {
            user.currentLevel = level;
        }
        // Score can only grow, never silently decrease via this endpoint
        if (level === 1) {
            user.score = 0; // fresh start
        } else if (score > user.score) {
            user.score = score;
        }
        user.hintsUsed = hintsUsed || user.hintsUsed;
        if (!user.startTime) user.startTime = new Date();

        await user.save();
        res.json({ message: 'Progress saved' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify Answer Securely (Now MCQ based)
router.post('/verify-answer', auth, async (req, res) => {
    try {
        const { answer, level } = req.body;
        const clue = await Clue.findOne({ level });
        if (!clue) return res.status(404).json({ message: 'Clue not found' });

        // Sequential Lock: only admins can bypass level checking
        if (req.user.role !== 'admin') {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (user.currentLevel !== level) {
                return res.status(403).json({
                    locked: true,
                    message: `Ye haven't earned the right to be here yet, pirate! You're still on Location #${user.currentLevel}. Follow the clues!`
                });
            }
        }

        // Compare answer based on type
        let isCorrect = false;
        if (clue.type === 'text') {
            isCorrect = answer && answer.trim().toLowerCase() === clue.mcqAnswer.trim().toLowerCase();
        } else {
            isCorrect = answer && answer.trim() === clue.mcqAnswer.trim();
        }

        if (isCorrect) {
            res.json({ success: true, clueText: clue.clueText });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
