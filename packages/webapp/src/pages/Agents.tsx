import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select } from '../components/ui/select';
import { Plus, Edit2, Trash2, Power, CheckCircle, XCircle, X } from 'lucide-react';

interface EmailAccount {
  id: string;
  emailAddress: string;
  displayName?: string;
  provider: string;
  isActive: boolean;
}

interface Agent {
  id: string;
  name: string;
  trigger: string;
  triggerType: 'ON_EACH_EMAIL' | 'TRIGGER_MANUALLY';
  prompt: string;
  responseFormat: 'STRING' | 'JSON' | 'JSON_SCHEMA';
  jsonSchema?: string;
  webhookUrl?: string;
  shouldExtractFiles: boolean;
  extractFileConfig?: string;
  model: string;
  modelProvider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  emailAccounts?: {
    id: string;
    emailAccount: EmailAccount;
  }[];
}

interface AgentFormData {
  trigger: 'ON_EACH_EMAIL' | 'WEBHOOK';
  prompt: string;
  responseFormat: 'STRING' | 'JSON' | 'JSON_SCHEMA';
  jsonSchema: string;
  webhookUrl: string;
  shouldExtractFiles: boolean;
  extractFileConfig: string;
  model: string;
  modelProvider: string;
  emailAccountIds: string[];
}

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<AgentFormData>({
    trigger: 'ON_EACH_EMAIL',
    prompt: '',
    responseFormat: 'STRING',
    jsonSchema: '',
    webhookUrl: '',
    shouldExtractFiles: false,
    extractFileConfig: '',
    model: 'gpt-4',
    modelProvider: 'openai',
    emailAccountIds: []
  });

  useEffect(() => {
    loadAgents();
    loadEmailAccounts();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      setMessage({ type: 'error', text: 'Failed to load agents' });
    } finally {
      setLoading(false);
    }
  };

  const loadEmailAccounts = async () => {
    try {
      const response = await fetch('/api/email-accounts');
      if (response.ok) {
        const data = await response.json();
        setEmailAccounts(data || []);
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      trigger: 'ON_EACH_EMAIL',
      prompt: '',
      responseFormat: 'STRING',
      jsonSchema: '',
      webhookUrl: '',
      shouldExtractFiles: false,
      extractFileConfig: '',
      model: 'gpt-4',
      modelProvider: 'openai',
      emailAccountIds: []
    });
    setEditingAgent(null);
    setShowForm(false);
  };

  const handleCreateAgent = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setFormData({
      trigger: agent.triggerType as 'ON_EACH_EMAIL' | 'WEBHOOK',
      prompt: agent.prompt,
      responseFormat: agent.responseFormat,
      jsonSchema: agent.jsonSchema || '',
      webhookUrl: agent.webhookUrl || '',
      shouldExtractFiles: agent.shouldExtractFiles,
      extractFileConfig: agent.extractFileConfig || '',
      model: agent.model,
      modelProvider: agent.modelProvider,
      emailAccountIds: agent.emailAccounts?.map(ea => ea.emailAccount.id) || []
    });
    setEditingAgent(agent);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAgent ? `/api/agents/${editingAgent.id}` : '/api/agents';
      const method = editingAgent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          jsonSchema: formData.jsonSchema || undefined,
          webhookUrl: formData.webhookUrl || undefined,
          extractFileConfig: formData.extractFileConfig || undefined,
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingAgent ? 'Agent updated successfully' : 'Agent created successfully'
        });
        resetForm();
        loadAgents();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save agent' });
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
      setMessage({ type: 'error', text: 'Failed to save agent' });
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Agent deleted successfully' });
        loadAgents();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete agent' });
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
      setMessage({ type: 'error', text: 'Failed to delete agent' });
    }
  };

  const handleToggleAgent = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/toggle`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Agent status updated' });
        loadAgents();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to toggle agent' });
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
      setMessage({ type: 'error', text: 'Failed to toggle agent' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Agents</h1>
          <p className="text-muted-foreground">Manage your email agents and automation</p>
        </div>
        {!showForm && (
          <Button onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        )}
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
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showForm ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{editingAgent ? 'Edit Agent' : 'Create New Agent'}</CardTitle>
                <CardDescription>
                  Configure your agent's behavior and settings
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger">Trigger *</Label>
                  <Select
                    id="trigger"
                    value={formData.trigger}
                    onChange={(e) => setFormData({ ...formData, trigger: e.target.value as 'ON_EACH_EMAIL' | 'WEBHOOK' })}
                  >
                    <option value="ON_EACH_EMAIL">On each mail</option>
                    <option value="WEBHOOK">Webhook</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseFormat">Response Format *</Label>
                  <Select
                    id="responseFormat"
                    value={formData.responseFormat}
                    onChange={(e) => setFormData({ ...formData, responseFormat: e.target.value as 'STRING' | 'JSON' | 'JSON_SCHEMA' })}
                  >
                    <option value="STRING">String</option>
                    <option value="JSON">JSON</option>
                    <option value="JSON_SCHEMA">JSON Schema</option>
                  </Select>
                </div>
              </div>

              {formData.responseFormat === 'JSON_SCHEMA' && (
                <div className="space-y-2">
                  <Label htmlFor="jsonSchema">JSON Schema</Label>
                  <Textarea
                    id="jsonSchema"
                    value={formData.jsonSchema}
                    onChange={(e) => setFormData({ ...formData, jsonSchema: e.target.value })}
                    placeholder='{"type": "object", "properties": {...}}'
                    rows={4}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Enter the prompt for your agent..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://your-webhook-endpoint.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Select
                  id="model"
                  value={`${formData.modelProvider}/${formData.model}`}
                  onChange={(e) => {
                    const [provider, model] = e.target.value.split('/');
                    setFormData({ ...formData, modelProvider: provider, model });
                  }}
                >
                  <option value="openai/gpt-4">OpenAI - GPT-4</option>
                  <option value="openai/gpt-4-turbo">OpenAI - GPT-4 Turbo</option>
                  <option value="openai/gpt-3.5-turbo">OpenAI - GPT-3.5 Turbo</option>
                  <option value="anthropic/claude-3-opus">Anthropic - Claude 3 Opus</option>
                  <option value="anthropic/claude-3-sonnet">Anthropic - Claude 3 Sonnet</option>
                  <option value="anthropic/claude-3-haiku">Anthropic - Claude 3 Haiku</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email Accounts</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {emailAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No email accounts available. Please connect an email account first.</p>
                  ) : (
                    emailAccounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`email-${account.id}`}
                          checked={formData.emailAccountIds.includes(account.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData({
                              ...formData,
                              emailAccountIds: checked
                                ? [...formData.emailAccountIds, account.id]
                                : formData.emailAccountIds.filter(id => id !== account.id)
                            });
                          }}
                        />
                        <Label htmlFor={`email-${account.id}`} className="font-normal cursor-pointer flex-1">
                          <div className="flex items-center justify-between">
                            <span>{account.emailAddress}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {account.provider}
                              {!account.isActive && ' (inactive)'}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Select which email accounts this agent should monitor</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shouldExtractFiles"
                    checked={formData.shouldExtractFiles}
                    onChange={(e) => setFormData({ ...formData, shouldExtractFiles: e.target.checked })}
                  />
                  <Label htmlFor="shouldExtractFiles">Extract Files from Emails</Label>
                </div>

                {formData.shouldExtractFiles && (
                  <div className="space-y-2">
                    <Label htmlFor="extractFileConfig">File Extraction Config (JSON)</Label>
                    <Textarea
                      id="extractFileConfig"
                      value={formData.extractFileConfig}
                      onChange={(e) => setFormData({ ...formData, extractFileConfig: e.target.value })}
                      placeholder='{"fileTypes": ["pdf", "xlsx"], "maxSize": 10485760}'
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Agents</CardTitle>
            <CardDescription>Configure and monitor your email agents</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading agents...</p>
            ) : agents.length === 0 ? (
              <p className="text-muted-foreground">No agents configured yet. Click "Create Agent" to get started.</p>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{agent.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            agent.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Trigger: {agent.trigger} | Type: {agent.triggerType.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAgent(agent.id)}
                          title={agent.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className={`h-4 w-4 ${agent.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgent(agent)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAgent(agent.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Response Format:</span> {agent.responseFormat}
                      </div>
                      <div>
                        <span className="font-medium">Model:</span> {agent.modelProvider}/{agent.model}
                      </div>
                      {agent.webhookUrl && (
                        <div>
                          <span className="font-medium">Webhook:</span> {agent.webhookUrl}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Extract Files:</span> {agent.shouldExtractFiles ? 'Yes' : 'No'}
                      </div>
                      {agent.emailAccounts && agent.emailAccounts.length > 0 && (
                        <div>
                          <span className="font-medium">Email Accounts:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {agent.emailAccounts.map((ea) => (
                              <span
                                key={ea.id}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {ea.emailAccount.emailAddress}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <span className="font-medium">Prompt:</span>
                        <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{agent.prompt}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
