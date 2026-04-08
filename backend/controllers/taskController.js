const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const { date } = req.params;
    let taskMatrix = await Task.findOne({ user: req.user.id, date });
    
    if (!taskMatrix) {
      taskMatrix = new Task({
        user: req.user.id,
        date,
        ivyTasks: Array(6).fill({ text: '', completed: false, poms: 0 }),
        notToDo: Array(3).fill({ text: '', broken: false })
      });
      await taskMatrix.save();
    }
    
    res.json(taskMatrix);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching tasks', error: err.message });
  }
};

exports.updateTasks = async (req, res) => {
  try {
    const { date } = req.params;
    const { frog, ivyTasks, notToDo } = req.body;
    
    let taskMatrix = await Task.findOneAndUpdate(
      { user: req.user.id, date },
      { $set: { frog, ivyTasks, notToDo } },
      { new: true, upsert: true }
    );
    
    res.json(taskMatrix);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating tasks', error: err.message });
  }
};
