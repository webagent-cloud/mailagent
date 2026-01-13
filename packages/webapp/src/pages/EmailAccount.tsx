import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function EmailAccount() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Email Account</h1>
        <p className="text-muted-foreground">Manage your email accounts and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Accounts</CardTitle>
          <CardDescription>Configure and manage your email accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No email accounts configured yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
