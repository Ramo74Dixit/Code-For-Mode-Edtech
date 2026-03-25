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
  if (req.method === 'POST' || req.method === 'PUT') {
      console.log("📦 BODY:", JSON.stringify(req.body, null, 2));
  }
  // console.log("Headers:", JSON.stringify(req.headers, null, 2));
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
// Add after existing routes
app.use('/api/batches', require('./routes/batches'));
app.use('/api/live-sessions', require('./routes/LiveStream'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/announcements', require('./routes/announcements')); // Register Announcement Routes
app.use('/api/ai', require('./routes/aiRoutes')); // Register AI Routes
app.use('/api/tests', require('./routes/tests'));
app.use('/api/payment', require('./routes/payment')); // Use 'payment.js' and singular '/api/payment' path
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/admin', require('./routes/admin')); // Register Admin Routes
app.use('/api', require('./routes/learningRoutes'));
app.use('/api/chat', require('./routes/chat')); // Register Chat Routes

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

// 404 Logger - catch unmatched routes (MUST BE LAST)
app.use((req, res, next) => {
    // Skip 404 log for internal or benign checks if needed, but for now log all
    console.log(`⚠️ 404 NOT FOUND: [${req.method}] ${req.url}`);
    res.status(404).json({ success: false, message: `Route not found: ${req.url}` });
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
const Message = require('./models/Message'); // Import Message Model

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

  socket.on('send_message', async (data) => {
    try {
       // Persist message to database
       const newMessage = await Message.create({
         room: data.room,
         sender: data.senderId,
         content: data.message,
         attachments: data.attachment ? [data.attachment] : [] // Handle attachment
       });
       
       // Populate sender info before emitting back (optional, but good for real-time UI)
       // For speed, frontend might just use the data sent, but let's stick to simple echo + persistence first.
       // Or we can populate:
       const populatedMessage = await newMessage.populate('sender', 'name profileImage');
       
       // Emit the saved message structure (consistent with DB)
       socket.to(data.room).emit('receive_message', populatedMessage);
       
    } catch (err) {
       console.error("🔥 Error saving message:", err);
       if (err.name === 'ValidationError') {
           console.error("Validation Errors:", JSON.stringify(err.errors, null, 2));
       }
    }
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

// ✅ Naya code
const PORT = process.env.PORT || 5002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});