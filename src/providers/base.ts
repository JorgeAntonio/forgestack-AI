export interface Tool {
  name: string;
  description: string;
  parameters: any;
  handler: (args: any) => Promise<any>;
}

export interface AIProvider {
  name: string;
  initialize(): Promise<void>;
  createSession(options: {
    model: string;
    systemMessage: string;
    tools: Tool[];
  }): Promise<AIAgent>;
  destroy(): Promise<void>;
}

export interface AIAgent {
  sendMessage(prompt: string): Promise<AIResponse>;
  destroy(): Promise<void>;
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  toolName: string;
  arguments: any;
}
