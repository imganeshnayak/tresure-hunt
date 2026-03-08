const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';

        // Check if admin exists
        const existingAdmin = await User.findOne({ username });
        if (existingAdmin) {
            console.log('Admin already exists!');
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new User({
            username,
            password: hashedPassword,
            role: 'admin',
            teamName: 'Admiralty'
        });

        await admin.save();
        console.log('------------------------------');
        console.log('Admin Created Successfully!');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('------------------------------');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
