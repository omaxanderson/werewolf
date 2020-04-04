import Redis from 'ioredis';

const client: Redis.Redis = new Redis();

export const ok = async (): Promise<boolean> => (await client.ping()) === 'PONG';

export default client;

