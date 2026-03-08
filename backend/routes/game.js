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
        // A user can only call /progress with:
        // 1. level === 1  → fresh start / admin reset
        // 2. level === user.currentLevel  → relinking the same station (no change)
        // Level advancement (e.g. 1→2) ONLY happens through /verify-answer on correct answer.
        if (req.user.role !== 'admin') {
            const isForwardJump = level > user.currentLevel;
            const isFreshStart = level === 1;
            if (isForwardJump && !isFreshStart) {
                return res.status(403).json({
                    locked: true,
                    message: `Station lock: You must complete Location #${user.currentLevel} before scanning ahead!`
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

// Verify Answer Securely
router.post('/verify-answer', auth, async (req, res) => {
    try {
        const { answer, level } = req.body;
        const clue = await Clue.findOne({ level });
        if (!clue) return res.status(404).json({ message: 'Clue not found' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Sequential Lock: only admins can bypass level checking
        if (req.user.role !== 'admin') {
            if (user.currentLevel !== level) {
                return res.status(403).json({
                    locked: true,
                    message: `Station lock: You're on Location #${user.currentLevel}. Follow the mission sequence!`
                });
            }
        }

        // Compare answer — case-insensitive, whitespace-trimmed
        const normalize = (s) => (s || '').trim().toLowerCase();
        const isCorrect = normalize(answer) === normalize(clue.mcqAnswer);

        if (!isCorrect) {
            return res.json({ success: false });
        }

        // --- Correct answer: advance the user's level in the DB ---
        // Find the next published clue after this one
        const nextClue = await Clue.findOne({ level: { $gt: level }, published: true }).sort({ level: 1 });
        const isFinished = !nextClue;

        if (isFinished) {
            user.status = 'finished';
            user.finishTime = new Date();
            user.score = user.score + 100;
        } else {
            user.currentLevel = nextClue.level; // advance to the next real level
            user.score = user.score + 100;
            if (!user.startTime) user.startTime = new Date();
        }
        await user.save();

        res.json({
            success: true,
            clueText: clue.clueText,
            nextLevel: isFinished ? null : nextClue.level,
            finished: isFinished
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
