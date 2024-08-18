import transpile from "./ACSVTranspiler.js";
import * as fs from "fs";
const args = process.argv.slice(2);
const src = args[0];
const dest = args[1];
if (src && dest) {
    const config = {
        input: fs.readFileSync(src, "utf8"),
        streaming: false,
        stats: false,
    };
    const result = transpile(config);
    fs.writeFileSync(dest, result);
}
else {
    console.log("Usage: node ACSV.js <src> <dest>");
}
