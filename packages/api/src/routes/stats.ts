import { FastifyInstance } from 'fastify';
import { prisma } from '@webagent/core/db';

export async function statsRoutes(fastify: FastifyInstance) {
  // Get email statistics
  fastify.get('/stats/emails', async (request, reply) => {
    try {
      // Calculate timestamp for 24 hours ago
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      // Count emails received in the last 24 hours
      const last24Hours = await prisma.email.count({
        where: {
          receivedAt: {
            gte: yesterday
          }
        }
      });

      // Get total email count for debugging
      const totalEmails = await prisma.email.count();

      // Get the most recent email to check if we have any data
      const mostRecentEmail = await prisma.email.findFirst({
        orderBy: {
          receivedAt: 'desc'
        },
        select: {
          receivedAt: true
        }
      });

      fastify.log.info({
        totalEmails,
        last24Hours,
        mostRecentEmail,
        yesterday: yesterday.toISOString(),
        now: new Date().toISOString()
      });

      return {
        last24Hours,
        totalEmails,
        mostRecentEmailDate: mostRecentEmail?.receivedAt
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch email stats' });
    }
  });
}
