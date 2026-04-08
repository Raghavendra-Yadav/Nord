const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateSettings, logDay, analyzeRoutine } = require('../controllers/skincareController');

router.get('/', protect, getProfile);
router.put('/settings', protect, updateSettings);
router.put('/log', protect, logDay);
router.post('/analyze', protect, analyzeRoutine);

module.exports = router;
