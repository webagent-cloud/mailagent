import { prisma } from '@webagent/core/db';
import { OutlookOAuthService } from './outlook-oauth';

interface OutlookEmailAddress {
  name?: string;
  address?: string;
}

interface OutlookMessage {
  id?: string;
  conversationId?: string;
  subject?: string;
  from?: { emailAddress?: OutlookEmailAddress };
  toRecipients?: Array<{ emailAddress?: OutlookEmailAddress }>;
  receivedDateTime?: string;
  body?: { content?: string };
  isRead?: boolean;
}

export class OutlookSyncService {
  private outlookOAuth: OutlookOAuthService;

  constructor() {
    this.outlookOAuth = new OutlookOAuthService();
  }

  private async refreshToken(accountId: string, refreshToken: string) {
    console.log(`Refreshing token for Outlook account ${accountId}`);
    const refreshed = await this.outlookOAuth.refreshAccessToken(refreshToken);

    await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        accessToken: refreshed.accessToken,
        tokenExpiry: refreshed.tokenExpiry,
        ...(refreshed.refreshToken && { refreshToken: refreshed.refreshToken }),
      },
    });

    return refreshed.accessToken;
  }

  private async fetchMessages(accessToken: string, lastSyncAt: Date): Promise<OutlookMessage[]> {
    const filterDate = lastSyncAt.toISOString();
    const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${filterDate}&$top=50&$orderby=receivedDateTime desc&$select=id,conversationId,subject,from,toRecipients,receivedDateTime,body,isRead`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(responseText) as { error?: { message?: string } };
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Response was not JSON, use status text
      }
      const error = new Error(`Graph API error (${response.status}): ${errorMessage}`);
      (error as any).status = response.status;
      throw error;
    }

    const data = JSON.parse(responseText) as { value?: OutlookMessage[] };
    return data.value || [];
  }

  async syncAccount(accountId: string) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.isActive) {
      console.log(`Account ${accountId} not found or inactive`);
      return;
    }

    if (account.authError) {
      console.log(`Account ${accountId} has auth error, skipping sync. User needs to re-authenticate.`);
      return;
    }

    if (!account.refreshToken) {
      console.error(`No refresh token for Outlook account ${accountId}`);
      return;
    }

    try {
      let accessToken = account.accessToken;
      const lastSyncAt = account.lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Check if token needs refresh
      const tokenExpired = !account.tokenExpiry || new Date() >= account.tokenExpiry;
      if (tokenExpired) {
        accessToken = await this.refreshToken(accountId, account.refreshToken);
      }

      let messages: OutlookMessage[];
      try {
        messages = await this.fetchMessages(accessToken, lastSyncAt);
      } catch (error: any) {
        // If 401, try refreshing token and retry once
        if (error.status === 401) {
          console.log(`Got 401, refreshing token and retrying for account ${accountId}`);
          try {
            accessToken = await this.refreshToken(accountId, account.refreshToken);
            messages = await this.fetchMessages(accessToken, lastSyncAt);
          } catch (retryError: any) {
            // Token refresh failed or retry still got 401 - mark account as needing re-auth
            const errorMessage = retryError.message || 'Authentication failed';
            console.error(`Auth failed for account ${accountId}, marking for re-authentication: ${errorMessage}`);
            await prisma.emailAccount.update({
              where: { id: accountId },
              data: { authError: errorMessage },
            });
            return;
          }
        } else {
          throw error;
        }
      }

      console.log(`Found ${messages.length} new messages for Outlook account ${accountId}`);

      // Process each message
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
          // Extract sender email
          const fromAddress = message.from?.emailAddress;
          const from = fromAddress
            ? fromAddress.name
              ? `${fromAddress.name} <${fromAddress.address}>`
              : fromAddress.address || ''
            : '';

          // Extract recipients
          const toRecipients = message.toRecipients || [];
          const to = toRecipients
            .map((r) => {
              const addr = r.emailAddress;
              return addr?.name ? `${addr.name} <${addr.address}>` : addr?.address || '';
            })
            .filter(Boolean)
            .join(', ');

          // Extract body
          const body = message.body?.content || '';

          // Save email to database
          await prisma.email.create({
            data: {
              accountId: accountId,
              messageId: message.id,
              threadId: message.conversationId || '',
              subject: message.subject || '',
              from: from,
              to: to,
              receivedAt: message.receivedDateTime ? new Date(message.receivedDateTime) : new Date(),
              body: body,
              isRead: message.isRead || false,
              isStarred: false,
            },
          });

          console.log(`Synced Outlook email: ${message.subject}`);
        } catch (error) {
          console.error(`Error syncing Outlook message ${message.id}:`, error);
        }
      }

      // Update last sync time
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { lastSyncAt: new Date() },
      });

      console.log(`Sync completed for Outlook account ${accountId}`);
    } catch (error) {
      console.error(`Error syncing Outlook account ${accountId}:`, error);
    }
  }
}
