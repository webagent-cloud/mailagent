export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

// Export only types for use in both client and server
// These are TypeScript types only and won't cause runtime issues in browser
export type { EmailAccount, Email, EmailAttachment } from './generated/prisma';
// Export EmailProvider as both type and value (it's an enum)
export { EmailProvider } from './generated/prisma';
