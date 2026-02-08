import OpenAI from "openai";
import {
  AIAgent,
  AIProvider,
  AIResponse,
  Tool,
  ToolCall,
} from "./base.js";

export class DeepseekProvider implements AIProvider {
  name = "Deepseek";
  private client: OpenAI;
  private conversationHistory: any[] = [];
  private tools: Tool[] = [];
  private systemMessage: string = "";

  constructor(private apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com",
    });
  }

  async initialize(): Promise<void> {
    // Deepseek no requiere inicialización especial
  }

  async createSession(options: {
    model: string;
    systemMessage: string;
    tools: Tool[];
  }): Promise<AIAgent> {
    this.systemMessage = options.systemMessage;
    this.tools = options.tools;
    this.conversationHistory = [];

    return new DeepseekAgent(
      this.client,
      options.model,
      this.systemMessage,
      this.tools
    );
  }

  async destroy(): Promise<void> {
    // Limpieza si es necesaria
  }
}

class DeepseekAgent implements AIAgent {
  private conversationHistory: any[] = [];

  constructor(
    private client: OpenAI,
    private model: string,
    private systemMessage: string,
    private tools: Tool[]
  ) {}

  async sendMessage(prompt: string): Promise<AIResponse> {
    // Agregar mensaje del usuario al historial
    this.conversationHistory.push({
      role: "user",
      content: prompt,
    });

    // Preparar tools en formato OpenAI
    const openAITools = this.tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    try {
      // Llamar a Deepseek
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: this.systemMessage },
          ...this.conversationHistory,
        ],
        tools: openAITools,
        tool_choice: "auto",
      });

      const message = response.choices[0].message as any;

      // Si el modelo quiere llamar a una función
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        // IMPORTANTE: Agregar el mensaje completo del assistant al historial
        // Incluyendo reasoning_content si existe (requerido por deepseek-reasoner)
        const assistantMessage: any = {
          role: "assistant",
          content: message.content,
          tool_calls: [
            {
              id: toolCall.id,
              type: "function",
              function: {
                name: toolName,
                arguments: toolCall.function.arguments,
              },
            },
          ],
        };
        
        // Si hay reasoning_content, incluirlo (requerido para deepseek-reasoner)
        if (message.reasoning_content) {
          assistantMessage.reasoning_content = message.reasoning_content;
        }
        
        this.conversationHistory.push(assistantMessage);

        // Encontrar y ejecutar la tool
        const tool = this.tools.find((t) => t.name === toolName);
        if (tool) {
          console.log(`\n⚙️  [System] Ejecutando tool: ${toolName}`);
          const result = await tool.handler(toolArgs);

          // Agregar resultado de la función al historial
          this.conversationHistory.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });

          // Obtener respuesta final después de la tool
          const finalResponse = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: "system", content: this.systemMessage },
              ...this.conversationHistory,
            ],
          });

          const finalMessage = finalResponse.choices[0].message as any;
          
          // Agregar respuesta final al historial
          const finalAssistantMessage: any = {
            role: "assistant",
            content: finalMessage.content,
          };
          
          if (finalMessage.reasoning_content) {
            finalAssistantMessage.reasoning_content = finalMessage.reasoning_content;
          }
          
          this.conversationHistory.push(finalAssistantMessage);

          return {
            content: finalMessage.content || "",
            toolCalls: [{ toolName, arguments: toolArgs }],
          };
        }
      }

      // Respuesta normal sin tool calls
      const assistantMessage: any = {
        role: "assistant",
        content: message.content,
      };
      
      if (message.reasoning_content) {
        assistantMessage.reasoning_content = message.reasoning_content;
      }
      
      this.conversationHistory.push(assistantMessage);

      return {
        content: message.content || "",
      };
    } catch (error: any) {
      console.error("Error en Deepseek:", error);
      return {
        content: `Error: ${error.message}`,
      };
    }
  }

  async destroy(): Promise<void> {
    this.conversationHistory = [];
  }
}
