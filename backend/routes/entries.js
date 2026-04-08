const express = require('express');
const router = express.Router();
const { getEntryByDate, saveEntry, getEntriesHistory } = require('../controllers/entryController');
const { protect } = require('../middleware/auth');

router.get('/history', protect, getEntriesHistory);
router.route('/:date')
  .get(protect, getEntryByDate)
  .put(protect, saveEntry);

module.exports = router;
