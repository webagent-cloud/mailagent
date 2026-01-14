import { FastifyInstance } from 'fastify';
import { prisma } from '@webagent/core/db';

export async function agentsRoutes(fastify: FastifyInstance) {
  // Get all agents
  fastify.get('/agents', async (request, reply) => {
    try {
      const agents = await prisma.agent.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          emailAccounts: {
            include: {
              emailAccount: {
                select: {
                  id: true,
                  emailAddress: true,
                  displayName: true,
                  provider: true,
                  isActive: true
                }
              }
            }
          }
        }
      });
      return { agents };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch agents' });
    }
  });

  // Get a specific agent
  fastify.get('/agents/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          emailAccounts: {
            include: {
              emailAccount: {
                select: {
                  id: true,
                  emailAddress: true,
                  displayName: true,
                  provider: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      if (!agent) {
        reply.status(404).send({ error: 'Agent not found' });
        return;
      }

      return { agent };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch agent' });
    }
  });

  // Create a new agent
  fastify.post('/agents', async (request, reply) => {
    try {
      const {
        name,
        trigger,
        triggerType,
        prompt,
        responseFormat,
        jsonSchema,
        webhookUrl,
        shouldExtractFiles,
        extractFileConfig,
        model,
        modelProvider,
        isActive,
        emailAccountIds
      } = request.body as {
        name: string;
        trigger: string;
        triggerType: 'ON_EACH_EMAIL' | 'TRIGGER_MANUALLY';
        prompt: string;
        responseFormat: 'STRING' | 'JSON' | 'JSON_SCHEMA';
        jsonSchema?: string;
        webhookUrl?: string;
        shouldExtractFiles?: boolean;
        extractFileConfig?: string;
        model?: string;
        modelProvider?: string;
        isActive?: boolean;
        emailAccountIds?: string[];
      };

      // Validate required fields
      if (!name || !trigger || !prompt) {
        reply.status(400).send({ error: 'Missing required fields: name, trigger, prompt' });
        return;
      }

      // Validate JSON schema if response format is JSON_SCHEMA
      if (responseFormat === 'JSON_SCHEMA' && jsonSchema) {
        try {
          JSON.parse(jsonSchema);
        } catch (e) {
          reply.status(400).send({ error: 'Invalid JSON schema format' });
          return;
        }
      }

      // Validate extract file config if provided
      if (extractFileConfig) {
        try {
          JSON.parse(extractFileConfig);
        } catch (e) {
          reply.status(400).send({ error: 'Invalid extract file config format' });
          return;
        }
      }

      const agent = await prisma.agent.create({
        data: {
          name,
          trigger,
          triggerType,
          prompt,
          responseFormat,
          jsonSchema,
          webhookUrl,
          shouldExtractFiles: shouldExtractFiles ?? false,
          extractFileConfig,
          model: model ?? 'gpt-4',
          modelProvider: modelProvider ?? 'openai',
          isActive: isActive ?? true,
          emailAccounts: emailAccountIds && emailAccountIds.length > 0 ? {
            create: emailAccountIds.map(emailAccountId => ({
              emailAccountId
            }))
          } : undefined
        },
        include: {
          emailAccounts: {
            include: {
              emailAccount: {
                select: {
                  id: true,
                  emailAddress: true,
                  displayName: true,
                  provider: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      return { agent };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to create agent' });
    }
  });

  // Update an agent
  fastify.put('/agents/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const {
        name,
        trigger,
        triggerType,
        prompt,
        responseFormat,
        jsonSchema,
        webhookUrl,
        shouldExtractFiles,
        extractFileConfig,
        model,
        modelProvider,
        isActive,
        emailAccountIds
      } = request.body as {
        name?: string;
        trigger?: string;
        triggerType?: 'ON_EACH_EMAIL' | 'TRIGGER_MANUALLY';
        prompt?: string;
        responseFormat?: 'STRING' | 'JSON' | 'JSON_SCHEMA';
        jsonSchema?: string;
        webhookUrl?: string;
        shouldExtractFiles?: boolean;
        extractFileConfig?: string;
        model?: string;
        modelProvider?: string;
        isActive?: boolean;
        emailAccountIds?: string[];
      };

      // Check if agent exists
      const existingAgent = await prisma.agent.findUnique({
        where: { id }
      });

      if (!existingAgent) {
        reply.status(404).send({ error: 'Agent not found' });
        return;
      }

      // Validate JSON schema if response format is JSON_SCHEMA
      if (responseFormat === 'JSON_SCHEMA' && jsonSchema) {
        try {
          JSON.parse(jsonSchema);
        } catch (e) {
          reply.status(400).send({ error: 'Invalid JSON schema format' });
          return;
        }
      }

      // Validate extract file config if provided
      if (extractFileConfig) {
        try {
          JSON.parse(extractFileConfig);
        } catch (e) {
          reply.status(400).send({ error: 'Invalid extract file config format' });
          return;
        }
      }

      // If emailAccountIds provided, update the associations
      if (emailAccountIds !== undefined) {
        // Delete existing associations
        await prisma.agentEmailAccount.deleteMany({
          where: { agentId: id }
        });

        // Create new associations
        if (emailAccountIds.length > 0) {
          await prisma.agentEmailAccount.createMany({
            data: emailAccountIds.map(emailAccountId => ({
              agentId: id,
              emailAccountId
            }))
          });
        }
      }

      const agent = await prisma.agent.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(trigger !== undefined && { trigger }),
          ...(triggerType !== undefined && { triggerType }),
          ...(prompt !== undefined && { prompt }),
          ...(responseFormat !== undefined && { responseFormat }),
          ...(jsonSchema !== undefined && { jsonSchema }),
          ...(webhookUrl !== undefined && { webhookUrl }),
          ...(shouldExtractFiles !== undefined && { shouldExtractFiles }),
          ...(extractFileConfig !== undefined && { extractFileConfig }),
          ...(model !== undefined && { model }),
          ...(modelProvider !== undefined && { modelProvider }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          emailAccounts: {
            include: {
              emailAccount: {
                select: {
                  id: true,
                  emailAddress: true,
                  displayName: true,
                  provider: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      return { agent };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update agent' });
    }
  });

  // Delete an agent
  fastify.delete('/agents/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      // Check if agent exists
      const existingAgent = await prisma.agent.findUnique({
        where: { id }
      });

      if (!existingAgent) {
        reply.status(404).send({ error: 'Agent not found' });
        return;
      }

      await prisma.agent.delete({
        where: { id }
      });

      return { message: 'Agent deleted successfully', id };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete agent' });
    }
  });

  // Toggle agent active status
  fastify.patch('/agents/:id/toggle', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const existingAgent = await prisma.agent.findUnique({
        where: { id }
      });

      if (!existingAgent) {
        reply.status(404).send({ error: 'Agent not found' });
        return;
      }

      const agent = await prisma.agent.update({
        where: { id },
        data: { isActive: !existingAgent.isActive }
      });

      return { agent };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to toggle agent status' });
    }
  });
}
