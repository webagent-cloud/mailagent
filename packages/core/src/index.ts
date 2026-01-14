export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

// Export only types for use in both client and server
// These are TypeScript types only and won't cause runtime issues in browser
export type { EmailAccount, Email, EmailAttachment, Agent, AgentRun, AgentEmailAccount } from './generated/prisma';
// Export enums as both type and value
export { EmailProvider, AgentTriggerType, AgentResponseFormat, AgentRunStatus } from './generated/prisma';
