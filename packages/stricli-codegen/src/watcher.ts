import type { FSWatcher } from "chokidar";
import type { RouteWatcher, WatcherOptions } from "./types.js";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { watch } from "chokidar";
import { isCommandFile, isLazyFile, SPECIAL_FILES } from "./conventions.js";
import { generateRouteMap } from "./generator.js";
import {
  generateLazyRouteTemplate,
  generateRootTemplate,
  generateRouteGroupTemplate,
  generateRouteTemplate,
} from "./template.js";

/**
 * Check if a file is empty or only contains whitespace
 */
function isFileEmpty(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, "utf-8");
    return content.trim() === "";
  } catch {
    return true;
  }
}

/**
 * Create a file watcher that regenerates the route map on changes
 * @param options - Watcher options
 * @returns Route watcher instance
 */
export function createRouteWatcher(options: WatcherOptions): RouteWatcher {
  const {
    commandsDir,
    outputPath,
    importPrefix,
    onRegenerate,
    onNewFile,
    autoPopulateNewFiles = true,
    debounceMs = 100,
  } = options;

  let watcher: FSWatcher | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingChanges: string[] = [];

  const regenerate = async (): Promise<void> => {
    await generateRouteMap({
      commandsDir,
      outputPath,
      importPrefix,
    });
  };

  const populateNewFile = (filePath: string): void => {
    const fileName = basename(filePath);

    // Only populate .ts files
    if (!fileName.endsWith(".ts")) {
      return;
    }

    // Check if file is empty
    if (!isFileEmpty(filePath)) {
      return;
    }

    // Allow callback to prevent population
    if (onNewFile?.(filePath) === false) {
      return;
    }

    let template: string;

    if (fileName === SPECIAL_FILES.ROUTE_CONFIG) {
      // __route.ts - route group config
      const groupName = basename(dirname(filePath));
      template = generateRouteGroupTemplate(groupName);
    } else if (fileName === SPECIAL_FILES.ROOT_CONFIG) {
      // __root.ts - root config with AppContext type
      const appName = basename(dirname(filePath));
      template = generateRootTemplate(appName);
    } else if (isCommandFile(fileName)) {
      // Route file - check if lazy
      if (isLazyFile(fileName)) {
        template = generateLazyRouteTemplate(filePath);
      } else {
        template = generateRouteTemplate(filePath);
      }
    } else {
      return;
    }

    writeFileSync(filePath, template, "utf-8");
  };

  const handleAdd = (path: string) => {
    // Auto-populate new empty files
    if (autoPopulateNewFiles) {
      populateNewFile(path);
    }

    handleChange(path);
  };

  const handleChange = (path: string) => {
    pendingChanges.push(path);

    // Debounce multiple rapid changes
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      const changes = [...pendingChanges];
      pendingChanges = [];

      void (async () => {
        try {
          await regenerate();
          onRegenerate?.(changes);
        } catch (error) {
          console.error("Failed to regenerate route map:", error);
        }
      })();
    }, debounceMs);
  };

  const start = async (): Promise<void> => {
    // Initial generation
    await regenerate();

    // Start watching
    watcher = watch(commandsDir, {
      ignored: [
        /(^|[/\\])\../, // Ignore dotfiles
        outputPath, // Ignore the output file
      ],
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("add", handleAdd);
    watcher.on("change", handleChange);
    watcher.on("unlink", handleChange);
    watcher.on("addDir", handleChange);
    watcher.on("unlinkDir", handleChange);
  };

  const stop = async (): Promise<void> => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (watcher) {
      await watcher.close();
      watcher = null;
    }
  };

  return {
    start,
    stop,
    regenerate,
  };
}
