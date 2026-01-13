import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function Agents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Agents</h1>
        <p className="text-muted-foreground">Manage your email agents and automation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Agents</CardTitle>
          <CardDescription>Configure and monitor your email agents</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No agents configured yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
