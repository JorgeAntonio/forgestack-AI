# George Flutter Scaffolder

An AI-powered CLI agent designed to scaffold Flutter projects strictly following the "George Stack" architecture. Built with `@github/copilot-sdk`.

## The "George Stack"
This tool enforces a specific set of libraries and architectural patterns:
- **State Management:** `flutter_riverpod`, `riverpod_annotation`
- **Routing:** `go_router`
- **Data & Models:** `dio`, `freezed_annotation`
- **Dev Tools:** `build_runner`, `riverpod_generator`, `freezed`, `json_serializable`
- **Architecture:** Clean Architecture folder structure.

## Prerequisites
- Node.js (v18+ recommended)
- Flutter SDK installed and available in your PATH.
- A GitHub Token with Copilot access (configured in `.env`).

## Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory and add your GitHub Token:
    ```env
    GITHUB_TOKEN=your_github_token_here
    ```

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
node dist/scaffolder.js
```

## How it works
The agent uses the GitHub Copilot SDK to interpret natural language commands.
Example usage:
> "Crea un nuevo proyecto llamado my_app"

The agent will:
1.  Run `flutter create`.
2.  Add all required dependencies.
3.  Scaffold the Clean Architecture folder structure.
4.  Replace `main.dart` with a Riverpod-configured entry point.
