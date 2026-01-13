# Gmail OAuth Setup Guide

This guide will help you set up Gmail OAuth authentication for the mailagent application.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Node.js and pnpm installed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "MailAgent")
4. Click "Create"

## Step 2: Enable Gmail API

1. In the Google Cloud Console, select your project
2. Navigate to "APIs & Services" → "Library"
3. Search for "Gmail API"
4. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required fields:
   - App name: `MailAgent`
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
8. Click "Update" then "Save and Continue"
9. On "Test users", add your Gmail account as a test user
10. Click "Save and Continue"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application" as the application type
4. Name it (e.g., "MailAgent Web Client")
5. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/auth/gmail/callback
   ```
6. Click "Create"
7. Save the **Client ID** and **Client Secret** (you'll need these next)

## Step 5: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```env
   DATABASE_URL="file:./dev.db"

   GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GMAIL_CLIENT_SECRET="your-client-secret"
   GMAIL_REDIRECT_URI="http://localhost:3000/auth/gmail/callback"

   API_PORT=3000
   FRONTEND_URL="http://localhost:5173"
   ```

## Step 6: Run Database Migrations

Initialize the database:

```bash
# From the root directory
cd packages/core
pnpm prisma migrate deploy
```

## Step 7: Start the Application

1. Start the API server:
   ```bash
   cd packages/api
   pnpm dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd packages/webapp
   pnpm dev
   ```

## Step 8: Connect Your Gmail Account

1. Open your browser and navigate to `http://localhost:5173`
2. Click on "Email Account" in the sidebar
3. Click "Connect Gmail Account"
4. You'll be redirected to Google's OAuth consent screen
5. Sign in with your Google account
6. Grant the requested permissions
7. You'll be redirected back to the application
8. Your Gmail account should now be connected and syncing!

## How Email Sync Works

- The backend polls for new emails **every 1 minute**
- Only emails from the last 7 days are fetched on first sync
- Subsequent syncs fetch only new emails since the last sync
- OAuth tokens are automatically refreshed when they expire

## Troubleshooting

### "Gmail OAuth credentials not configured" error

Make sure your `.env` file exists in the root directory and contains valid credentials.

### "redirect_uri_mismatch" error

Ensure the redirect URI in your `.env` file exactly matches the one configured in Google Cloud Console:
- `.env`: `http://localhost:3000/auth/gmail/callback`
- Google Cloud Console: `http://localhost:3000/auth/gmail/callback`

### No emails showing up

1. Check that your account is active in the Email Accounts page
2. Wait up to 1 minute for the first sync to complete
3. Check the API server logs for any errors

### OAuth consent screen shows "This app isn't verified"

This is normal for apps in testing mode. Click "Advanced" → "Go to MailAgent (unsafe)" to continue.

## Security Notes

⚠️ **Important**: In production, you should:

1. Encrypt OAuth tokens before storing in the database
2. Use HTTPS for all OAuth redirects
3. Store client secrets securely (e.g., using environment variables, not in code)
4. Implement proper error handling and logging
5. Add rate limiting to API endpoints
6. Use a production-ready database (PostgreSQL, MySQL) instead of SQLite

## API Endpoints

### OAuth Endpoints
- `GET /auth/gmail` - Initiates Gmail OAuth flow
- `GET /auth/gmail/callback` - OAuth callback handler

### Email Endpoints
- `GET /email-accounts` - List all email accounts
- `GET /email-accounts/:id` - Get account details
- `GET /email-accounts/:id/emails` - Get emails for an account
- `GET /emails/:id` - Get specific email with attachments
- `PATCH /emails/:id/read` - Mark email as read/unread

## Next Steps

- Add email sending functionality
- Implement email search and filtering
- Add support for other email providers (Outlook, etc.)
- Build AI agents to process emails
- Add attachment download functionality
