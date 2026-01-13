# Email Handler Database Schema

This document describes the Prisma database schema for email handling functionality with Gmail and Outlook integration.

## Database

The application uses SQLite for local development and storage. The database file is located at `./dev.db`.

## Tables

### EmailAccount

Stores configuration and credentials for Gmail and Outlook email accounts.

**Purpose**: This table manages OAuth2 credentials and connection settings needed to fetch emails from email provider APIs.

**Fields**:
- `id` (String, UUID): Primary key
- `createdAt` (DateTime): Timestamp when the account was added
- `updatedAt` (DateTime): Timestamp of last update
- `emailAddress` (String, Unique): The email address of the account
- `displayName` (String, Optional): Display name for the account
- `provider` (EmailProvider Enum): Either `GMAIL` or `OUTLOOK`
- `accessToken` (String): OAuth2 access token (should be encrypted)
- `refreshToken` (String): OAuth2 refresh token (should be encrypted)
- `tokenExpiry` (DateTime, Optional): When the access token expires
- `clientId` (String, Optional): OAuth2 client ID
- `clientSecret` (String, Optional): OAuth2 client secret (should be encrypted)
- `tenantId` (String, Optional): Microsoft/Outlook tenant ID
- `isActive` (Boolean): Whether to actively sync this account (default: true)
- `lastSyncAt` (DateTime, Optional): Last time emails were fetched
- `syncInterval` (Int): How often to sync in seconds (default: 300 = 5 minutes)
- `metadata` (String, Optional): JSON string for additional provider-specific data

**Indexes**:
- Unique index on `emailAddress`
- Index on `provider`
- Index on `isActive`

**Relations**:
- One-to-many with `Email` table

### Email

Stores email messages fetched from email accounts.

**Fields**:
- `id` (String, UUID): Primary key
- `createdAt` (DateTime): Timestamp when the email was stored
- `updatedAt` (DateTime): Timestamp of last update
- `accountId` (String, Foreign Key): References EmailAccount.id
- `messageId` (String, Unique): Provider's unique message identifier
- `threadId` (String, Optional): Thread/conversation identifier
- `subject` (String): Email subject line
- `from` (String): Sender email address
- `to` (String): JSON array of recipient email addresses
- `cc` (String, Optional): JSON array of CC recipient email addresses
- `bcc` (String, Optional): JSON array of BCC recipient email addresses
- `body` (String): Email body content (HTML or plain text)
- `bodyPreview` (String, Optional): Short preview text of the body
- `receivedAt` (DateTime): When the email was received
- `isRead` (Boolean): Read status (default: false)
- `isStarred` (Boolean): Starred/flagged status (default: false)
- `hasAttachments` (Boolean): Whether email has attachments (default: false)
- `labels` (String, Optional): JSON array of labels/categories
- `metadata` (String, Optional): JSON string for additional provider-specific data

**Indexes**:
- Unique index on `messageId`
- Index on `accountId`
- Index on `receivedAt`
- Index on `isRead`

**Relations**:
- Many-to-one with `EmailAccount`
- One-to-many with `EmailAttachment`

**Cascade Deletes**: When an EmailAccount is deleted, all associated emails are automatically deleted.

### EmailAttachment

Stores information about email attachments.

**Fields**:
- `id` (String, UUID): Primary key
- `createdAt` (DateTime): Timestamp when the attachment record was created
- `emailId` (String, Foreign Key): References Email.id
- `filename` (String): Original filename of the attachment
- `mimeType` (String): MIME type of the file
- `size` (Int): File size in bytes
- `contentId` (String, Optional): Content ID for inline attachments
- `storagePath` (String, Optional): Local path where file is stored (if downloaded)
- `attachmentId` (String): Provider's attachment identifier
- `metadata` (String, Optional): JSON string for additional provider-specific data

**Indexes**:
- Index on `emailId`

**Relations**:
- Many-to-one with `Email`

**Cascade Deletes**: When an Email is deleted, all associated attachments are automatically deleted.

## Enums

### EmailProvider

Valid values:
- `GMAIL`: Google Gmail accounts
- `OUTLOOK`: Microsoft Outlook/Office 365 accounts

## Security Considerations

1. **Token Encryption**: The `accessToken`, `refreshToken`, and `clientSecret` fields should be encrypted before storing in the database.

2. **Environment Variables**: Sensitive encryption keys should be stored in environment variables, not in the code.

3. **Access Control**: Implement proper authentication and authorization to ensure users can only access their own email accounts.

## Usage

### Setting up the Database

```bash
# Install dependencies
pnpm add prisma @prisma/client dotenv

# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

### Accessing the Database

**IMPORTANT**: The Prisma Client can only be used in server-side code (Node.js). It cannot run in the browser.

#### For Server-Side Code (API/Backend)

```typescript
// Import the singleton Prisma Client instance from @webagent/core/db
import { prisma } from '@webagent/core/db';

// Create an email account
const account = await prisma.emailAccount.create({
  data: {
    emailAddress: 'user@gmail.com',
    provider: 'GMAIL',
    accessToken: 'encrypted_token',
    refreshToken: 'encrypted_token',
    // ... other fields
  }
});

// Fetch emails for an account
const emails = await prisma.email.findMany({
  where: {
    accountId: account.id,
    isRead: false
  },
  include: {
    attachments: true
  }
});
```

#### For Client-Side Code (Browser/Frontend)

```typescript
// Import only the TypeScript types (no runtime code)
import type { EmailAccount, Email, EmailAttachment, EmailProvider } from '@webagent/core';

// Use these types for type-safety in your client code
const account: EmailAccount = {
  id: '123',
  emailAddress: 'user@gmail.com',
  provider: 'GMAIL',
  // ... other fields
};
```

## Migrations

Migrations are stored in `./prisma/migrations/`. The initial migration is:
- `20260113160402_init_email_accounts`: Creates the initial schema with EmailAccount, Email, and EmailAttachment tables.

## Development Tools

### Prisma Studio

To explore the database visually:

```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can view and edit data.

## Future Enhancements

Potential future schema additions:
- Email folders/labels table
- Email rules/filters table
- Email templates table
- Scheduled email sending table
- Email analytics/tracking table
