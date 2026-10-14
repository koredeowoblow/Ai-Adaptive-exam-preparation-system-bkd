const IORedis = require('ioredis');
const redisClient = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: () => null,
});

async function test() {
  console.log('Starting get 1');
  redisClient.get('testkey').catch(e => console.log('Error 1:', e.message));
  console.log('Started get 1');
  
  setTimeout(() => {
    console.log('Starting get 2');
    redisClient.get('testkey').then(() => console.log('Resolved 2')).catch(e => console.log('Error 2:', e.message));
    console.log('Started get 2');
  }, 1000);
}
test();
