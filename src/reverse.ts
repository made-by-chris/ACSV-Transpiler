import { compile, serializeJSON } from "./ZROWCompiler.js";
import { scanRecords, MAX_INPUT } from "./csv.js";
import { ZROWError } from "./errors.js";

/** Convert data to literal ZROW; never infer formulas or relationships. */
export function toZROW(config: { input: string; format: "csv" | "json" }): string {
  const fail = (message: string): never => { throw new ZROWError("E_REVERSE", message); };
  if (typeof config.input !== "string" || config.input.length > MAX_INPUT) fail("Input must be a string of at most 1,000,000 characters.");
  const quote = (s: string) => '"' + s.replace(/"/g, '""') + '"';
  const table = (headers: string[], rows: unknown[][], types?: string[]) => {
    if (!headers.length || new Set(headers).size !== headers.length || headers.some(h => !h)) fail("Columns must have unique, nonempty names.");
    if (rows.some(r => r.length !== headers.length)) fail("Every row must have the same number of columns.");
    return '(cols ' + headers.map((h,i) => types ? h + ':' + types[i] : quote(h)).join(',') + ')\n' + rows.map(r => r.map(v => quote(String(v))).join(',')).join('\n');
  };
  let source = "# ZROW 0.4\n";
  if (config.format === "csv") {
    const records = scanRecords(config.input, false, false, false).map(r => r.cells.map(c => c.value));
    if (!records.length) fail("CSV requires a header row.");
    source += table(records[0], records.slice(1));
    const result = compile({ input: source, mode: "zrow" });
    if (JSON.stringify([result.headers, ...result.rows]) !== JSON.stringify(records)) fail("This CSV cannot be represented without changing its cells.");
  } else if (config.format === "json") {
    let data: any;
    try { data = JSON.parse(config.input); } catch { return fail("Invalid JSON."); }
    const convert = (records: any): string => {
      if (!Array.isArray(records) || !records.length) return fail("JSON tables must be nonempty arrays of objects.");
      const first = records[0];
      if (!first || typeof first !== "object" || Array.isArray(first)) return fail("JSON rows must be objects.");
      const keys = Object.keys(first);
      if (keys.some(k => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k))) return fail("JSON column names must be identifiers.");
      const types = keys.map(k => typeof first[k]);
      for (const row of records) {
        if (!row || Array.isArray(row) || typeof row !== "object" || Object.keys(row).length !== keys.length) fail("JSON rows must have identical columns.");
        keys.forEach((k,i) => {
          const v = row[k];
          if (!Object.prototype.hasOwnProperty.call(row,k) || typeof v !== types[i] || !["string","number","boolean"].includes(typeof v) || (typeof v === "number" && (!Number.isFinite(v) || (Number.isInteger(v) && !Number.isSafeInteger(v))))) fail("JSON columns require consistent string, boolean or safe numeric values; null and nested values are unsupported.");
        });
      }
      return table(keys, records.map(r => keys.map(k => r[k])), types.map(t => t === "string" ? "text" : t === "boolean" ? "bool" : "number"));
    };
    if (Array.isArray(data)) source += convert(data);
    else {
      if (!data || typeof data !== "object" || !Object.keys(data).length) fail("Expected an array of records or an object of named tables.");
      source += Object.entries(data).map(([name, rows]) => {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) fail("Table names must be identifiers.");
        return '(table ' + name + '\n' + convert(rows) + '\n)';
      }).join('\n');
    }
    const restored = JSON.parse(serializeJSON(compile({ input: source, mode: "zrow" })));
    const canonical = (v: any): any => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k,canonical(v[k])])) : v;
    if (JSON.stringify(canonical(restored)) !== JSON.stringify(canonical(data))) fail("This JSON cannot be represented without changing its values.");
  } else fail("Choose csv or json input.");
  return source;
}
