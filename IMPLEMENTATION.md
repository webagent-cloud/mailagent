# Email Account & Fetch Implementation

## Summary

Successfully implemented Gmail OAuth authentication and automatic email fetching functionality for the mailagent application.

## What Was Built

### 1. Backend Services

#### OAuth Authentication Service
- **File**: `packages/api/src/services/gmail-oauth.ts`
- **Features**:
  - Generate Gmail OAuth authorization URLs
  - Exchange authorization codes for access/refresh tokens
  - Retrieve user profile information
  - Automatic token refresh when expired
  - OAuth2 client management

#### Email Sync Service
- **File**: `packages/api/src/services/gmail-sync.ts`
- **Features**:
  - Fetch new emails from Gmail API
  - Parse email headers and body (plain text and HTML)
  - Store emails in database with metadata
  - Automatic token refresh during sync
  - Incremental sync (only fetch new emails)
  - Support for multiple email accounts

### 2. API Endpoints

#### Authentication Routes (`packages/api/src/routes/auth.ts`)
- `GET /auth/gmail` - Initiates OAuth flow, returns authorization URL
- `GET /auth/gmail/callback` - Handles OAuth callback, stores tokens, redirects to frontend

#### Email Account Routes (`packages/api/src/routes/email-accounts.ts`)
- `GET /email-accounts` - List all email accounts
- `GET /email-accounts/:id` - Get specific account details
- `GET /email-accounts/:id/emails` - Get emails for an account (with pagination)
- `POST /email-accounts/:id/sync` - Manually trigger sync for testing
- `GET /emails/:id` - Get specific email with attachments
- `PATCH /emails/:id/read` - Mark email as read/unread

### 3. Automatic Polling Mechanism

- **File**: `packages/api/src/index.ts`
- **Behavior**:
  - Polls for new emails every **60 seconds** (1 minute)
  - Initial sync starts 5 seconds after server start
  - Syncs all active email accounts automatically
  - Runs in background without blocking API requests
  - Error handling with logging

### 4. Frontend UI

#### Email Account Page (`packages/webapp/src/pages/EmailAccount.tsx`)
- **Features**:
  - Display connected email accounts with status
  - "Connect Gmail Account" button to initiate OAuth
  - Success/error message display after OAuth callback
  - Real-time account list updates
  - Account status indicators (Active/Inactive)
  - Last sync time display

### 5. Configuration

#### Environment Variables (`.env.example`)
```env
DATABASE_URL="file:./dev.db"
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/auth/gmail/callback"
API_PORT=3000
FRONTEND_URL="http://localhost:5173"
```

## Architecture Flow

### OAuth Flow
```
1. User clicks "Connect Gmail Account" in frontend
2. Frontend calls GET /api/auth/gmail
3. Backend returns Google OAuth authorization URL
4. Frontend redirects user to Google OAuth consent screen
5. User grants permissions
6. Google redirects to /auth/gmail/callback with code
7. Backend exchanges code for access/refresh tokens
8. Backend fetches user profile info
9. Backend stores account with tokens in database
10. Backend redirects to frontend with success message
```

### Email Sync Flow
```
1. Polling mechanism triggers every 60 seconds
2. Service fetches all active email accounts from database
3. For each account:
   a. Check if access token is expired
   b. Refresh token if needed
   c. Call Gmail API to list new messages
   d. Fetch full message details for each new message
   e. Parse headers, body, and attachments
   f. Store emails in database
   g. Update lastSyncAt timestamp
4. Log sync status and errors
```

## Key Features

✅ **Gmail OAuth 2.0 Integration**
- Secure OAuth flow with offline access
- Automatic token refresh

✅ **Automatic Email Polling**
- Every 1 minute sync interval
- Configurable per account
- Background processing

✅ **Multi-Account Support**
- Connect multiple Gmail accounts
- Independent sync for each account

✅ **Incremental Sync**
- Only fetch new emails since last sync
- Avoid duplicate emails

✅ **Full Email Data**
- Subject, from, to, date
- Plain text and HTML body
- Attachment metadata (ready for future download feature)

✅ **Frontend Integration**
- Clean UI for account management
- OAuth flow integration
- Success/error feedback

## Database Schema

### EmailAccount Model
- Stores OAuth credentials (access_token, refresh_token)
- Account metadata (email, display name, provider)
- Sync settings (interval, last sync time)
- Active status

### Email Model
- Message content (subject, body, HTML body)
- Metadata (message ID, thread ID, received date)
- Status flags (read, starred)
- Relationship to EmailAccount

### EmailAttachment Model
- Attachment metadata (filename, MIME type, size)
- Storage information
- Relationship to Email

## Security Considerations

⚠️ **Current Implementation**:
- Tokens stored as plain text in database
- Suitable for development/testing only

🔒 **Production Requirements**:
1. Encrypt access/refresh tokens before storing
2. Use HTTPS for all OAuth redirects
3. Store client secrets in secure vault (e.g., AWS Secrets Manager)
4. Implement rate limiting on API endpoints
5. Add authentication/authorization for API access
6. Use production database (PostgreSQL/MySQL)
7. Add audit logging for sensitive operations

## Testing Instructions

See `SETUP.md` for detailed setup and testing instructions.

### Quick Test
1. Set up Google Cloud OAuth credentials
2. Copy `.env.example` to `.env` and configure
3. Run database migrations: `cd packages/core && pnpm prisma migrate deploy`
4. Start API: `cd packages/api && pnpm dev`
5. Start frontend: `cd packages/webapp && pnpm dev`
6. Navigate to http://localhost:5173/email-account
7. Click "Connect Gmail Account"
8. Complete OAuth flow
9. Wait up to 1 minute for first sync
10. Check API logs to see sync activity

## API Usage Examples

### Initiate OAuth
```bash
curl http://localhost:3000/auth/gmail
# Returns: { "authUrl": "https://accounts.google.com/..." }
```

### List Email Accounts
```bash
curl http://localhost:3000/email-accounts
# Returns array of email accounts
```

### Get Emails for Account
```bash
curl http://localhost:3000/email-accounts/1/emails?limit=10
# Returns emails for account ID 1
```

### Manually Trigger Sync
```bash
curl -X POST http://localhost:3000/email-accounts/1/sync
# Returns: { "message": "Sync started", "accountId": "1" }
```

## Files Created/Modified

### New Files
- `packages/api/src/services/gmail-oauth.ts` - OAuth service
- `packages/api/src/services/gmail-sync.ts` - Email sync service
- `packages/api/src/routes/auth.ts` - Auth endpoints
- `.env.example` - Environment configuration template
- `SETUP.md` - Detailed setup guide
- `IMPLEMENTATION.md` - This file

### Modified Files
- `packages/api/src/index.ts` - Added dotenv, auth routes, polling mechanism
- `packages/api/src/routes/email-accounts.ts` - Added sync endpoint, fixed queries
- `packages/webapp/src/pages/EmailAccount.tsx` - Complete OAuth UI
- `packages/api/package.json` - Added googleapis and dotenv dependencies

## Next Steps

### Immediate Enhancements
- [ ] Add manual sync button in UI
- [ ] Display synced emails in frontend
- [ ] Add email detail view
- [ ] Show sync status/progress indicator

### Future Features
- [ ] Token encryption
- [ ] Email sending functionality
- [ ] Attachment download
- [ ] Email search and filtering
- [ ] Support for Microsoft Outlook/Office 365
- [ ] Real-time email notifications (WebSocket)
- [ ] Email categorization/labeling
- [ ] AI agent integration for email processing

## Troubleshooting

### Sync Not Working
- Check API server logs for errors
- Verify OAuth tokens are valid
- Ensure account is marked as active
- Check Gmail API quotas in Google Cloud Console

### OAuth Flow Fails
- Verify client ID and secret are correct
- Ensure redirect URI matches exactly
- Check that Gmail API is enabled
- Add your email as test user in OAuth consent screen

### No Emails Fetched
- Gmail API only fetches from last 7 days on first sync
- Ensure you have emails in your inbox within that timeframe
- Check that scopes include `gmail.readonly`

## Performance Notes

- Polling every 1 minute is suitable for development/testing
- For production, consider:
  - Adjustable sync intervals per account
  - Gmail push notifications (Pub/Sub) instead of polling
  - Rate limiting to avoid Gmail API quotas
  - Batch processing for accounts with high email volume

## Dependencies Added

```json
{
  "googleapis": "^170.0.0",
  "dotenv": "^17.2.3"
}
```
