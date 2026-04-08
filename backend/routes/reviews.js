const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateReview } = require('../controllers/reviewController');

// POST /api/reviews/generate
router.post('/generate', protect, generateReview);

module.exports = router;
