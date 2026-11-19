#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { ZROWError, serializeJSON, type InputMode } from "./ZROWCompiler.js";
import { compileNode } from "./node.js";

const args = process.argv.slice(2);
let mode: InputMode | undefined;
let format: "csv" | "json" | undefined;
const formatIndex = args.indexOf("--format");
if (formatIndex >= 0) {
  const value = args[formatIndex + 1];
  if (value !== "csv" && value !== "json") {
    console.error("--format must be csv or json");
    process.exit(1);
  }
  format = value;
  args.splice(formatIndex, 2);
}
const modeIndex = args.indexOf("--mode");
if (modeIndex >= 0) {
  const value = args[modeIndex + 1];
  if (value !== "csv" && value !== "zrow") {
    console.error("--mode must be csv or zrow");
    process.exit(1);
  }
  mode = value;
  args.splice(modeIndex, 2);
}
if (args.includes("--help")) {
  console.log(
    "Usage: zrow [--mode csv|zrow] [--format csv|json] <input.csv|input.zrow> <output.csv|output.json>\nMode defaults to the input extension; format defaults to the output extension. CSV input is literal.",
  );
} else if (args.length !== 2) {
  console.error(
    "Usage: zrow [--mode csv|zrow] [--format csv|json] <input.csv|input.zrow> <output.csv|output.json>",
  );
  process.exitCode = 1;
} else {
  let temporary: string | undefined;
  try {
    const [src, dest] = args;
    mode ??= path.extname(src).toLowerCase() === ".zrow" ? "zrow" : "csv";
    const sourceName = fs.realpathSync(src);
    const result = compileNode({
      input: fs.readFileSync(src, "utf8"),
      mode,
      baseDir: path.dirname(sourceName),
      sourceName,
    });
    format ??= path.extname(dest).toLowerCase() === ".json" ? "json" : "csv";
    const output = format === "json" ? serializeJSON(result) : result.csv;
    temporary = path.join(path.dirname(dest), `.zrow-${randomUUID()}.tmp`);
    fs.writeFileSync(temporary, output, { flag: "wx" });
    fs.renameSync(temporary, dest);
    temporary = undefined;
  } catch (error) {
    if (temporary) fs.rmSync(temporary, { force: true });
    console.error(
      error instanceof ZROWError
        ? `${error.code} at line ${error.line}, column ${error.column}: ${error.message}`
        : error instanceof Error
          ? error.message
          : error,
    );
    process.exitCode = 1;
  }
}
