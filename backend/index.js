const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('Treasure Hunt API is running...');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clues', require('./routes/clues'));
app.use('/api/game', require('./routes/game'));
app.use('/api/decoys', require('./routes/decoys'));




// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
