const InsightFeedback = require('../models/InsightFeedback');

// @desc    Log user feedback for an insight
// @route   POST /api/insights/feedback
// @access  Private
const logFeedback = async (req, res) => {
  try {
    const { insightId, category, actionType, context } = req.body;

    const feedback = new InsightFeedback({
      user: req.user._id,
      insightId,
      category,
      actionType,
      context
    });

    const savedFeedback = await feedback.save();
    res.status(201).json(savedFeedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error plotting insight feedback' });
  }
};

// @desc    Get user's insight feedback history (for system to learn)
// @route   GET /api/insights/feedback
// @access  Private
const getFeedbackHistory = async (req, res) => {
  try {
    const history = await InsightFeedback.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error getting feedback history' });
  }
};

module.exports = {
  logFeedback,
  getFeedbackHistory
};
