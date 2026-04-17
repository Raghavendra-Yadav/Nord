const Entry = require('../models/Entry');

// @desc    Get entry by exact date
// @route   GET /api/entries/:date
// @access  Private
const getEntryByDate = async (req, res) => {
  try {
    const { date } = req.params; // Expect 'YYYY-MM-DD'
    const entry = await Entry.findOne({ user: req.user.id, date });
    
    if (entry) {
      res.status(200).json(entry);
    } else {
      // If it doesn't exist, return empty (not an error, just empty state)
      res.status(200).json(null);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update an entry by date
// @route   PUT /api/entries/:date
// @access  Private
const saveEntry = async (req, res) => {
  try {
    const { date } = req.params;
    const updateData = req.body;
    updateData.user = req.user.id;
    updateData.date = date; // enforce URL date

    // Using findOneAndUpdate with Upsert = true prevents duplicates
    const entry = await Entry.findOneAndUpdate(
      { user: req.user.id, date },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get history of entries sorted by date
// @route   GET /api/entries/history?days=7
// @access  Private
const getEntriesHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    // Calculate cutoff date exactly 'days' ago
    const cutoffNodeDate = new Date();
    cutoffNodeDate.setDate(cutoffNodeDate.getDate() - (days - 1));
    const cutoffDateStr = new Date(cutoffNodeDate.getTime() - cutoffNodeDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const entries = await Entry.find({ 
      user: req.user.id,
      date: { $gte: cutoffDateStr }
    }).sort({ date: 1 }); // Ascending order

    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEntryByDate, saveEntry, getEntriesHistory };
