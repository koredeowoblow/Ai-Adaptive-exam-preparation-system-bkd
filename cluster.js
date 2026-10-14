const cluster = require('cluster');
const os = require('os');
const path = require('path');

if (cluster.isPrimary) {
  const numCPUs = 4; // Explicitly setting 4 instances as requested
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork(); // Replace the dead worker
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  require('./dist/server.js');
  console.log(`Worker ${process.pid} started`);
}
