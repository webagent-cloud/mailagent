import { FastifyInstance } from 'fastify';
import { prisma } from '@webagent/core/db';

export async function agentRunsRoutes(fastify: FastifyInstance) {
  // Get all agent runs (with pagination)
  fastify.get('/agent-runs', async (request, reply) => {
    try {
      const { limit = 50, offset = 0, agentId, status } = request.query as {
        limit?: number;
        offset?: number;
        agentId?: string;
        status?: string;
      };

      const where: any = {};
      if (agentId) {
        where.agentId = agentId;
      }
      if (status) {
        where.status = status;
      }

      const [runs, total] = await Promise.all([
        prisma.agentRun.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset),
          include: {
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
            email: {
              select: {
                id: true,
                subject: true,
                from: true,
                receivedAt: true,
              },
            },
          },
        }),
        prisma.agentRun.count({ where }),
      ]);

      return { runs, total, limit: Number(limit), offset: Number(offset) };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch agent runs' });
    }
  });

  // Get a specific agent run
  fastify.get('/agent-runs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const run = await prisma.agentRun.findUnique({
        where: { id },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
            },
          },
          email: {
            select: {
              id: true,
              subject: true,
              from: true,
              to: true,
              body: true,
              receivedAt: true,
            },
          },
        },
      });

      if (!run) {
        reply.status(404).send({ error: 'Agent run not found' });
        return;
      }

      return { run };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch agent run' });
    }
  });

  // Get runs for a specific agent
  fastify.get('/agents/:agentId/runs', async (request, reply) => {
    try {
      const { agentId } = request.params as { agentId: string };
      const { limit = 50, offset = 0 } = request.query as {
        limit?: number;
        offset?: number;
      };

      const [runs, total] = await Promise.all([
        prisma.agentRun.findMany({
          where: { agentId },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset),
          include: {
            email: {
              select: {
                id: true,
                subject: true,
                from: true,
                receivedAt: true,
              },
            },
          },
        }),
        prisma.agentRun.count({ where: { agentId } }),
      ]);

      return { runs, total, limit: Number(limit), offset: Number(offset) };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch agent runs' });
    }
  });
}
