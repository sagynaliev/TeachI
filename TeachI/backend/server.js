require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Нағыз MongoDB қос
async function startServer() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edu_manage';
    
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    // ... басқа route-тар
    
    app.get('/', (req, res) => {
      res.send(`
        <h1>🎓 TeachI</h1>
        <p>Сервер жұмыс істеп тұр! Деректер тұрақты сақталады.</p>
        <a href="/api/auth/register">Тіркелу</a>
      `);
    });
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

startServer();