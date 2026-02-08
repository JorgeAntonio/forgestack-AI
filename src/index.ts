#!/usr/bin/env node
import * as readline from "readline";
import { loadEnv, validateToken } from "./config/env.js";
import { DEEPSEEK_SYSTEM_PROMPT, SYSTEM_PROMPT } from "./config/prompts.js";
import { AIProvider } from "./providers/base.js";
import { CopilotProvider } from "./providers/copilot.js";
import { DeepseekProvider } from "./providers/deepseek.js";
import { flutterOpsTool } from "./tools/flutterOps.js";
import { scaffoldArchTool } from "./tools/scaffoldCleanArch.js";

// Cargar variables de entorno
loadEnv();

async function selectProvider(): Promise<{
  provider: AIProvider;
  model: string;
  systemPrompt: string;
}> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  console.log("\n🤖 George's Flutter Architect v2.0 - Multi-Agent\n");
  console.log("Selecciona el agente AI que deseas usar:");
  console.log("  [1] GitHub Copilot (GPT-4o)");
  console.log("  [2] Deepseek (deepseek-reasoner)\n");

  const choice = await askQuestion("Tu elección (1 o 2): ");
  rl.close();

  if (choice === "2") {
    const token = validateToken("deepseek");
    console.log("\n✅ Iniciando con Deepseek...");
    return {
      provider: new DeepseekProvider(token),
      model: "deepseek-reasoner",
      systemPrompt: DEEPSEEK_SYSTEM_PROMPT,
    };
  } else {
    const token = validateToken("copilot");
    console.log("\n✅ Iniciando con GitHub Copilot...");
    return {
      provider: new CopilotProvider(token),
      model: "gpt-4o",
      systemPrompt: SYSTEM_PROMPT,
    };
  }
}

async function main() {
  // Seleccionar proveedor
  const { provider, model, systemPrompt } = await selectProvider();

  console.log(
    `🚀 Iniciando George's Flutter Architect v2.0 con ${provider.name}...`,
  );

  try {
    await provider.initialize();

    const session = await provider.createSession({
      model: model,
      systemMessage: systemPrompt,
      tools: [flutterOpsTool, scaffoldArchTool],
    });

    // Saludo inicial
    try {
      const greeting = await session.sendMessage(
        "Hola. Preséntate como mi arquitecto de software y pregúntame qué proyecto vamos a construir hoy. Sigue el protocolo de V2.",
      );
      if (greeting && greeting.content) {
        console.log(`\n🤖 Agente: ${greeting.content}\n`);
      }
    } catch (err) {
      console.log("Error en saludo inicial:", err);
    }

    // Chat loop
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = () => {
      rl.question("Tú: ", async (input) => {
        if (input.toLowerCase() === "exit") {
          await session.destroy();
          await provider.destroy();
          rl.close();
          return;
        }

        console.log("...Analizando y procesando...");

        try {
          const response = await session.sendMessage(input);
          if (response && response.content) {
            console.log(`\n🤖 Agente: ${response.content}\n`);
          }
        } catch (err) {
          console.error("❌ Error (posible timeout):", err);
        }

        ask();
      });
    };

    ask();
  } catch (err) {
    console.error("❌ Error al inicializar:", err);
    process.exit(1);
  }
}

main().catch(console.error);
