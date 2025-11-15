const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // edumemage базасына қосылу
    await mongoose.connect('mongodb://localhost:27017/edumemage');
    console.log('✅ Connected to edumemage database');

    // User модельін импорттау
    const User = require('./models/User');

    // Ескі админ есебін жою
    await User.deleteMany({ email: 'admin@edu.kz' });
    console.log('🗑️ Removed old admin accounts');

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
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@edu.kz');
    console.log('🔑 Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🎉 Done! Now start the server and login.');
  }
}

createAdmin();