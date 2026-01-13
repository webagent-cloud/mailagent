import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function Home() {
  const [message, setMessage] = useState<string>('');
  const [apiMessage, setApiMessage] = useState<string>('');

  useEffect(() => {
    setMessage('Hello, React!');

    fetch('/api/')
      .then(res => res.json())
      .then(data => setApiMessage(data.message))
      .catch(err => console.error('API Error:', err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome to Emailagent</h1>
        <p className="text-muted-foreground">Manage your email accounts and agents from one place</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Web Application</CardTitle>
            <CardDescription>Frontend status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{message || 'Loading...'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Connection</CardTitle>
            <CardDescription>Status from the backend API</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{apiMessage || 'Loading...'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
