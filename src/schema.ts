import { fail } from "./errors.js";
import { checkDate } from "./expression.js";
import type { Cell } from "./csv.js";
import type { Compilation } from "./ZROWCompiler.js";

export type ColumnType = "text" | "int" | "number" | "bool" | "date";
export interface ColumnSchema {
  name: string;
  type: ColumnType;
  explicit: boolean;
  enum?: string;
  values?: readonly string[];
}
export type DataValue = string | number | boolean;
const types = new Set(["text", "int", "number", "bool", "date"]);

export function readColumns(
  cells: Cell[],
  typed: boolean,
  enums: ReadonlyMap<string, readonly string[]> = new Map(),
): ColumnSchema[] {
  return cells.map((cell) => {
    if (typed && !cell.quoted && cell.value.includes(":")) {
      const split = cell.value.lastIndexOf(":");
      const name = cell.value.slice(0, split).trim(),
        type = cell.value.slice(split + 1).trim();
      if (enums.has(type))
        return {
          name,
          type: "text",
          explicit: true,
          enum: type,
          values: [...enums.get(type)!],
        };
      if (!types.has(type))
        fail(
          "E_TYPE",
          `Unknown type “${type}”. Use text, int, number, bool, date or a declared enum; quote the header to keep a literal colon.`,
          cell.line,
          cell.column,
        );
      return { name, type: type as ColumnType, explicit: true };
    }
    return { name: cell.value, type: "text", explicit: false };
  });
}

export function convertValue(
  value: string,
  column: ColumnSchema,
  line: number,
  row: number,
): DataValue {
  const invalid = () =>
    fail(
      "E_TYPE",
      `Row ${row}, column “${column.name}”: expected ${column.type}, received ${JSON.stringify(value.length > 80 ? value.slice(0, 80) + "…" : value)}.`,
      line,
    );
  if (column.values && !column.values.includes(value))
    fail(
      "E_ENUM",
      `Row ${row}, column “${column.name}”: expected a member of enum ${column.enum}.`,
      line,
    );
  switch (column.type) {
    case "text":
      return value;
    case "int": {
      if (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
        return invalid();
      return Number(value);
    }
    case "number": {
      if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value))
        return invalid();
      const number = Number(value);
      if (
        !Number.isFinite(number) ||
        (Number.isInteger(number) && !Number.isSafeInteger(number))
      )
        return invalid();
      return number;
    }
    case "bool":
      if (value === "true") return true;
      if (value === "false") return false;
      return invalid();
    case "date":
      try {
        checkDate(value, line);
        return value;
      } catch {
        return invalid();
      }
  }
}

/** JSON conversion is explicit: CSV may legally contain duplicate header cells. */
export function toRecords(result: Compilation): Record<string, DataValue>[] {
  if (
    result.headers.some((name) => !name) ||
    new Set(result.headers).size !== result.headers.length
  ) {
    fail(
      "E_JSON_HEADER",
      "JSON objects need unique, non-empty column names. CSV export is still available.",
    );
  }
  return result.rows.map((row, index) =>
    Object.fromEntries(
      row.map((value, column) => [
        result.headers[column],
        convertValue(
          value,
          result.columns[column],
          result.origins[index][column].line,
          index + 1,
        ),
      ]),
    ),
  );
}
export function serializeJSON(result: Compilation, pretty = true): string {
  return JSON.stringify(toRecords(result), null, pretty ? 2 : undefined);
}
