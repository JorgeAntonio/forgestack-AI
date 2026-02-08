import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { CURRENT_DIR } from "../config/env.js";
import { Tool } from "../providers/base.js";

// Definir el schema de parámetros
const scaffoldSchema = z.object({
  projectName: z.string().describe("The name of the project folder"),
  features: z
    .array(z.string())
    .describe("List of feature names (e.g. ['auth', 'products'])"),
  navigationType: z
    .enum(["bottom_nav", "drawer", "simple"])
    .describe("Type of main navigation"),
  bottomNavFeatures: z
    .array(z.string())
    .optional()
    .describe("If bottom_nav, which features are tabs?"),
});

export const scaffoldArchTool: Tool = {
  name: "scaffold_clean_arch",
  description:
    "Generates Clean Architecture structure with core, shared, and feature files.",
  parameters: {
    type: "object",
    properties: {
      projectName: {
        type: "string",
        description: "The name of the project folder",
      },
      features: {
        type: "array",
        items: { type: "string" },
        description: "List of feature names (e.g. ['auth', 'products'])",
      },
      navigationType: {
        type: "string",
        enum: ["bottom_nav", "drawer", "simple"],
        description: "Type of main navigation",
      },
      bottomNavFeatures: {
        type: "array",
        items: { type: "string" },
        description: "If bottom_nav, which features are tabs?",
      },
    },
    required: ["projectName", "features", "navigationType"],
  },
  handler: async (args: any) => {
    const { projectName, features, navigationType, bottomNavFeatures } =
      scaffoldSchema.parse(args);

    const projectPath = path.join(CURRENT_DIR, projectName);
    const libPath = path.join(projectPath, "lib");
    const srcPath = path.join(libPath, "src");

    // Helpers
    const toPascalCase = (str: string) =>
      str
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
    const toCamelCase = (str: string) =>
      str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    console.log(
      `\n🏗️  [System] Arquitectando ${features.length} features en: ${projectName} (Mode: ${navigationType})...`,
    );

    try {
      // 1. Crear directorios base (Core & Shared)
      const coreFolders = [
        "core/app",
        "core/assets",
        "core/config",
        "core/constants",
        "core/providers",
        "core/routing",
        "core/services",
        "core/theme",
      ];
      const sharedFolders = [
        "shared/widgets",
        "shared/utils",
        "shared/extensions",
        "shared/presentation/screens",
      ];

      [...coreFolders, ...sharedFolders].forEach((folder) => {
        fs.mkdirSync(path.join(srcPath, folder), { recursive: true });
      });

      // 2. GENERAR CORE FILES
      // -- Routes.dart
      const routesContent = `class Routes {
  const Routes._({required this.name, required this.path});
  final String name;
  final String path;

  static Routes get splash => const Routes._(name: 'splash', path: '/splash');
${features
  .map(
    (f) =>
      `  static Routes get ${toCamelCase(f)} => const Routes._(name: '${toCamelCase(f)}', path: '/${f}');`,
  )
  .join("\n")}
}
`;
      fs.writeFileSync(
        path.join(srcPath, "core/routing/routes.dart"),
        routesContent,
      );

      // -- AppRouter.dart (Complex Logic based on NavType)
      let routerContent = "";
      if (navigationType === "bottom_nav") {
        const tabs = bottomNavFeatures || features.slice(0, 3);
        // Ensure we handle the case where no tabs are found or features list is empty
        const validTabs =
          tabs.length > 0
            ? tabs
            : features.length > 0
              ? [features[0]]
              : ["home"];

        routerContent = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'routes.dart';
// Feature imports
${features.map((f) => `import '../../features/${f}/presentation/screens/${f}_screen.dart';`).join("\n")}

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<StatefulNavigationShellState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: Routes.${toCamelCase(validTabs[0])}.path,
    routes: [
      StatefulShellRoute.indexedStack(
        key: _shellNavigatorKey,
        builder: (context, state, child) {
          return Scaffold(
            body: child,
            bottomNavigationBar: NavigationBar(
              selectedIndex: state.extra as int? ?? 0, // Simplified
              onDestinationSelected: (index) {
                // TODO: Implement navigation logic
                // const paths = [${validTabs.map((t) => `Routes.${toCamelCase(t)}.path`).join(", ")}];
                // context.go(paths[index]);
              },
              destinations: const [
                ${validTabs.map((t) => `NavigationDestination(icon: Icon(Icons.circle), label: '${toPascalCase(t)}')`).join(",\n                ")}
              ],
            ),
          );
        },
        branches: [
          ${validTabs
            .map(
              (t) => `StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.${toCamelCase(t)}.path,
                name: Routes.${toCamelCase(t)}.name,
                builder: (context, state) => const ${toPascalCase(t)}Screen(),
              ),
            ],
          ),`,
            )
            .join("\n          ")}
        ],
      ),
      // Other routes
      ${features
        .filter((f) => !validTabs.includes(f))
        .map(
          (f) => `GoRoute(
        path: Routes.${toCamelCase(f)}.path,
        name: Routes.${toCamelCase(f)}.name,
        builder: (context, state) => const ${toPascalCase(f)}Screen(),
      ),`,
        )
        .join("\n      ")}
    ],
  );
});
`;
      } else {
        // Simple/Drawer Router
        routerContent = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'routes.dart';
${features.map((f) => `import '../../features/${f}/presentation/screens/${f}_screen.dart';`).join("\n")}

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: ${features.length > 0 ? `Routes.${toCamelCase(features[0])}.path` : `'/'`},
    routes: [
      ${features
        .map(
          (f) => `GoRoute(
        path: Routes.${toCamelCase(f)}.path,
        name: Routes.${toCamelCase(f)}.name,
        builder: (context, state) => const ${toPascalCase(f)}Screen(),
      ),`,
        )
        .join("\n      ")}
    ],
  );
});
`;
      }
      fs.writeFileSync(
        path.join(srcPath, "core/routing/app_router.dart"),
        routerContent,
      );

      // -- Constants
      fs.writeFileSync(
        path.join(srcPath, "core/constants/constants.dart"),
        "class AppConstants { static const String appName = 'Sigae Clone'; }",
      );

      // -- Theme
      fs.writeFileSync(
        path.join(srcPath, "core/theme/app_theme.dart"),
        `import 'package:flutter/material.dart';
class AppTheme {
  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
  );
}`,
      );

      // -- Core App
      const appContent = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../routing/app_router.dart';
import '../theme/app_theme.dart';

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      routerConfig: router,
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
    );
  }
}
`;
      fs.writeFileSync(path.join(srcPath, "core/app/app.dart"), appContent);

      // 3. GENERAR FEATURES
      features.forEach((feat) => {
        const cleanName = feat.toLowerCase().replace(/\s+/g, "_");
        const className = toPascalCase(cleanName);
        const featPath = path.join(srcPath, `features/${cleanName}`);

        // Folders
        [
          "data/datasources",
          "data/mappers",
          "data/models",
          "data/repositories",
          "domain/entities",
          "domain/repositories",
          "presentation/providers",
          "presentation/screens",
          "presentation/widgets",
        ].forEach((f) =>
          fs.mkdirSync(path.join(featPath, f), { recursive: true }),
        );

        // -- Entity
        const entityContent = `class ${className} {
  final String id;
  const ${className}({required this.id});
}`;
        fs.writeFileSync(
          path.join(featPath, `domain/entities/${cleanName}.dart`),
          entityContent,
        );

        // -- Repository Interface
        const repoInterfaceContent = `import '../entities/${cleanName}.dart';
abstract class ${className}Repository {
  Future<${className}> get${className}(String id);
}`;
        fs.writeFileSync(
          path.join(
            featPath,
            `domain/repositories/${cleanName}_repository.dart`,
          ),
          repoInterfaceContent,
        );

        // -- Screen
        const screenContent = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ${className}Screen extends ConsumerWidget {
  const ${className}Screen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('${className}')),
      body: const Center(child: Text('${className} Feature')),
    );
  }
}
`;
        fs.writeFileSync(
          path.join(featPath, `presentation/screens/${cleanName}_screen.dart`),
          screenContent,
        );

        // -- Provider
        const providerContent = `import 'package:riverpod_annotation/riverpod_annotation.dart';

part '${cleanName}_provider.g.dart';

@riverpod
abstract class ${className}Notifier extends _$${className}Notifier {
  @override
  FutureOr<void> build() {}
}
`;
        fs.writeFileSync(
          path.join(
            featPath,
            `presentation/providers/${cleanName}_provider.dart`,
          ),
          providerContent,
        );
      });

      // 4. MAIN.DART
      const mainContent = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/app/app.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}
`;
      fs.writeFileSync(path.join(libPath, "main.dart"), mainContent);

      return {
        status: "success",
        message: `Architecture V2 (Mode: ${navigationType}) generated for ${projectName}.`,
      };
    } catch (error: any) {
      return { status: "error", message: error.message };
    }
  },
};
