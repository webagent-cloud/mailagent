import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { prisma } from '@webagent/core/db';
import { AgentTriggerType, AgentRunStatus } from '@webagent/core';
import type { Agent, Email } from '@webagent/core';

type ProviderModel = ReturnType<ReturnType<typeof createOpenAI>> | ReturnType<ReturnType<typeof createAnthropic>> | ReturnType<ReturnType<typeof createGoogleGenerativeAI>>;

function getAIModel(provider: string, modelName: string): ProviderModel {
  switch (provider.toLowerCase()) {
    case 'openai': {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(modelName);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(modelName);
    }
    case 'gemini':
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
      });
      return google(modelName);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function buildPromptWithEmail(agent: Agent, email: Email): string {
  const emailContent = `
--- EMAIL ---
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${email.receivedAt.toISOString()}

Body:
${email.body}
--- END EMAIL ---
`;

  return `${agent.prompt}

${emailContent}`;
}

export class AgentRunnerService {
  async runAgentForEmail(agent: Agent, email: Email): Promise<string> {
    // Create the agent run record
    const agentRun = await prisma.agentRun.create({
      data: {
        agentId: agent.id,
        emailId: email.id,
        name: agent.name,
        trigger: agent.trigger,
        triggerType: agent.triggerType,
        prompt: agent.prompt,
        responseFormat: agent.responseFormat,
        jsonSchema: agent.jsonSchema,
        webhookUrl: agent.webhookUrl,
        shouldExtractFiles: agent.shouldExtractFiles,
        extractFileConfig: agent.extractFileConfig,
        model: agent.model,
        modelProvider: agent.modelProvider,
        status: AgentRunStatus.RUNNING,
      },
    });

    try {
      const model = getAIModel(agent.modelProvider, agent.model);
      const prompt = buildPromptWithEmail(agent, email);

      console.log(`Running agent "${agent.name}" for email "${email.subject}"`);

      const { text } = await generateText({
        model,
        prompt,
      });

      // Update the agent run with success
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: AgentRunStatus.SUCCESS,
          results: text,
        },
      });

      console.log(`Agent "${agent.name}" completed successfully for email "${email.subject}"`);
      return agentRun.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Agent "${agent.name}" failed for email "${email.subject}":`, errorMessage);

      // Update the agent run with failure
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: AgentRunStatus.FAILED,
          error: errorMessage,
        },
      });

      return agentRun.id;
    }
  }

  async triggerAgentsForEmail(email: Email): Promise<void> {
    // Find all active agents with ON_EACH_EMAIL trigger that are linked to this email's account
    const agents = await prisma.agent.findMany({
      where: {
        isActive: true,
        triggerType: AgentTriggerType.ON_EACH_EMAIL,
        emailAccounts: {
          some: {
            emailAccountId: email.accountId,
          },
        },
      },
    });

    if (agents.length === 0) {
      return;
    }

    console.log(`Found ${agents.length} agents to trigger for email "${email.subject}"`);

    // Run all agents in parallel
    await Promise.all(agents.map((agent) => this.runAgentForEmail(agent, email)));
  }
}
