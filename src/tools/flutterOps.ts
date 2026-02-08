import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { CURRENT_DIR } from "../config/env.js";
import { Tool } from "../providers/base.js";

const execAsync = promisify(exec);

// Definir el schema de parámetros
const flutterOpsSchema = z.object({
  command: z.enum(["create"]).describe("The command to run"),
  projectName: z.string().describe("The name of the project folder"),
  org: z
    .string()
    .optional()
    .describe("The organization domain (e.g. com.jorgeantonio)"),
});

export const flutterOpsTool: Tool = {
  name: "flutter_ops",
  description: "Executes Flutter CLI commands. Use this ONLY to create projects.",
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        enum: ["create"],
        description: "The command to run",
      },
      projectName: {
        type: "string",
        description: "The name of the project folder",
      },
      org: {
        type: "string",
        description: "The organization domain (e.g. com.jorgeantonio)",
      },
    },
    required: ["command", "projectName"],
  },
  handler: async (args: any) => {
    const { command, projectName, org } = flutterOpsSchema.parse(args);
    const workingDir = CURRENT_DIR;

    let fullCommand = "";
    if (command === "create") {
      const orgFlag = org ? `--org ${org}` : "";
      fullCommand = `flutter create ${projectName} ${orgFlag}`;
    }

    console.log(`\n⚙️  [System] Ejecutando: ${fullCommand}`);

    try {
      const { stdout } = await execAsync(fullCommand, {
        cwd: workingDir,
        timeout: 300000,
      });
      return { status: "success", output: stdout.slice(0, 300) + "..." };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  },
};
