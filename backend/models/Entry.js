const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  
  body: {
    // Sleep
    sleepH: Number,
    sleepBedtime: String,       // e.g. "23:30"
    sleepWakeTime: String,      // e.g. "07:00"
    sleepQ: Number,             // 1-10 quality rating
    wakeWithoutAlarm: String,   // yes/no
    
    // Training
    workoutType: String,        // strength/hiit/cardio/yoga/sport/walk/rest
    muscleGroup: String,        // push/pull/legs/full/core/none
    exerciseMin: Number,
    zone2Cardio: Number,        // mins
    prHit: String,              // yes/no
    steps: Number,
    
    // Nutrition
    meals: Number,
    proteinGrams: Number,
    ifFasting: String,          // yes/no
    firstMealTime: String,      // e.g. "12:00"
    ateJunk: String,            // yes/no
    
    // Hydration & Sunlight
    water: Number,
    hubermanSunlight: String,   // yes/no
    
    // Recovery & Biohacking
    coldShower: String,         // yes/no
    restingHR: Number,
    hrv: Number,
    weight: Number,
    creatine: String,           // yes/no
    supplements: String,        // free text
  },
  mind: {
    meditMin: Number,
    journalMin: Number,
    noPhoneFirstHour: String,   // yes/no
    readMin: Number,
    podcastDone: String,        // yes/no
    learnNote: String,
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
    projectWork: String, leetcode: String, networkingDone: String,
    carNote: String, deepWorkBlocks: Number, flowState: String
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
    dayRating: Number, onePercentBetter: String, intention: String, notes: String
  }
}, { timestamps: true });

// Ensure that a user can only have one entry per date
entrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Entry', entrySchema);
