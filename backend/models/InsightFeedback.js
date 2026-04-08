const mongoose = require('mongoose');

const insightFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  insightId: {
    type: String, // e.g., 'sleep-mood-corr', 'deepwork-trend-up'
    required: true
  },
  category: {
    type: String // e.g., 'Correlation', 'Momentum', 'Anomaly'
  },
  actionType: {
    type: String, 
    enum: ['helpful', 'dismissed', 'saved', 'acted'],
    required: true
  },
  context: {
    type: mongoose.Schema.Types.Mixed // Any additional context (e.g., tone testing variables)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InsightFeedback', insightFeedbackSchema);
