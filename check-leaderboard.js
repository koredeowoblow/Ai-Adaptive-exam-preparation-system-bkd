const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const explain = await db.collection('leaderboardentries').find().sort({ score: -1 }).limit(10).explain('executionStats');
  console.log(JSON.stringify(explain, null, 2));
  process.exit(0);
}
check();
