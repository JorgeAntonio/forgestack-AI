import { defineTool } from "@github/copilot-sdk";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { CURRENT_DIR } from "../config/env.js";

const execAsync = promisify(exec);

export const flutterOpsTool = defineTool("flutter_ops", {
  description:
    "Executes Flutter CLI commands. Use this ONLY to create projects.",
  parameters: z.object({
    command: z.enum(["create"]).describe("The command to run"),
    projectName: z.string().describe("The name of the project folder"),
    org: z
      .string()
      .optional()
      .describe("The organization domain (e.g. com.jorgeantonio)"),
  }),
  handler: async ({ command, projectName, org }) => {
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
});
