const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

app.use((err, req, res, next) => {
  console.log("🔥 ERROR NAME:", err.name);
  console.log("🔥 ERROR MESSAGE:", err.message);
  console.log("🔥 ERROR STACK:", err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
// Add after existing routes
app.use('/api/batches', require('./routes/batches'));
app.use('/api/live-sessions', require('./routes/liveStream'));
app.use('/api/assignments', require('./routes/assignments'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});