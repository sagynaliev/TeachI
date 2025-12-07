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
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://240118001_db_user:Jg2e8whJwomol4Ai@teachi.6bvwzai.mongodb.net/teachi?retryWrites=true&w=majority';
    
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // === БАРЛЫҚ ROUTE-ТАРДЫ ИМПОРТТАУ ===
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/courses', require('./routes/courses'));
    app.use('/api/enrollments', require('./routes/enrollments'));
    app.use('/api/assignments', require('./routes/assignments'));      // ✅ БУЛ ЖЕРГЕ
    app.use('/api/notifications', require('./routes/notifications'));  // ✅ БУЛ ЖЕРГЕ
    app.use('/api/analytics', require('./routes/analytics'));
    app.use('/api/attendance', require('./routes/attendance'));
    app.use('/api/grades', require('./routes/grades'));
    app.use('/api/messages', require('./routes/messages'));
    app.use('/api/submissions', require('./routes/submissions'));
    app.use('/api/upload', require('./routes/upload'));
    
    app.get('/', (req, res) => {
      res.send(`
        <h1>🎓 TeachI Backend API</h1>
        <p>Сервер жұмыс істеп тұр!</p>
        <p>Доступные API endpoints:</p>
        <ul>
          <li><a href="/api/auth">/api/auth</a> - Аутентификация</li>
          <li><a href="/api/users">/api/users</a> - Пользователи</li>
          <li><a href="/api/courses">/api/courses</a> - Курсы</li>
          <li><a href="/api/assignments">/api/assignments</a> - Задания</li>
          <li><a href="/api/notifications">/api/notifications</a> - Уведомления</li>
          <li><a href="/api/enrollments">/api/enrollments</a> - Записи на курсы</li>
          <li><a href="/api/grades">/api/grades</a> - Оценки</li>
          <li><a href="/api/analytics">/api/analytics</a> - Аналитика</li>
          <li><a href="/api/attendance">/api/attendance</a> - Посещаемость</li>
        </ul>
      `);
    });
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`✅ CORS enabled for: http://localhost:3000`);
      console.log(`📁 Available routes:`);
      console.log(`   /api/auth`);
      console.log(`   /api/users`);
      console.log(`   /api/courses`);
      console.log(`   /api/assignments`);      // ✅
      console.log(`   /api/notifications`);    // ✅
      console.log(`   /api/enrollments`);
      console.log(`   /api/analytics`);
      console.log(`   /api/attendance`);
      console.log(`   /api/grades`);
      console.log(`   /api/messages`);
      console.log(`   /api/submissions`);
      console.log(`   /api/upload`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

startServer();
