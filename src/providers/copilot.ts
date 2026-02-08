import { CopilotClient, defineTool } from "@github/copilot-sdk";
import {
  AIAgent,
  AIProvider,
  AIResponse,
  Tool,
  ToolCall,
} from "./base.js";

export class CopilotProvider implements AIProvider {
  name = "Copilot";
  private client: CopilotClient;
  private session: any;

  constructor(private token: string) {
    this.client = new CopilotClient({ githubToken: token });
  }

  async initialize(): Promise<void> {
    await this.client.start();
  }

  async createSession(options: {
    model: string;
    systemMessage: string;
    tools: Tool[];
  }): Promise<AIAgent> {
    // Convertir tools genéricas a formato Copilot
    const copilotTools = options.tools.map((tool) =>
      defineTool(tool.name, {
        description: tool.description,
        parameters: tool.parameters,
        handler: tool.handler,
      })
    );

    this.session = await this.client.createSession({
      model: options.model,
      systemMessage: { mode: "replace", content: options.systemMessage },
      tools: copilotTools,
    });

    return new CopilotAgent(this.session);
  }

  async destroy(): Promise<void> {
    await this.client.stop();
  }
}

class CopilotAgent implements AIAgent {
  constructor(private session: any) {}

  async sendMessage(prompt: string): Promise<AIResponse> {
    const event = await this.session.sendAndWait({ prompt }, 300000);

    if (event && event.type === "assistant.message") {
      return {
        content: event.data.content,
      };
    }

    return { content: "" };
  }

  async destroy(): Promise<void> {
    await this.session.destroy();
  }
}
