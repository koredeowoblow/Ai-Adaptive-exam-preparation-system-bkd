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
  let p1 = redisClient.get('testkey').catch(e => console.log('Error 1:', e.message));
  console.log('Started get 1');
  
  await new Promise(r => setTimeout(r, 1000));
  console.log('Starting get 2');
  let p2 = redisClient.get('testkey').catch(e => console.log('Error 2:', e.message));
  console.log('Started get 2');
  
  await Promise.all([p1, p2]);
  console.log('Done');
}
test();
