require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Нақты CORS баптау
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Нағыз MongoDB қос
async function startServer() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://240118001_db_user:<db_password>@teachi.6bvwzai.mongodb.net/?appName=TeachI';
    
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/courses', require('./routes/courses'));
    app.use('/api/enrollments', require('./routes/enrollments'));
    app.get('/', (req, res) => {
      res.send(`
        <h1>🎓 TeachI</h1>
        <p>Сервер жұмыс істеп тұр! Деректер тұрақты сақталады.</p>
      `);
    });
    
    const PORT = process.env.PORT || 3001; // ⬅️ 3001 порты
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`✅ CORS enabled for: http://localhost:3000`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

startServer();
