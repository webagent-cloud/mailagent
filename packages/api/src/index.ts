import Fastify from 'fastify';
import { greet } from '@webagent/core';

const fastify = Fastify({
  logger: true
});

fastify.get('/', async (request, reply) => {
  return { message: greet('World') };
});

fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
