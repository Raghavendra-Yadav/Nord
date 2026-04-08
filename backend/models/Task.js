const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  
  frog: {
    text: { type: String, default: '' },
    completed: { type: Boolean, default: false }
  },
  
  ivyTasks: [{
    text: { type: String },
    completed: { type: Boolean, default: false },
    poms: { type: Number, default: 0 } // Deep work pomodoros estimated/completed
  }],
  
  notToDo: [{
    text: { type: String },
    broken: { type: Boolean, default: false } // Did they break the rule?
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
