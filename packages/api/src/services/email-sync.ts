import { prisma } from '@webagent/core/db';
import { EmailProvider } from '@webagent/core';
import { GmailSyncService } from './gmail-sync';
import { OutlookSyncService } from './outlook-sync';

export class EmailSyncService {
  private gmailSync: GmailSyncService;
  private outlookSync: OutlookSyncService;

  constructor() {
    this.gmailSync = new GmailSyncService();
    this.outlookSync = new OutlookSyncService();
  }

  async syncAccount(accountId: string) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
      select: { id: true, provider: true },
    });

    if (!account) {
      console.log(`Account ${accountId} not found`);
      return;
    }

    switch (account.provider) {
      case EmailProvider.GMAIL:
        return this.gmailSync.syncAccount(accountId);
      case EmailProvider.OUTLOOK:
        return this.outlookSync.syncAccount(accountId);
      default:
        console.error(`Unknown provider for account ${accountId}: ${account.provider}`);
    }
  }

  async syncAllActiveAccounts() {
    const activeAccounts = await prisma.emailAccount.findMany({
      where: { isActive: true },
      select: { id: true, provider: true },
    });

    console.log(`Syncing ${activeAccounts.length} active accounts`);

    for (const account of activeAccounts) {
      await this.syncAccount(account.id);
    }
  }
}
