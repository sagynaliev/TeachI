require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS - Render үшін
app.use(cors({
  origin: '*',  // ✅ Барлық домендерге
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

async function startServer() {
  try {
    // ✅ НАҚТЫ ПАРОЛЬ!
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://240118001_db_user:Alikhan2007@teachi.6bvwzai.mongodb.net/?appName=TeachI';
    
    console.log('🔧 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/courses', require('./routes/courses'));
    app.use('/api/enrollments', require('./routes/enrollments'));
    app.use('/api/analytics', require('./routes/analytics')); 
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/messages', require('./routes/messages'));
    app.use('/api/attendance', require('./routes/attendance'));
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        database: 'connected',
        cors: 'enabled'
      });
    });
    
    app.get('/', (req, res) => {
      res.send(`
        <h1>🎓 TeachI Backend</h1>
        <p>Сервер жұмыс істеп тұр!</p>
      `);
    });
    
    const PORT = process.env.PORT || 3000; // ✅ Render порты
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Startup error:', error.message);
    process.exit(1);
  }
}

startServer();
