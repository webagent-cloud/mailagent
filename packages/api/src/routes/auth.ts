import { FastifyPluginAsync } from 'fastify';
import { GmailOAuthService } from '../services/gmail-oauth';
import { OutlookOAuthService } from '../services/outlook-oauth';
import { prisma } from '@webagent/core/db';
import { EmailProvider } from '@webagent/core';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const gmailOAuth = new GmailOAuthService();
  const outlookOAuth = new OutlookOAuthService();

  // Initiate Gmail OAuth flow
  fastify.get('/auth/gmail', async (request, reply) => {
    try {
      const authUrl = gmailOAuth.getAuthUrl();
      return { authUrl };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate auth URL' });
    }
  });

  // Gmail OAuth callback
  fastify.get('/auth/gmail/callback', async (request, reply) => {
    try {
      const { code, error } = request.query as { code?: string; error?: string };

      if (error) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return reply.redirect(`${frontendUrl}/email-account?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        return reply.status(400).send({ error: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const tokens = await gmailOAuth.exchangeCodeForTokens(code);

      // Get user info
      const userInfo = await gmailOAuth.getUserInfo(tokens.accessToken);

      // Check if account already exists
      const existingAccount = await prisma.emailAccount.findFirst({
        where: {
          emailAddress: userInfo.email,
          provider: EmailProvider.GMAIL,
        },
      });

      if (existingAccount) {
        // Update existing account with new tokens
        await prisma.emailAccount.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: tokens.accessToken,
            ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
            tokenExpiry: tokens.tokenExpiry,
            isActive: true,
          },
        });
      } else {
        // Create new email account
        if (!tokens.refreshToken) {
          throw new Error('Refresh token is required for new accounts');
        }

        await prisma.emailAccount.create({
          data: {
            emailAddress: userInfo.email,
            displayName: userInfo.displayName,
            provider: EmailProvider.GMAIL,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: tokens.tokenExpiry,
            clientId: process.env.GMAIL_CLIENT_ID!,
            clientSecret: process.env.GMAIL_CLIENT_SECRET!,
            isActive: true,
            syncInterval: 60, // 1 minute default
          },
        });
      }

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/email-account?success=true`);
    } catch (error) {
      fastify.log.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/email-account?error=auth_failed`);
    }
  });

  // Initiate Outlook OAuth flow
  fastify.get('/auth/outlook', async (request, reply) => {
    try {
      const authUrl = await outlookOAuth.getAuthUrl();
      return { authUrl };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate auth URL' });
    }
  });

  // Outlook OAuth callback
  fastify.get('/auth/outlook/callback', async (request, reply) => {
    try {
      const { code, error } = request.query as { code?: string; error?: string };

      if (error) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return reply.redirect(`${frontendUrl}/email-account?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        return reply.status(400).send({ error: 'Authorization code is required' });
      }

      // Exchange code for tokens
      const tokens = await outlookOAuth.exchangeCodeForTokens(code);

      // Get user info
      const userInfo = await outlookOAuth.getUserInfo(tokens.accessToken);

      // Check if account already exists
      const existingAccount = await prisma.emailAccount.findFirst({
        where: {
          emailAddress: userInfo.email,
          provider: EmailProvider.OUTLOOK,
        },
      });

      if (existingAccount) {
        // Update existing account with new tokens
        await prisma.emailAccount.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: tokens.accessToken,
            ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
            tokenExpiry: tokens.tokenExpiry,
            isActive: true,
          },
        });
      } else {
        // Create new email account
        if (!tokens.refreshToken) {
          throw new Error('Refresh token is required for new accounts');
        }

        await prisma.emailAccount.create({
          data: {
            emailAddress: userInfo.email,
            displayName: userInfo.displayName,
            provider: EmailProvider.OUTLOOK,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: tokens.tokenExpiry,
            clientId: process.env.OUTLOOK_CLIENT_ID!,
            clientSecret: process.env.OUTLOOK_CLIENT_SECRET!,
            tenantId: process.env.OUTLOOK_TENANT_ID || 'common',
            isActive: true,
            syncInterval: 60, // 1 minute default
          },
        });
      }

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/email-account?success=true`);
    } catch (error) {
      fastify.log.error(error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return reply.redirect(`${frontendUrl}/email-account?error=auth_failed`);
    }
  });
};

export default authRoutes;
