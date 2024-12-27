import Redis from 'ioredis';

const publisher = new Redis(process.env.REDIS_URL)
const subscriber = new Redis(process.env.REDIS_URL)

// Create a Redis instance.
// By default, it will connect to localhost:6379.
// Message types for Redis pub/sub
export enum MessageType {
  NEW_POOL_CREATED = 'NEW_POOL_CREATED',
  NEW_POOL_MERGED = 'NEW_POOL_MERGED',
  TRADING = 'TRADING'
}

// todo cleanup callback

// Clean up function to close Redis connections
const cleanup = () => {
  publisher.quit();
  subscriber.quit();
};

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const publishMessageToChannel = async (channel: MessageType, message: string) => {
  try {
    await publisher.publish(channel, message);
    console.log(`Message published successfully to channel: ${channel}`);
  } catch (err) {
    console.error('Failed to publish message:', err);
  }
};

// defind callback ref type
type CallbackRefType = {
  [key in MessageType]?: (message: string) => void;
}

let callBackRef: CallbackRefType = {}


const subscribeToChannel = async (channel: MessageType, callback: (message: string) => void) => {
  if (callBackRef[channel]) {
    // first cancel subscription from this
    subscriber.unsubscribe(channel)
  }

  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error('Failed to subscribe:', err);
      return;
    }
    console.log(`Subscribed to channel: ${channel}`);
  });

  subscriber.on('message', (channel: MessageType, message: string) => {
    callback(message)
  })
}

export {
  publishMessageToChannel,
  subscribeToChannel
}
