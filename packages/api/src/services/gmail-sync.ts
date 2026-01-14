import { google } from 'googleapis';
import { prisma } from '@webagent/core/db';
import { GmailOAuthService } from './gmail-oauth';
import { AgentRunnerService } from './agent-runner';

export class GmailSyncService {
  private gmailOAuth: GmailOAuthService;
  private agentRunner: AgentRunnerService;

  constructor() {
    this.gmailOAuth = new GmailOAuthService();
    this.agentRunner = new AgentRunnerService();
  }

  async syncAccount(accountId: string) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.isActive) {
      console.log(`Account ${accountId} not found or inactive`);
      return;
    }

    try {
      // Check if token needs refresh
      let accessToken = account.accessToken;
      if (account.tokenExpiry && new Date() >= account.tokenExpiry) {
        if (!account.refreshToken) {
          console.error(`No refresh token for account ${accountId}`);
          return;
        }

        const refreshed = await this.gmailOAuth.refreshAccessToken(account.refreshToken);
        accessToken = refreshed.accessToken;

        await prisma.emailAccount.update({
          where: { id: accountId },
          data: {
            accessToken: refreshed.accessToken,
            tokenExpiry: refreshed.tokenExpiry,
          },
        });
      }

      // Create Gmail API client
      const auth = this.gmailOAuth.getOAuth2Client(accessToken, account.refreshToken || undefined);
      const gmail = google.gmail({ version: 'v1', auth });

      // Get last sync time or fetch from the last 7 days
      const lastSyncAt = account.lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const query = `after:${Math.floor(lastSyncAt.getTime() / 1000)}`;

      // List messages
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      });

      const messages = messagesResponse.data.messages || [];
      console.log(`Found ${messages.length} new messages for account ${accountId}`);

      // Fetch each message details
      for (const message of messages) {
        if (!message.id) continue;

        // Check if we already have this message
        const existingEmail = await prisma.email.findFirst({
          where: {
            messageId: message.id,
            accountId: accountId,
          },
        });

        if (existingEmail) {
          continue; // Skip if already synced
        }

        try {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });

          const headers = messageData.data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          const subject = getHeader('subject');
          const from = getHeader('from');
          const to = getHeader('to');
          const date = getHeader('date');

          // Extract body
          let bodyText = '';
          let htmlBody = '';

          const extractBody = (part: any): void => {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.mimeType === 'text/html' && part.body?.data) {
              htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }

            if (part.parts) {
              part.parts.forEach(extractBody);
            }
          };

          if (messageData.data.payload) {
            extractBody(messageData.data.payload);
          }

          // Save email to database
          const newEmail = await prisma.email.create({
            data: {
              accountId: accountId,
              messageId: message.id,
              threadId: message.threadId || '',
              subject,
              from: from,
              to: to,
              receivedAt: date ? new Date(date) : new Date(),
              body: bodyText || htmlBody,
              isRead: false,
              isStarred: false,
            },
          });

          console.log(`Synced email: ${subject}`);

          // Trigger agents for this new email
          await this.agentRunner.triggerAgentsForEmail(newEmail);
        } catch (error) {
          console.error(`Error syncing message ${message.id}:`, error);
        }
      }

      // Update last sync time
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { lastSyncAt: new Date() },
      });

      console.log(`Sync completed for account ${accountId}`);
    } catch (error) {
      console.error(`Error syncing account ${accountId}:`, error);
    }
  }

  async syncAllActiveAccounts() {
    const activeAccounts = await prisma.emailAccount.findMany({
      where: { isActive: true },
    });

    console.log(`Syncing ${activeAccounts.length} active accounts`);

    for (const account of activeAccounts) {
      await this.syncAccount(account.id);
    }
  }
}
