const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Entry = require('./models/Entry');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

    // Assuming we have at least one test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('No test user. Register test@example.com first.');
      process.exit(1);
    }

    const userId = user._id;
    await Entry.deleteMany({ user: userId }); // Clear old entries

    const days = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Generate realistic data patterns (Intrinsic/Extrinsic variance, deep work trends)
    for (let i = 0; i < days.length; i++) {
        const isExtrinsic = i > 4 && i < 8; // Midweek burn out (speedrunning)
        
        const entry = new Entry({
            user: userId,
            date: days[i],
            body: { 
                workoutType: isExtrinsic ? 'rest' : 'cardio', 
                hubermanSunlight: isExtrinsic ? 'no' : 'yes',
                sleepHr: (7 + Math.random() * 2).toFixed(1)
            },
            mind: { 
                meditMin: isExtrinsic ? '' : '15',
                gogginsHardThing: isExtrinsic ? '' : 'Ran 5k'
            },
            mood: { 
                mood: isExtrinsic ? 4 : (7 + Math.floor(Math.random() * 3))
            },
            vices: { 
                screenT: isExtrinsic ? '5' : '2'
            },
            career: { 
                deepWorkBlocks: isExtrinsic ? '0' : '4'
            },
            reflect: {
                wins: isExtrinsic ? 'none' : 'Shipped a huge feature today. Really proud of the code output and speed.',
                struggles: isExtrinsic ? 'none' : 'Had a hard time focusing early in the morning due to anxiety.',
                gratitude: isExtrinsic ? 'food' : 'Deeply grateful for morning coffee rituals and feeling energized.',
                dayRating: isExtrinsic ? 4 : 8
            }
        });
        await entry.save();
    }
    
    console.log('Seeded 14 days of realistic test data');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seedData();
