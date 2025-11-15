const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  // Екі базаға да админ қосу
  const databases = ['edumanage', 'edu_manage'];

  for (const dbName of databases) {
    try {
      console.log(`\n🔧 Trying database: ${dbName}`);
      
      // Әр базаға бөлек қосылу
      await mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ Connected to ${dbName}`);

      // User модельін импорттау
      const User = require('../models/User');

      // Админ есебі бар-жоғын тексеру
      const existingAdmin = await User.findOne({ email: 'admin@edu.kz' });
      
      if (existingAdmin) {
        console.log(`⚠️ Admin already exists in ${dbName}`);
        // Парольді жаңарту
        existingAdmin.password = await bcrypt.hash('admin123', 10);
        await existingAdmin.save();
        console.log(`✅ Admin password reset in ${dbName}`);
      } else {
        // Жаңа админ жасау
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
          firstName: 'System',
          lastName: 'Admin',
          email: 'admin@edu.kz',
          password: hashedPassword,
          role: 'admin',
          isActive: true
        });
        
        await admin.save();
        console.log(`✅ Admin created in ${dbName}`);
      }

      console.log(`📧 Email: admin@edu.kz`);
      console.log(`🔑 Password: admin123`);
      
    } catch (error) {
      console.log(`❌ ${dbName} error: ${error.message}`);
    } finally {
      // Келесі базаға өту үшін қосылымды жабу
      await mongoose.connection.close();
    }
  }

  console.log('\n🎉 Finished creating admin accounts!');
  console.log('🚀 Now try logging in with: admin@edu.kz / admin123');
}

createAdmin();