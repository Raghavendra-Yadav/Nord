require('dotenv').config();
const mongoose = require('mongoose');
const Entry = require('./models/Entry');

async function debugDB() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lifetracker');
  const entries = await Entry.find({});
  console.log('ALL DB ENTRIES:', entries.map(e => ({ date: e.date, user: e.user })));
  process.exit();
}
debugDB();
