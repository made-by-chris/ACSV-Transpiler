import * as fs from "node:fs";
import * as path from "node:path";
import { compile, type CompileConfig } from "./ZROWCompiler.js";

/** The core never opens files. This explicit adapter confines includes to baseDir. */
export function compileNode(config: CompileConfig) {
  const base = fs.realpathSync(config.baseDir ?? process.cwd());
  return compile({
    ...config,
    resolveInclude: (file, from) => {
      const resolved = fs.realpathSync(
        path.resolve(from ? path.dirname(from) : base, file),
      );
      const relative = path.relative(base, resolved);
      if (
        relative.startsWith(`..${path.sep}`) ||
        relative === ".." ||
        path.isAbsolute(relative)
      )
        throw new Error("Includes must stay inside the input directory.");
      if (fs.statSync(resolved).size > 1_000_000)
        throw new Error("Included file is too large.");
      return { input: fs.readFileSync(resolved, "utf8"), source: resolved };
    },
  });
}
export default function transpileNode(config: CompileConfig): string {
  return compileNode(config).csv;
}
