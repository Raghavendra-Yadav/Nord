const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createExperiment, getExperiments, checkIn, completeExperiment } = require('../controllers/experimentController');

router.route('/')
  .post(protect, createExperiment)
  .get(protect, getExperiments);

router.post('/:id/checkin', protect, checkIn);
router.put('/:id/complete', protect, completeExperiment);

module.exports = router;
