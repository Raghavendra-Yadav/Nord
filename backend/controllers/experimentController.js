const Experiment = require('../models/Experiment');

exports.createExperiment = async (req, res) => {
  try {
    const { title, hypothesis, durationDays, frequency } = req.body;

    if (!title || title.trim().length < 2) {
      return res.status(400).json({ message: 'Title must be at least 2 characters' });
    }
    const days = parseInt(durationDays);
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ message: 'Duration must be between 1 and 365 days' });
    }

    const experiment = new Experiment({
      user: req.user.id,
      title,
      hypothesis,
      durationDays,
      frequency
    });
    await experiment.save();
    res.status(201).json(experiment);
  } catch (err) {
    res.status(500).json({ message: 'Error creating experiment', error: err.message });
  }
};

exports.getExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(experiments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching experiments' });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { notes } = req.body;
    const experiment = await Experiment.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!experiment) return res.status(404).json({ message: 'Experiment not found' });
    if (experiment.status !== 'active') return res.status(400).json({ message: 'Experiment is not active' });

    experiment.checkIns.push({ notes });
    await experiment.save();
    res.json(experiment);
  } catch (err) {
    res.status(500).json({ message: 'Error logging check-in' });
  }
};

exports.completeExperiment = async (req, res) => {
  try {
    const { status, finalReflection } = req.body;
    const experiment = await Experiment.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!experiment) return res.status(404).json({ message: 'Experiment not found' });

    experiment.status = status;
    if (finalReflection) experiment.finalReflection = finalReflection;
    
    await experiment.save();
    res.json(experiment);
  } catch (err) {
    res.status(500).json({ message: 'Error completing experiment' });
  }
};
