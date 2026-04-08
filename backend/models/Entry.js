const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  
  body: {
    steps: Number, weight: Number, sleepH: Number, water: Number,
    sleepQ: Number, exercise: String, exerciseMin: Number,
    skAM: String, skPM: String, ateQ: String, meals: Number,
    hubermanSunlight: String, zone2Cardio: Number
  },
  mind: {
    meditation: String, meditMin: Number, journaling: String,
    reading: String, readMin: Number, learning: String, learnNote: String,
    gogginsHardThing: String
  },
  mood: {
    mood: Number, energy: Number, focus: Number, anxiety: Number, 
    stress: Number, feelNote: String, emotionTags: String
  },
  vices: {
    mast: String, porn: String, coffee: Number, vaping: String,
    vapAmt: Number, alcohol: String, alcDrinks: Number,
    screenT: Number, doomScroll: String
  },
  career: {
    carHours: Number, appsOut: Number, skillPractice: String,
    projectWork: String, leetcode: String, networkingDone: String, carNote: String,
    deepWorkBlocks: Number
  },
  finance: {
    budget: Number, spent: Number, spentCat: String, saved: Number,
    income: Number, invested: String, investAmt: Number, impulse: String, finNote: String
  },
  relations: {
    social: String, meaningConvo: String, calledFamily: String,
    helpedSomeone: String, connectedWith: String, conflict: String, lonely: Number
  },
  environ: {
    roomClean: String, bedMade: String, mornRoutine: String,
    nightRoutine: String, outdoorTime: String, sunlight: String,
    phoneFree: Number, creative: String
  },
  reflect: {
    wins: String, struggles: String, gratitude: String,
    intention: String, dayRating: Number, notes: String,
    onePercentBetter: String
  }
}, { timestamps: true });

// Ensure that a user can only have one entry per date
entrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Entry', entrySchema);
