const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // .env файлын оқу үшін

async function createAdmin() {
  try {
    // MongoDB Atlas-қа қосылу
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edumemage');
    console.log('✅ Connected to MongoDB Atlas');

    // User модельін анықтау (егер әлі жоқ болса)
    const UserSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      isVerified: Boolean
    });

    const User = mongoose.model('User', UserSchema);

    // Ескі админ есебін жою
    await User.deleteMany({ email: 'admin@teachi.com' });
    console.log('🗑️ Removed old admin accounts');

    // Жаңа админ жасау
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const admin = new User({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@teachi.com', // TeachI үшін
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isVerified: true
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@teachi.com');
    console.log('🔑 Password: Admin123!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🎉 Done! Now start the server and login.');
  }
}

createAdmin();