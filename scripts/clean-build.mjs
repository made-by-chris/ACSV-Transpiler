import fs from "node:fs";
if (process.argv[2] === "cli") {
  fs.rmSync("cli", { recursive: true, force: true });
} else if (fs.existsSync("dist")) {
  for (const file of fs.readdirSync("dist")) {
    if (/\.(js|d\.ts)$/.test(file)) fs.rmSync("dist/" + file);
  }
}
