const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  notes: { type: String, required: true }
});

const experimentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  hypothesis: { type: String }, // What do they hope to achieve?
  durationDays: { type: Number, required: true },
  frequency: { type: String, default: 'Daily' },
  startDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  checkIns: [checkInSchema],
  finalReflection: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Experiment', experimentSchema);
