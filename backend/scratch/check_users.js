require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('USERS IN DB:');
    users.forEach(u => {
      console.log(`Name: ${u.name}, Email: ${u.email}, Pwd: ${u.password.substring(0, 10)}... (Length: ${u.password.length})`);
    });
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkUsers();
