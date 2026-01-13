export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

// Export only types for use in both client and server
// These are TypeScript types only and won't cause runtime issues in browser
export type { EmailAccount, Email, EmailAttachment, EmailProvider } from './generated/prisma';
