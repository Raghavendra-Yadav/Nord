const mongoose = require('mongoose');

const SkincareProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  
  // Custom Routine Stacks (Skin Cycling)
  stacks: [{
    id: String,
    name: String,
    type: { type: String, enum: ['AM', 'PM'] },
    steps: [{ type: String }]
  }],
  concerns: [{ type: String }],
  
  aiAnalysis: { type: Object, default: {} }, // Store structured AI response
  
  logs: [{
    date: { type: String },
    amStackName: { type: String, default: '' },
    pmStackName: { type: String, default: '' },
    amCompleted: [{ type: String }],
    pmCompleted: [{ type: String }],
    skinState: { type: String, default: '' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SkincareProfile', SkincareProfileSchema);
