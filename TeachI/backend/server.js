require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// DEBUG: .env файлын тексеру
console.log('=== DEBUG INFORMATION ===');
console.log('Current directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT from .env:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Production CORS баптаулары
const corsOptions = {
  origin: function (origin, callback) {
    // Рұқсат етілген домендер
    const allowedOrigins = [
      'http://localhost:3000',                    // Локальды дамыту
      'https://teachi-f.onrender.com',            // Production фронтенд
      'https://teachi-3.onrender.com',            // Production бэкенд
    ];
    
    // Postman/Insomnia сияқты тест құралдары үшін
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS рұқсаты берілді:', origin);
      return callback(null, true);
    } else {
      console.log('🚫 CORS блокталды:', origin);
      return callback(new Error('CORS рұқсаты жоқ'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 сағат
};

app.use(cors(corsOptions));

// Preflight сұрақтарын өңдеу
app.options('*', cors(corsOptions));

app.use(express.json());

// Нағыз MongoDB қос
async function startServer() {
  try {
    console.log('\n=== STARTING SERVER ===');
    
    // .env файлынан URI алу
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ ERROR: MONGODB_URI is not defined in .env file!');
      console.error('Please check if .env file exists in:', process.cwd());
      console.error('File should contain: MONGODB_URI=mongodb+srv://...');
      process.exit(1);
    }
    
    console.log('🔧 Connecting to MongoDB...');
    console.log('📋 Using URI (password hidden):', 
      MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    // Better connection options
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database name:', mongoose.connection.name);
    
    // Routes
    console.log('🔄 Loading routes...');
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/courses', require('./routes/courses'));
    app.use('/api/enrollments', require('./routes/enrollments'));
    app.use('/api/analytics', require('./routes/analytics')); 
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/messages', require('./routes/messages'));
    app.use('/api/attendance', require('./routes/attendance'));
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV
      });
    });
    
    app.get('/', (req, res) => {
      res.send(`
        <h1>🎓 TeachI Backend API</h1>
        <p>Сервер жұмыс істеп тұр! Деректер тұрақты сақталады.</p>
        <p>Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
        <p>API Base URL: <code>/api</code></p>
        <p>Health Check: <a href="/health">/health</a></p>
      `);
    });
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`✅ CORS enabled for:`);
      corsOptions.origin('http://localhost:3000', () => {});
      corsOptions.origin('https://teachi-f.onrender.com', () => {});
      corsOptions.origin('https://teachi-3.onrender.com', () => {});
      console.log(`📁 .env location: ${process.cwd()}\\.env`);
    });
    
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    
    // More specific error handling
    if (error.message.includes('bad auth')) {
      console.error('\n🔐 AUTHENTICATION FAILED!');
      console.error('Possible reasons:');
      console.error('1. Wrong password in .env file');
      console.error('2. User does not exist in MongoDB Atlas');
      console.error('3. User has no permissions');
      
      console.error('\n💡 Solution:');
      console.error('1. Check .env file: MONGODB_URI=' + (process.env.MONGODB_URI || 'NOT FOUND'));
      console.error('2. Go to MongoDB Atlas → Database Access → Reset Password');
      console.error('3. Update .env file with new password');
    }
    
    process.exit(1);
  }
}

startServer();
