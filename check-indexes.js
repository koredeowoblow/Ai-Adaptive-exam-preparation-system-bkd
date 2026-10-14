const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('Courses Indexes:', await db.collection('courses').indexes());
  console.log('Topics Indexes:', await db.collection('topics').indexes());
  console.log('Questions Indexes:', await db.collection('questions').indexes());
  process.exit(0);
}
check();
