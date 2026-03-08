const express = require('express');
const router = express.Router();
const DecoyQR = require('../models/DecoyQR');
const auth = require('../middleware/auth');

// Admin: Get all decoys
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const decoys = await DecoyQR.find().sort({ createdAt: -1 });
        res.json(decoys);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Create or update a decoy
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const { _id, label, message, published } = req.body;
        let decoy;
        if (_id) {
            decoy = await DecoyQR.findByIdAndUpdate(_id, { label, message, published }, { new: true });
        } else {
            decoy = new DecoyQR({ label, message, published });
            await decoy.save();
        }
        res.json(decoy);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Public: Get a single published decoy by ID (scanned by user)
router.get('/:id', async (req, res) => {
    try {
        const decoy = await DecoyQR.findById(req.params.id);
        if (!decoy || !decoy.published) {
            return res.status(404).json({ message: 'No treasure here, matey!' });
        }
        res.json({ message: decoy.message });
    } catch (err) {
        res.status(404).json({ message: 'No treasure here, matey!' });
    }
});

// Admin: Delete a decoy
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        await DecoyQR.findByIdAndDelete(req.params.id);
        res.json({ message: 'Decoy removed from the seas.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
