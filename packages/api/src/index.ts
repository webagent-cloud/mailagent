import 'dotenv/config';
import Fastify from 'fastify';
import { greet } from '@webagent/core';
import { emailAccountsRoutes } from './routes/email-accounts.js';
import authRoutes from './routes/auth.js';
import { statsRoutes } from './routes/stats.js';
import { agentsRoutes } from './routes/agents.js';
import { agentRunsRoutes } from './routes/agent-runs.js';
import { EmailSyncService } from './services/email-sync.js';

const fastify = Fastify({
  logger: true
});

fastify.get('/', async (request, reply) => {
  return { message: greet('World') };
});

fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Register auth routes
fastify.register(authRoutes);

// Register email account routes
fastify.register(emailAccountsRoutes);

// Register stats routes
fastify.register(statsRoutes);

// Register agent routes
fastify.register(agentsRoutes);

// Register agent runs routes
fastify.register(agentRunsRoutes);

// Initialize email sync service
const emailSync = new EmailSyncService();

// Start email polling (every 1 minute)
const SYNC_INTERVAL = 60 * 1000; // 1 minute in milliseconds

const startEmailPolling = () => {
  console.log('Starting email polling service (every 1 minute)...');

  // Run initial sync after 5 seconds
  setTimeout(() => {
    emailSync.syncAllActiveAccounts().catch(console.error);
  }, 5000);

  // Then run every minute
  setInterval(() => {
    emailSync.syncAllActiveAccounts().catch(console.error);
  }, SYNC_INTERVAL);
};

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');

    // Start email polling
    startEmailPolling();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
