import * as dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Intentar cargar .env desde el directorio raíz del proyecto (asumiendo que src/config está a dos niveles de la raíz)
// Structure:
// root/
//   .env
//   src/
//     config/
//       env.ts

export function loadEnv() {
  try {
    dotenv.config({ path: join(__dirname, "../../.env") });
  } catch (e) {
    console.log(
      "⚠️ No se pudo cargar ../../.env, asegúrate de tener las variables de entorno configuradas.",
    );
  }
}

export function validateToken(provider: "copilot" | "deepseek"): string {
  if (provider === "copilot") {
    if (!process.env.GITHUB_TOKEN) {
      console.error(
        "❌ Error: No se encontró GITHUB_TOKEN en el archivo .env o variables de entorno",
      );
      console.error("💡 Necesitas un token de GitHub con acceso a Copilot");
      process.exit(1);
    }
    return process.env.GITHUB_TOKEN;
  } else {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error(
        "❌ Error: No se encontró DEEPSEEK_API_KEY en el archivo .env o variables de entorno",
      );
      console.error("💡 Obtén tu API key en: https://platform.deepseek.com/");
      process.exit(1);
    }
    return process.env.DEEPSEEK_API_KEY;
  }
}

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
export const CURRENT_DIR = process.cwd();
