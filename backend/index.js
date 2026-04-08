const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/insights', require('./routes/insightRoutes'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/skincare', require('./routes/skincare'));

app.get('/', (req, res) => {
  res.send('Nord API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
