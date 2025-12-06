require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Ең қарапайым CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

async function startServer() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://240118001_db_user:Alikhan2007@teachi.6bvwzai.mongodb.net/teachi?retryWrites=true&w=majority';
    
    console.log('🔧 Connecting to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI ? 'Exists' : 'Missing');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/courses', require('./routes/courses'));
    app.use('/api/enrollments', require('./routes/enrollments'));
    
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        database: 'connected',
        cors: 'enabled'
      });
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Startup error:', error.message);
    process.exit(1);
  }
}

startServer();
