const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ CORS middleware - бүх routes-аас ӨМНӨ байх ёстой
app.use(cors({
  origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB холбогдсон'))
  .catch(err => console.error('MongoDB алдаа:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/statistics', require('./routes/statistics'));

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

const userSockets = new Map();

io.on('connection', (socket) => {
  socket.on('user_connected', (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
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
    const receiverSocketId = userSockets.get(data.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', data);
    }
  });

  socket.on('stop_typing', (data) => {
    const receiverSocketId = userSockets.get(data.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', data);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} порт дээр ажиллаж байна`);
});