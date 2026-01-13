import { FastifyInstance } from 'fastify';
import { prisma } from '@webagent/core/db';
import { GmailSyncService } from '../services/gmail-sync.js';

export async function emailAccountsRoutes(fastify: FastifyInstance) {
  const gmailSync = new GmailSyncService();
  // Get all email accounts
  fastify.get('/email-accounts', async (request, reply) => {
    try {
      const accounts = await prisma.emailAccount.findMany({
        select: {
          id: true,
          emailAddress: true,
          displayName: true,
          provider: true,
          isActive: true,
          lastSyncAt: true,
          createdAt: true,
          // Exclude sensitive fields like tokens
        }
      });
      return accounts;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch email accounts' });
    }
  });

  // Get a specific email account
  fastify.get('/email-accounts/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const account = await prisma.emailAccount.findUnique({
        where: { id },
        select: {
          id: true,
          emailAddress: true,
          displayName: true,
          provider: true,
          isActive: true,
          lastSyncAt: true,
          syncInterval: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!account) {
        reply.status(404).send({ error: 'Email account not found' });
        return;
      }

      return { account };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch email account' });
    }
  });

  // Get emails for an account
  fastify.get('/email-accounts/:id/emails', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { limit = 50, offset = 0, unread } = request.query as {
        limit?: number;
        offset?: number;
        unread?: boolean;
      };

      const where = {
        accountId: id,
        ...(unread !== undefined && { isRead: !unread })
      };

      // Get total count and emails in parallel
      const [total, emails] = await Promise.all([
        prisma.email.count({ where }),
        prisma.email.findMany({
          where,
          orderBy: {
            receivedAt: 'desc'
          },
          take: Number(limit),
          skip: Number(offset),
          include: {
            attachments: {
              select: {
                id: true,
                filename: true,
                mimeType: true,
                size: true,
              }
            }
          }
        })
      ]);

      return {
        emails,
        total,
        limit: Number(limit),
        offset: Number(offset)
      };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch emails' });
    }
  });

  // Get a specific email
  fastify.get('/emails/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const email = await prisma.email.findUnique({
        where: { id },
        include: {
          attachments: true,
          account: {
            select: {
              emailAddress: true,
              displayName: true,
              provider: true,
            }
          }
        }
      });

      if (!email) {
        reply.status(404).send({ error: 'Email not found' });
        return;
      }

      return { email };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch email' });
    }
  });

  // Mark email as read/unread
  fastify.patch('/emails/:id/read', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { isRead } = request.body as { isRead: boolean };

      const email = await prisma.email.update({
        where: { id },
        data: { isRead }
      });

      return { email };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update email' });
    }
  });

  // Manually trigger sync for a specific account
  fastify.post('/email-accounts/:id/sync', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const account = await prisma.emailAccount.findUnique({
        where: { id }
      });

      if (!account) {
        reply.status(404).send({ error: 'Email account not found' });
        return;
      }

      // Trigger sync in background
      gmailSync.syncAccount(id).catch(err => {
        fastify.log.error('Sync error:', err);
      });

      return { message: 'Sync started', accountId: id };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to start sync' });
    }
  });
}
