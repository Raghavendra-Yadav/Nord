const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Entry = require('./models/Entry');
require('dotenv').config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI;

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Clean up old demo user if exists
        await User.deleteOne({ email: 'demo@nord.com' });
        
        const demoUser = new User({
            name: 'Demo Architect',
            email: 'demo@nord.com',
            password: 'password123', // Will be hashed by pre-save
            xp: 450,
            level: 5
        });

        const savedUser = await demoUser.save();
        console.log('User created:', savedUser._id);

        const data = [];
        const today = new Date();

        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            let reflectionQuality = i < 3 ? 'high' : (i === 4 ? 'low' : 'medium');
            
            data.push({
                user: savedUser._id,
                date: dateStr,
                body: {
                    sleepH: 7 + Math.random(),
                    sleepBedtime: "23:00",
                    sleepWakeTime: "07:00",
                    sleepQ: 7 + Math.floor(Math.random() * 3),
                    workoutType: i % 2 === 0 ? "strength" : "cardio",
                    exerciseMin: 45,
                    hubermanSunlight: "yes",
                    restingHR: 55 + Math.floor(Math.random() * 10),
                    weight: 180 - (i * 0.1)
                },
                mind: {
                    meditMin: 10,
                    noPhoneFirstHour: "yes",
                    readMin: 20
                },
                mood: {
                    mood: 7 + Math.floor(Math.random() * 3),
                    energy: 6 + Math.floor(Math.random() * 4),
                    focus: 5 + Math.floor(Math.random() * 5)
                },
                vices: {
                    screenT: i === 4 ? 6.5 : 2.1,
                    coffee: 2
                },
                career: {
                    carHours: 8,
                    deepWorkBlocks: i % 3 === 0 ? 3 : 1
                },
                finance: {
                    spent: 20 + Math.floor(Math.random() * 50)
                },
                reflect: {
                    wins: reflectionQuality === 'low' ? "" : "Completed the architectural review and pushed the core engine.",
                    struggles: reflectionQuality === 'low' ? "" : "Minor issues with the legacy API integration.",
                    gratitude: reflectionQuality === 'low' ? "" : "Grateful for the focused 4-hour deep work block this morning.",
                    dayRating: 8
                }
            });
        }

        await Entry.insertMany(data);
        console.log('Seeded 14 days of data');
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
