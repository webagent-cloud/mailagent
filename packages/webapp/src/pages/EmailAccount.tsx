import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

interface EmailAccount {
  id: number;
  emailAddress: string;
  displayName: string;
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
}

export function EmailAccount() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for OAuth callback messages
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success) {
      setMessage({ type: 'success', text: 'Email account connected successfully!' });
      // Clear URL params
      window.history.replaceState({}, '', '/email-account');
    } else if (error) {
      setMessage({ type: 'error', text: `Failed to connect account: ${error}` });
      // Clear URL params
      window.history.replaceState({}, '', '/email-account');
    }

    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/email-accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const response = await fetch('/api/auth/gmail');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate Gmail OAuth:', error);
      setMessage({ type: 'error', text: 'Failed to connect Gmail account' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Email Accounts</h1>
        <p className="text-muted-foreground">Manage your email accounts and settings</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Email accounts that are actively syncing</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <p className="text-muted-foreground">No email accounts connected yet.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{account.displayName}</p>
                      <p className="text-sm text-muted-foreground">{account.emailAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.isActive ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Email Account</CardTitle>
          <CardDescription>Connect a new email account to start syncing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <button
              onClick={handleConnectGmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Connect Gmail Account
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
