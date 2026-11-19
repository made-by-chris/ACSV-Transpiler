import { ACSVError, fail, type Diagnostic } from "./errors.js";
import {
  scanRecords,
  serializeCSV,
  serializeRow,
  type Cell,
  type RecordLine,
  MAX_INPUT,
} from "./csv.js";
import {
  parseExpression,
  splitControls,
  evaluate,
  advance,
  type Expression,
} from "./expression.js";
import { readColumns, convertValue, type ColumnSchema } from "./schema.js";
export { toRecords, serializeJSON } from "./schema.js";
export type { ColumnSchema, ColumnType, DataValue } from "./schema.js";
export { ACSVError } from "./errors.js";
export { parseCSV, serializeCSV } from "./csv.js";

export type InputMode = "csv" | "acsv";
export interface ACSV_Transpilation_Config {
  input: string;
  mode?: InputMode;
  streaming?: boolean;
  streaming_callback?: (output: string) => void;
  stats?: boolean;
  stats_callback?: (stats: Statistics) => void;
  baseDir?: string;
  sourceName?: string;
  resolveInclude?: (
    file: string,
    from?: string,
  ) => { input: string; source: string };
}
export interface Statistics {
  input_rows: number;
  output_rows: number;
  columns: number;
  control_lines: number;
  comments: number;
}
export interface CellOrigin {
  line: number;
  kind:
    | "literal"
    | "default"
    | "sequence"
    | "expression"
    | "override"
    | "generator";
}
export interface Compilation {
  csv: string;
  headers: string[];
  columns: ColumnSchema[];
  rows: string[][];
  origins: CellOrigin[][];
  stats: Statistics;
}
type Rule =
  | { kind: "value"; expression: Expression; line: number; startRow?: number }
  | {
      kind: "sequence";
      next: string;
      step: number;
      line: number;
      pending?: boolean;
    };
const MAX_ROWS = 10_000,
  MAX_CELLS = 250_000,
  MAX_OUTPUT = 10_000_000;

/** Literal CSV is the default. ACSV execution is always an explicit choice. */
export function compile(config: ACSV_Transpilation_Config): Compilation {
  if (!config || typeof config.input !== "string")
    fail("E_CONFIG", "Provide text in the input property.");
  const mode = config.mode ?? "csv";
  if (mode !== "csv" && mode !== "acsv")
    fail("E_CONFIG", "Mode must be csv or acsv.");
  const records = scanRecords(config.input, mode === "acsv");
  let headers: string[] = [];
  let columns: ColumnSchema[] = [];
  let expectation: { count: number; line: number } | undefined;
  const uniqueChecks: { names: string[]; line: number }[] = [];
  const headerSet = new Set<string>();
  const rows: string[][] = [],
    origins: CellOrigin[][] = [];
  const rules = new Map<string, Rule>();
  let previous = new Map<string, string>();
  let haveHeader = false,
    totalInput = config.input.length,
    totalOutput = 0;
  const stats: Statistics = {
    input_rows: config.input ? config.input.split(/\r\n|\r|\n/).length : 0,
    output_rows: 0,
    columns: 0,
    control_lines: 0,
    comments: 0,
  };

  function capacity(count: number, line: number) {
    if (!Number.isSafeInteger(count) || count < 0)
      fail("E_LIMIT", "Row count must be a non-negative safe integer.", line);
    if (
      rows.length + count > MAX_ROWS ||
      (rows.length + count) * headers.length > MAX_CELLS
    ) {
      fail(
        "E_LIMIT",
        `Output is limited to ${MAX_ROWS.toLocaleString()} rows and ${MAX_CELLS.toLocaleString()} cells. Reduce the repeat or range.`,
        line,
      );
    }
  }
  function column(name: string, line: number) {
    if (!headerSet.has(name))
      fail("E_COLUMN", `Unknown column “${name}”. Check the header.`, line);
  }
  function resolveRow(
    cells: Cell[],
    line: number,
    overrides: ReadonlyMap<string, Rule> = new Map(),
  ): { get: (name: string) => string; source: Map<string, CellOrigin> } {
    const values = new Map<string, string>(),
      source = new Map<string, CellOrigin>(),
      active = new Set<string>();
    // Literal values are available to all formulas, irrespective of column order.
    headers.forEach((name, index) => {
      const cell = cells[index];
      if (cell && (cell.value !== "" || cell.quoted || mode === "csv")) {
        values.set(name, cell.value);
        source.set(name, { line: cell.line, kind: "literal" });
      }
    });
    function get(name: string): string {
      column(name, line);
      if (values.has(name)) return values.get(name)!;
      const rule = overrides.get(name) ?? rules.get(name);
      if (active.has(name))
        fail(
          "E_CYCLE",
          `Circular formula involving “${name}”.`,
          rule?.line ?? line,
        );
      active.add(name);
      let value = "";
      let origin: CellOrigin = { line, kind: "literal" };
      if (rule?.kind === "sequence") {
        value = rule.pending
          ? advance(rule.next, rule.step, rule.line)
          : rule.next;
        origin = { line: rule.line, kind: "sequence" };
      } else if (rule) {
        value = evaluate(
          rule.expression,
          get,
          previous,
          rule.line,
          rows.length - (rule.startRow ?? 0),
        );
        origin = {
          line: rule.line,
          kind:
            rule.expression.kind === "literal" &&
            !String(rule.expression.value).includes("{")
              ? overrides.has(name)
                ? "override"
                : "default"
              : rule.expression.kind === "call" &&
                  ["seq", "cycle"].includes(rule.expression.name)
                ? "generator"
                : "expression",
        };
      }
      active.delete(name);
      values.set(name, value);
      source.set(name, origin);
      return value;
    }
    return { get, source };
  }
  function current(name: string, line: number): string {
    return resolveRow([], line).get(name);
  }
  function emit(
    cells: Cell[],
    line: number,
    overrides: ReadonlyMap<string, Rule> = new Map(),
  ) {
    capacity(1, line);
    if (cells.length && cells.length !== headers.length)
      fail(
        "E_WIDTH",
        `Expected ${headers.length} fields, received ${cells.length}.`,
        line,
      );
    for (const rule of rules.values()) {
      if (rule.kind === "sequence" && rule.pending) {
        rule.next = advance(rule.next, rule.step, rule.line);
        rule.pending = false;
      }
    }
    const context = resolveRow(cells, line, overrides);
    const result = {
      values: headers.map(context.get),
      origins: headers.map((name) => context.source.get(name)!),
    };
    result.values.forEach((value, index) =>
      convertValue(
        value,
        columns[index],
        result.origins[index].line,
        rows.length + 1,
      ),
    );
    totalOutput += result.values.reduce((n, v) => n + v.length, 0);
    if (totalOutput > MAX_OUTPUT)
      fail("E_LIMIT", "Expanded values exceed the output size limit.", line);
    rows.push(result.values);
    origins.push(result.origins);
    previous = new Map(
      headers.map((name, index) => [name, result.values[index]]),
    );
    for (const rule of rules.values())
      if (rule.kind === "sequence") rule.pending = true;
  }
  function apply(part: string, line: number) {
    const assignment = /^(.+?)\s*=([\s\S]*)$/.exec(part);
    if (assignment) {
      const name = assignment[1].trim();
      column(name, line);
      rules.set(name, {
        kind: "value",
        expression: parseExpression(assignment[2], headerSet, line),
        line,
        startRow: rows.length,
      });
      return;
    }
    const operator =
      /^(.+?)(\+\+STOP|--STOP|\+\+(?:\d+)?|--(?:\d+)?|\+|-)$/u.exec(part);
    if (!operator)
      fail(
        "E_CONTROL",
        `Invalid control “${part}”. Use column=value or a documented counter operator.`,
        line,
      );
    const name = operator[1].trim(),
      op = operator[2];
    column(name, line);
    const old = rules.get(name);
    if (op.endsWith("STOP")) {
      if (!old) fail("E_CONTROL", `No rule to stop for “${name}”.`, line);
      const value = previous.get(name) ?? current(name, line);
      rules.set(name, {
        kind: "value",
        expression: { kind: "literal", value },
        line,
      });
      return;
    }
    if (op === "+" || op === "-") {
      const value = old
        ? old.kind === "sequence"
          ? (previous.get(name) ?? old.next)
          : current(name, line)
        : "0";
      rules.set(name, {
        kind: "value",
        expression: {
          kind: "literal",
          value: advance(value, op === "+" ? 1 : -1, line),
        },
        line,
      });
      return;
    }
    const amount = Number(op.slice(2) || 1);
    if (!Number.isSafeInteger(amount) || amount < 1)
      fail("E_CONTROL", "Counter step must be a positive safe integer.", line);
    const step = op.startsWith("++") ? amount : -amount;
    let next = String(step);
    if (old?.kind === "sequence")
      next = previous.has(name)
        ? advance(previous.get(name)!, step, line)
        : old.next;
    else if (old) next = current(name, line);
    advance(next, 0, line); // Validate the initial numeric/date value without consuming a step.
    rules.set(name, { kind: "sequence", next, step, line });
  }
  function control(record: RecordLine) {
    stats.control_lines++;
    let content = record.raw.slice(1).trim();
    const repeat = /\s+x(\d+)$/.exec(content);
    const count = repeat ? Number(repeat[1]) : 0;
    if (repeat) content = content.slice(0, repeat.index).trim();
    const parts = splitControls(content, record.line);
    if (parts.some((p) => !p))
      fail("E_CONTROL", "Empty control instruction.", record.line);
    const ranges = parts
      .map((part, index) => ({
        match: /^(.+?)\s*=\s*(-?\d+)\s*\.\.\s*(-?\d+)$/.exec(part),
        index,
      }))
      .filter((x) => x.match);
    if (ranges.length > 1 || (ranges.length && repeat))
      fail(
        "E_RANGE",
        "Use one range per control line, without a repeat.",
        record.line,
      );
    if (ranges.length) {
      const { match, index } = ranges[0];
      const start = Number(match![2]),
        end = Number(match![3]);
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        end < start
      )
        fail(
          "E_RANGE",
          "Use an ascending range of safe integers.",
          record.line,
        );
      capacity(end - start + 1, record.line);
      const name = match![1].trim();
      column(name, record.line);
      parts.forEach((part, i) => {
        if (i !== index) apply(part, record.line);
      });
      for (let value = start; value <= end; value++) {
        rules.set(name, {
          kind: "value",
          expression: { kind: "literal", value },
          line: record.line,
        });
        emit([], record.line);
      }
      return;
    }
    capacity(count, record.line);
    parts.forEach((part) => apply(part, record.line));
    for (let i = 0; i < count; i++) emit([], record.line);
  }
  function assignments(content: string, line: number): Map<string, Rule> {
    const overrides = new Map<string, Rule>();
    for (const part of splitControls(content, line)) {
      const assignment = /^(.+?)\s*=([\s\S]*)$/.exec(part);
      if (!assignment)
        fail(
          "E_DIRECTIVE",
          "Use named assignments: column=value, column=value.",
          line,
        );
      const name = assignment[1].trim();
      column(name, line);
      if (overrides.has(name))
        fail(
          "E_DIRECTIVE",
          `Column “${name}” is assigned twice in this directive.`,
          line,
        );
      overrides.set(name, {
        kind: "value",
        expression: parseExpression(assignment[2], headerSet, line),
        line,
        startRow: rows.length,
      });
    }
    return overrides;
  }
  function directive(record: RecordLine, included: boolean) {
    stats.control_lines++;
    const match = /^@(\w+)(?:\s+([\s\S]*))?$/.exec(record.raw.trim());
    if (!match)
      fail(
        "E_DIRECTIVE",
        "Invalid directive. Use @set, @row, @rows, @expect or @unique.",
        record.line,
      );
    const command = match[1],
      content = (match[2] ?? "").trim(),
      line = record.line;
    if (command === "set") {
      const next = assignments(content, line);
      for (const [name, rule] of next) rules.set(name, rule);
    } else if (command === "row")
      emit([], line, content ? assignments(content, line) : undefined);
    else if (command === "rows") {
      const repeat = /^(\d+)(?:\s+with\s+(.+))?$/.exec(content);
      if (!repeat)
        fail("E_DIRECTIVE", "Use @rows N or @rows N with column=value.", line);
      const count = Number(repeat[1]);
      capacity(count, line);
      const overrides = repeat[2] ? assignments(repeat[2], line) : undefined;
      for (let i = 0; i < count; i++) emit([], line, overrides);
    } else if (command === "expect") {
      if (included)
        fail(
          "E_ASSERT",
          "Put @expect in the main document; it counts all output rows.",
          line,
        );
      if (expectation)
        fail("E_ASSERT", "Declare @expect only once per document.", line);
      if (!/^\d+$/.test(content) || !Number.isSafeInteger(Number(content)))
        fail("E_ASSERT", "Use @expect N with a non-negative integer.", line);
      if (Number(content) > MAX_ROWS)
        fail(
          "E_LIMIT",
          `Expected rows exceed the ${MAX_ROWS} row limit.`,
          line,
        );
      expectation = { count: Number(content), line };
    } else if (command === "unique") {
      const names = content.split(",").map((name) => name.trim());
      names.forEach((name) => column(name, line));
      if (new Set(names).size !== names.length)
        fail("E_ASSERT", "Each column in a unique key must be distinct.", line);
      if (uniqueChecks.length >= 32)
        fail("E_LIMIT", "At most 32 unique-key constraints are allowed.", line);
      uniqueChecks.push({ names, line });
    } else
      fail(
        "E_DIRECTIVE",
        `Unknown directive “@${command}”. Use @set, @row, @rows, @expect or @unique.`,
        line,
      );
  }
  function consume(
    list: RecordLine[],
    source: string | undefined,
    stack: string[] = [],
    included = false,
  ) {
    let includeHeader = included;
    for (const record of list) {
      if (record.kind === "comment") {
        if (/^#(?:dialect|safety)\b/.test(record.raw))
          fail(
            "E_UNSUPPORTED",
            "Dialect and spreadsheet-safety directives are not part of the core.",
            record.line,
          );
        stats.comments++;
        continue;
      }
      if (mode === "acsv" && record.kind === "data" && record.raw === "")
        continue;
      if (!haveHeader || includeHeader) {
        if (record.kind !== "data")
          fail(
            "E_HEADER",
            "Place the CSV header before control lines or includes.",
            record.line,
          );
        const parsedColumns = readColumns(record.cells, mode === "acsv");
        const names = parsedColumns.map((column) => column.name);
        if (includeHeader) {
          if (JSON.stringify(parsedColumns) !== JSON.stringify(columns))
            fail(
              "E_HEADER",
              "Included files must have the same header and column types.",
              record.line,
            );
          includeHeader = false;
          continue;
        }
        columns = parsedColumns;
        headers = names;
        if (headers.length > 128)
          fail("E_LIMIT", "A table may have at most 128 columns.", record.line);
        if (
          mode === "acsv" &&
          (headers.some((n) => n === "") ||
            new Set(headers).size !== headers.length)
        )
          fail(
            "E_HEADER",
            "ACSV headers must be non-empty and unique.",
            record.line,
          );
        headers.forEach((n) => headerSet.add(n));
        haveHeader = true;
        continue;
      }
      if (record.kind === "directive") directive(record, included);
      else if (record.kind === "control") control(record);
      else if (record.kind === "include") {
        if (!config.resolveInclude)
          fail(
            "E_INCLUDE",
            "File includes require the Node.js adapter. Paste the included data into the web editor instead.",
            record.line,
          );
        const match = /^include\s+"([^"]+)"\s*$/.exec(record.raw);
        if (!match)
          fail("E_INCLUDE", 'Use include "relative-file.acsv".', record.line);
        if (stack.length >= 10)
          fail("E_LIMIT", "Includes are limited to 10 levels.", record.line);
        let resolved: { input: string; source: string };
        try {
          resolved = config.resolveInclude(match[1], source);
        } catch (error) {
          fail(
            "E_INCLUDE",
            error instanceof Error ? error.message : "Unable to read include.",
            record.line,
          );
        }
        if (stack.includes(resolved.source) || resolved.source === source)
          fail("E_INCLUDE", "Circular include.", record.line);
        totalInput += resolved.input.length;
        if (totalInput > MAX_INPUT)
          fail(
            "E_LIMIT",
            "Included input exceeds the size limit.",
            record.line,
          );
        consume(
          scanRecords(resolved.input, true),
          resolved.source,
          [...stack, resolved.source],
          true,
        );
      } else {
        if (record.cells.length !== headers.length)
          fail(
            "E_WIDTH",
            `Expected ${headers.length} fields, received ${record.cells.length}.`,
            record.line,
          );
        if (mode === "csv") {
          capacity(1, record.line);
          rows.push(record.cells.map((c) => c.value));
          origins.push(
            record.cells.map((c) => ({ line: c.line, kind: "literal" })),
          );
        } else emit(record.cells, record.line);
      }
    }
    if (includeHeader) fail("E_HEADER", "Included file has no header.");
  }
  consume(records, config.sourceName);
  if (expectation && expectation.count !== rows.length)
    fail(
      "E_ASSERT",
      `Expected ${expectation.count} rows, generated ${rows.length}. Check for missing or extra @row/@rows directives.`,
      expectation.line,
    );
  for (const check of uniqueChecks) {
    const indices = check.names.map((name) => headers.indexOf(name)),
      seen = new Map<string, number>();
    rows.forEach((row, index) => {
      const key = JSON.stringify(
        indices.map((column) =>
          convertValue(
            row[column],
            columns[column],
            origins[index][column].line,
            index + 1,
          ),
        ),
      );
      if (seen.has(key))
        fail(
          "E_UNIQUE",
          `Duplicate key (${check.names.join(", ")}) in output rows ${seen.get(key)} and ${index + 1}.`,
          origins[index][indices[0]].line,
        );
      seen.set(key, index + 1);
    });
  }
  stats.output_rows = rows.length;
  stats.columns = headers.length;
  const csv =
    mode === "csv"
      ? config.input
      : haveHeader
        ? serializeCSV([headers, ...rows])
        : "";
  if (config.streaming && config.streaming_callback)
    rows.forEach((row) => config.streaming_callback!(serializeRow(row)));
  if (config.stats && config.stats_callback) config.stats_callback(stats);
  return { csv, headers, columns, rows, origins, stats };
}

export function validate(config: ACSV_Transpilation_Config): {
  valid: boolean;
  diagnostics: Diagnostic[];
} {
  try {
    compile({ ...config, streaming: false, stats: false });
    return { valid: true, diagnostics: [] };
  } catch (error) {
    const diagnostic =
      error instanceof ACSVError
        ? error
        : new ACSVError(
            "E_INTERNAL",
            error instanceof Error ? error.message : "Compilation failed.",
          );
    return {
      valid: false,
      diagnostics: [
        {
          code: diagnostic.code,
          message: diagnostic.message,
          line: diagnostic.line,
          column: diagnostic.column,
        },
      ],
    };
  }
}
export function isValid(config: ACSV_Transpilation_Config): boolean {
  return validate(config).valid;
}
export default function transpile(config: ACSV_Transpilation_Config): string {
  return compile(config).csv;
}
