import { useState, useEffect } from 'react';
import { Select } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName: string;
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
}

interface Email {
  id: string;
  subject: string;
  from: string;
  bodyPreview: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
}

export default function Inbox() {
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmailAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchEmails(selectedAccount);
    }
  }, [selectedAccount]);

  const fetchEmailAccounts = async () => {
    try {
      const response = await fetch('/api/email-accounts');
      if (!response.ok) throw new Error('Failed to fetch email accounts');
      const data = await response.json();
      setEmailAccounts(data);
      if (data.length > 0) {
        setSelectedAccount(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchEmails = async (accountId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/email-accounts/${accountId}/emails`);
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>
                View and manage your emails
              </CardDescription>
            </div>
            <div className="w-64">
              <Select
                id="account-select"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={emailAccounts.length === 0}
              >
                {emailAccounts.length === 0 ? (
                  <option value="">No email accounts configured</option>
                ) : (
                  emailAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.displayName} - {account.emailAddress}
                    </option>
                  ))
                )}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          {error && (
            <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading emails...
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedAccount ? 'No emails found' : 'Select an email account to view emails'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[250px]">From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[120px] text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow
                    key={email.id}
                    className={email.isRead ? '' : 'font-semibold bg-muted/30'}
                  >
                    <TableCell>
                      {email.isStarred && (
                        <span className="text-yellow-500">★</span>
                      )}
                      {!email.isRead && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {email.from}
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-md">
                        <span className={email.isRead ? '' : 'font-semibold'}>
                          {email.subject || '(No subject)'}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {email.bodyPreview && `- ${email.bodyPreview.substring(0, 100)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(email.receivedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
