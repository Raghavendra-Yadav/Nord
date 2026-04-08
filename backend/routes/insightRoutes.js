const express = require('express');
const router = express.Router();
const { logFeedback, getFeedbackHistory } = require('../controllers/insightController');
const { protect } = require('../middleware/auth');

router.route('/feedback')
  .post(protect, logFeedback)
  .get(protect, getFeedbackHistory);

module.exports = router;
