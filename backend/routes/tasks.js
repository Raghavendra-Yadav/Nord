const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTasks, updateTasks } = require('../controllers/taskController');

router.route('/:date')
  .get(protect, getTasks)
  .put(protect, updateTasks);

module.exports = router;
