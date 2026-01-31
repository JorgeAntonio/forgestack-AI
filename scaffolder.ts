#!/usr/bin/env node
import { CopilotClient, defineTool } from "@github/copilot-sdk";

import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { promisify } from "util";
import { z } from "zod";

// --- CONFIGURACIÓN DE ENTORNO ---
// Solo si decidiste usar el archivo .env para arreglar el error de login
import * as dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Busca el .env en la raíz del proyecto (un nivel arriba de /dist)
dotenv.config({ path: join(__dirname, "../.env") });

const execAsync = promisify(exec);
const CURRENT_DIR = process.cwd();

// --- 1. DEFINICIÓN DEL SYSTEM PROMPT (Tus Reglas) ---
const SYSTEM_PROMPT = `
You are **George's Flutter Architect**. Your job is to scaffold new Flutter projects strictly following the "George Stack".

## THE "GEORGE STACK" RULES:
1.  **State Management:** MUST install \`flutter_riverpod\` and \`riverpod_annotation\`.
2.  **Routing:** MUST install \`go_router\`.
3.  **Data & Models:** MUST install \`dio\` and \`freezed_annotation\`.
4.  **Dev Tools:** MUST install \`build_runner\`, \`riverpod_generator\`, \`freezed\`, \`json_serializable\`.
5.  **Architecture:** You MUST run the \`scaffold_clean_arch\` tool immediately after installing dependencies.

## EXECUTION PLAN (Follow Strict Order):
1.  Run \`flutter create [project_name]\`.
2.  Install regular dependencies (riverpod, dio, router, etc.).
3.  Install dev dependencies (build_runner, generators, etc.).
4.  Run \`scaffold_clean_arch\` to set up folders and the main.dart.
5.  Report completion.
`;

// --- 2. DEFINICIÓN DE HERRAMIENTAS (Skills) ---

// TOOL A: Ejecutor de Comandos Flutter
const flutterOpsTool = defineTool("flutter_ops", {
  description:
    "Executes Flutter CLI commands. Use this to create projects and add packages.",
  parameters: z.object({
    command: z.enum(["create", "pub add"]).describe("The command to run"),
    projectName: z.string().describe("The name of the project folder"),
    args: z.string().optional().describe("Packages to install or extra flags"),
    isDev: z.boolean().optional().describe("If true, adds --dev to pub add"),
  }),
  handler: async ({ command, projectName, args, isDev }) => {
    // Si es 'create', se corre en el dir actual. Si es 'pub add', se corre DENTRO del proyecto.
    const workingDir =
      command === "create" ? CURRENT_DIR : path.join(CURRENT_DIR, projectName);

    let fullCommand = "";
    if (command === "create") {
      fullCommand = `flutter create ${projectName} --empty`; // --empty crea menos basura inicial
    } else {
      fullCommand = `flutter pub add ${args} ${isDev ? "--dev" : ""}`;
    }

    console.log(
      `\n⚙️  [System] Ejecutando en ${path.basename(workingDir)}: ${fullCommand}`,
    );

    try {
      const { stdout } = await execAsync(fullCommand, { cwd: workingDir });
      return { status: "success", output: stdout.slice(0, 300) + "..." }; // Truncamos log
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  },
});

// TOOL B: Generador de Clean Architecture
const scaffoldArchTool = defineTool("scaffold_clean_arch", {
  description:
    "Deletes default files and generates Clean Architecture folder structure + boilerplate main.dart.",
  parameters: z.object({
    projectName: z
      .string()
      .describe("The name of the project folder to structure"),
  }),
  handler: async ({ projectName }) => {
    const projectPath = path.join(CURRENT_DIR, projectName);
    const libPath = path.join(projectPath, "lib");
    const testPath = path.join(projectPath, "test");

    console.log(
      `\n🏗️  [System] Construyendo Clean Architecture en: ${projectName}...`,
    );

    try {
      // 1. Limpieza inicial (Borrar widget_test.dart para que no falle el build inicial)
      if (fs.existsSync(testPath))
        fs.rmSync(testPath, { recursive: true, force: true });

      // 2. Definir carpetas "George Style"
      const folders = [
        "core/constants",
        "core/theme",
        "core/router",
        "features/auth/data",
        "features/auth/domain",
        "features/auth/presentation/providers",
        "features/auth/presentation/screens",
        "features/home/presentation",
        "shared/widgets",
      ];

      // 3. Crear carpetas
      folders.forEach((folder) => {
        fs.mkdirSync(path.join(libPath, folder), { recursive: true });
      });

      // 4. Crear un main.dart configurado con ProviderScope (Riverpod)
      const mainContent = `
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${projectName}',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: Center(
          child: Text("George Stack Initialized 🚀"),
        ),
      ),
    );
  }
}
`;
      fs.writeFileSync(path.join(libPath, "main.dart"), mainContent);

      return {
        status: "success",
        message: "Clean Architecture folders and main.dart created.",
      };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  },
});

// --- 3. INICIO DEL AGENTE ---
async function main() {
  // Verificamos si el token cargó (para depurar)
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("❌ Error: No se encontró GITHUB_TOKEN en el archivo .env");
    process.exit(1);
  }
  // Le pasamos el token manualmente al cliente
  const client = new CopilotClient({
    githubToken: token,
  });

  console.log("🚀 Iniciando George's Flutter Scaffolder...");
  await client.start();

  const session = await client.createSession({
    model: "gpt-4o",
    systemMessage: { mode: "replace", content: SYSTEM_PROMPT },
    tools: [flutterOpsTool, scaffoldArchTool],
  });

  console.log("\n🤖 **Agente Listo.** Dime qué proyecto quieres crear.");
  console.log("   (Ejemplo: 'Crea un nuevo proyecto llamado crypto_wallet')\n");

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

      console.log("...Procesando plan de construcción...");

      // Usamos sendAndWait para dejar que el agente ejecute múltiples pasos seguidos
      try {
        const event = await session.sendAndWait({ prompt: input });
        if (event && event.type === "assistant.message") {
          console.log(`\n🤖 Agente: ${event.data.content}\n`);
        }
      } catch (err) {
        console.error("Error:", err);
      }

      ask();
    });
  };

  ask();
}

main().catch(console.error);
