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
app.use('/uploads', express.static('uploads'));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  // console.log("Headers:", JSON.stringify(req.headers, null, 2));
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
// Add after existing routes
app.use('/api/batches', require('./routes/batches'));
app.use('/api/live-sessions', require('./routes/liveStream'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api', require('./routes/learningRoutes'));

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


const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);

  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});