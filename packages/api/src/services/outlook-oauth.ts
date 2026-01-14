import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';

export class OutlookOAuthService {
  private msalConfig: Configuration;
  private pca: ConfidentialClientApplication;

  constructor() {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const tenantId = process.env.OUTLOOK_TENANT_ID || 'common';
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Outlook OAuth credentials not configured in environment variables');
    }

    this.msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
    };

    this.pca = new ConfidentialClientApplication(this.msalConfig);
  }

  getAuthUrl(): string {
    const scopes = [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/User.Read',
      'offline_access',
    ];

    const redirectUri = process.env.OUTLOOK_REDIRECT_URI!;

    const authCodeUrlParameters = {
      scopes,
      redirectUri,
      responseMode: 'query' as const,
      prompt: 'consent' as const, // Force consent to always get refresh token
    };

    return this.pca.getAuthCodeUrl(authCodeUrlParameters).then(url => url);
  }

  async exchangeCodeForTokens(code: string) {
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI!;

    const tokenRequest = {
      code,
      scopes: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
      ],
      redirectUri,
    };

    const response = await this.pca.acquireTokenByCode(tokenRequest);

    if (!response || !response.accessToken) {
      throw new Error('No access token received');
    }

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || null,
      tokenExpiry: response.expiresOn ? new Date(response.expiresOn) : null,
    };
  }

  async getUserInfo(accessToken: string) {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();

    return {
      email: data.mail || data.userPrincipalName || '',
      displayName: data.displayName || '',
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenRequest = {
      refreshToken,
      scopes: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
      ],
    };

    const response = await this.pca.acquireTokenByRefreshToken(tokenRequest);

    if (!response || !response.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    return {
      accessToken: response.accessToken,
      tokenExpiry: response.expiresOn ? new Date(response.expiresOn) : null,
    };
  }
}
