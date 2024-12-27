import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Add data to a Redis list
export const addToList = async (listKey: string, value: string): Promise<number> => {
  try {
    const result = await redis.rpush(listKey, value);
    return result;
  } catch (err) {
    console.error('Failed to add to list:', err);
    throw err;
  }
};


// Remove data from a Redis list
export const removeFromList = async (listKey: string, value: string): Promise<number> => {
  try {
    const result = await redis.lrem(listKey, 0, value);
    return result;
  } catch (err) {
    console.error('Failed to remove from list:', err);
    throw err;
  }
}
