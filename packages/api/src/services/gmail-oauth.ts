import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GmailOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Gmail OAuth credentials not configured in environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to always get refresh token
    });
  }

  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };
  }

  async getUserInfo(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email || '',
      displayName: data.name || '',
    };
  }

  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      accessToken: credentials.access_token,
      tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    };
  }

  getOAuth2Client(accessToken: string, refreshToken?: string): OAuth2Client {
    const client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return client;
  }
}
