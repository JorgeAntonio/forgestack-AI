# George Flutter Architect AI (v2.0) - Multi-Agent

An AI-powered CLI agent designed to scaffold Flutter projects strictly following the **"George Stack" Clean Architecture**. Now supports both **GitHub Copilot** and **Deepseek** AI providers.

## The "George Stack" Architecture
This tool enforces a strict Clean Architecture pattern:
- **Structure:** `lib/src/{core, features, shared}`
- **Core:** `app`, `assets`, `config`, `constants`, `providers`, `routing`, `services`, `theme`
- **Shared:** `widgets`, `utils`, `extensions`, `presentation`
- **Features:** Modularized by feature (`data`, `domain`, `presentation`)
- **Tech Stack:** `flutter_riverpod`, `go_router`, `dio`, `freezed`, `flutter_hooks`

## New in v2.0: Multi-Agent Support
The agent now supports multiple AI providers:

### 🤖 GitHub Copilot (GPT-4o)
- Original provider using GitHub Copilot SDK
- Requires GitHub Token with Copilot access

### 🧠 Deepseek (deepseek-reasoner)
- Alternative provider using Deepseek's API
- Optimized prompt for better tool usage
- Requires Deepseek API Key

## Prerequisites
- Node.js (v18+ recommended)
- Flutter SDK installed and available in your PATH.
- API credentials (see Setup below)

## Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory with your credentials:

### For GitHub Copilot:
```env
GITHUB_TOKEN=your_github_token_here
```

### For Deepseek:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### Both providers (optional):
```env
GITHUB_TOKEN=your_github_token_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

**Get your API keys:**
- GitHub Token: [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
- Deepseek API Key: [Deepseek Platform](https://platform.deepseek.com/)

## Usage

### Development Mode
Run the agent directly with `ts-node`:
```bash
npm run dev
```

### Build and Run
Build the project to JavaScript:
```bash
npm run build
```
Run the compiled script:
```bash
node dist/index.js
```

## How it works

When you start the CLI, you'll be prompted to select your AI provider:

```
🤖 George's Flutter Architect v2.0 - Multi-Agent

Selecciona el agente AI que deseas usar:
  [1] GitHub Copilot (GPT-4o)
  [2] Deepseek (deepseek-reasoner)

Tu elección (1 o 2): 
```

After selecting, the agent will:
1. **Brainstorm** features based on your project idea.
2. **Clarify** requirements (Navigation style, Organization).
3. **Generate** a complete scaffold with working routing (Bottom Nav / Drawer) and feature placeholders.

**Example Interaction:**
> User: "I want to build a crypto wallet app."
> Agent: "Analyzing... I suggest features like 'Auth', 'Wallet', 'Market'. What navigation style do you prefer? (Bottom Nav / Drawer)"
> User: "Bottom Nav, please."
> Agent: *Scaffolds the entire project with configured routing and folders.*

## Architecture

The project uses an abstraction layer (`src/providers/`) that allows easy switching between AI providers:

```
src/
├── providers/
│   ├── base.ts          # Common interfaces (AIProvider, Tool, AIAgent)
│   ├── copilot.ts       # GitHub Copilot adapter
│   └── deepseek.ts      # Deepseek adapter (OpenAI SDK)
├── tools/
│   ├── flutterOps.ts    # Tool: Create Flutter projects
│   └── scaffoldCleanArch.ts  # Tool: Generate Clean Architecture
└── index.ts             # Entry point with provider selector
```

## Available Tools

### 1. `flutter_ops`
Creates Flutter projects using the CLI.
- **Parameters:**
  - `command`: "create"
  - `projectName`: Project folder name
  - `org`: Organization domain (optional, e.g., "com.jorgeantonio")

### 2. `scaffold_clean_arch`
Generates the complete Clean Architecture structure.
- **Parameters:**
  - `projectName`: Project folder name
  - `features`: Array of feature names (e.g., ["auth", "products"])
  - `navigationType`: "bottom_nav", "drawer", or "simple"
  - `bottomNavFeatures`: Features to show as tabs (optional)

## License

MIT
