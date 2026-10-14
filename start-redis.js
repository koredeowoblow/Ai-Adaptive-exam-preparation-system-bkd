const { RedisMemoryServer } = require('redis-memory-server');
async function start() {
  const redisServer = new RedisMemoryServer({
    instance: {
      port: 6379
    }
  });
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  console.log(`Redis Memory Server started on ${host}:${port}`);
}
start();
