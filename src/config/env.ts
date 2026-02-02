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
      "⚠️ No se pudo cargar ../../.env, asegúrate de tener GITHUB_TOKEN en tus variables de entorno.",
    );
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error("❌ Error: No se encontró GITHUB_TOKEN en el archivo .env o variables de entorno");
    process.exit(1);
  }
}

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const CURRENT_DIR = process.cwd();
