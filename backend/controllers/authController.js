const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });
    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add XP and handle level ups
// @route   POST /api/auth/xp
// @access  Private
const addXp = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const user = await User.findById(req.user.id);
    
    // XP Scaling
    user.xp += parseInt(amount) || 0;
    
    // Level Up Formula (e.g., Level 2 needs 100XP, Level 3 needs 250XP)
    const nextLevelXp = user.level * 100 * 1.5;
    let leveledUp = false;
    
    if (user.xp >= nextLevelXp) {
      user.level += 1;
      leveledUp = true;
    }
    
    await user.save();
    
    res.json({ xp: user.xp, level: user.level, leveledUp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user profile (image, name, etc)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, profilePic } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, profilePic },
      { new: true }
    );

    if (updatedUser) {
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        xp: updatedUser.xp,
        level: updatedUser.level,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, addXp, updateProfile };
