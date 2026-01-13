import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Plus, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string | null;
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
}

interface EmailStats {
  last24Hours: number;
  totalEmails: number;
  mostRecentEmailDate?: string;
}

export function Home() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [stats, setStats] = useState<EmailStats>({ last24Hours: 0, totalEmails: 0 });
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadAccounts();
    loadStats();
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
      setLoadingAccounts(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats/emails');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAddAccount = () => {
    navigate('/email-account');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome to Emailagent</h1>
        <p className="text-muted-foreground">Manage your email accounts and agents from one place</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              My Accounts
            </CardTitle>
            <CardDescription>Your connected email accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAccounts ? (
              <p className="text-muted-foreground">Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">No email accounts connected yet.</p>
                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Email Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {account.displayName || account.emailAddress}
                        </p>
                        {account.displayName && (
                          <p className="text-xs text-muted-foreground">{account.emailAddress}</p>
                        )}
                      </div>
                    </div>
                    {account.isActive && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Account
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stats
            </CardTitle>
            <CardDescription>Your email activity</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <p className="text-muted-foreground">Loading stats...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 24 hours</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.last24Hours}</p>
                  </div>
                  <Mail className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {stats.last24Hours === 0
                      ? 'No emails received in the last 24 hours'
                      : stats.last24Hours === 1
                      ? '1 email received in the last 24 hours'
                      : `${stats.last24Hours} emails received in the last 24 hours`}
                  </p>
                  {stats.totalEmails > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Total: {stats.totalEmails} {stats.totalEmails === 1 ? 'email' : 'emails'}
                    </p>
                  )}
                  {stats.mostRecentEmailDate && stats.last24Hours === 0 && stats.totalEmails > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Most recent: {new Date(stats.mostRecentEmailDate).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
