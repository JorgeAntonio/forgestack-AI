#!/usr/bin/env node
import { CopilotClient } from "@github/copilot-sdk";
import * as readline from "readline";
import { GITHUB_TOKEN, loadEnv } from "./config/env.js";
import { SYSTEM_PROMPT } from "./config/prompts.js";
import { flutterOpsTool } from "./tools/flutterOps.js";
import { scaffoldArchTool } from "./tools/scaffoldCleanArch.js";

// Cargar variables de entorno
loadEnv();

async function main() {
  const token = GITHUB_TOKEN;

  const client = new CopilotClient({ githubToken: token });

  console.log("🚀 Iniciando George's Flutter Architect v2.0...");
  await client.start();

  const session = await client.createSession({
    model: "gpt-4o",
    systemMessage: { mode: "replace", content: SYSTEM_PROMPT },
    tools: [flutterOpsTool, scaffoldArchTool],
  });

  try {
    const greeting = await session.sendAndWait(
      {
        prompt:
          "Hola. Preséntate como mi arquitecto de software y pregúntame qué proyecto vamos a construir hoy. Sigue el protocolo de V2.",
      },
      300000,
    );
    if (greeting && greeting.type === "assistant.message") {
      console.log(`\n🤖 Agente: ${greeting.data.content}\n`);
    }
  } catch (err) {
    console.log("Error en saludo inicial:", err);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () => {
    rl.question("Tú: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        await session.destroy();
        await client.stop();
        rl.close();
        return;
      }
      console.log("...Analizando y procesando...");
      try {
        const event = await session.sendAndWait({ prompt: input }, 300000);
        if (event && event.type === "assistant.message") {
          console.log(`\n🤖 Agente: ${event.data.content}\n`);
        }
      } catch (err) {
        console.error("❌ Error (posible timeout):", err);
      }
      ask();
    });
  };
  ask();
}

main().catch(console.error);
