const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists and serve it
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// MongoDB холболт
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB холбогдсон'))
  .catch(err => console.error('MongoDB алдаа:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));

// File upload endpoint
const auth = require('./middleware/auth');
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ path: `/uploads/${req.file.filename}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time messaging
const userSockets = new Map(); // Map userId to socket id

io.on('connection', (socket) => {
  socket.on('user_connected', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  socket.on('send_message', (data) => {
    const { receiver } = data;
    const receiverSocketId = userSockets.get(receiver);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', data);
    }
  });

  socket.on('typing', (data) => {
    const { receiver } = data;
    const receiverSocketId = userSockets.get(receiver);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', data);
    }
  });

  socket.on('stop_typing', (data) => {
    const { receiver } = data;
    const receiverSocketId = userSockets.get(receiver);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', data);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} порт дээр ажиллаж байна`);
});