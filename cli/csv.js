import { fail } from "./errors.js";
export const MAX_INPUT = 1000000;
/** Scan records, not physical lines: quoted fields may contain any line ending. */
export function scanRecords(input, directives = false) {
    if (input.length > MAX_INPUT)
        fail("E_LIMIT", `Input exceeds ${MAX_INPUT.toLocaleString()} characters.`);
    const records = [];
    let i = input.startsWith("\ufeff") ? 1 : 0;
    let line = 1, column = 1;
    function take() {
        const ch = input[i++];
        if (ch === "\r") {
            const out = input[i] === "\n" ? (i++, "\r\n") : "\r";
            line++;
            column = 1;
            return out;
        }
        if (ch === "\n") {
            line++;
            column = 1;
        }
        else
            column++;
        return ch;
    }
    while (i < input.length) {
        const start = i, recordLine = line;
        if (directives &&
            (input[i] === "@" ||
                input[i] === ">" ||
                input[i] === "#" ||
                input.slice(i).startsWith("include "))) {
            while (i < input.length && input[i] !== "\n" && input[i] !== "\r")
                take();
            const raw = input.slice(start, i);
            const kind = raw.startsWith("@")
                ? "directive"
                : raw.startsWith(">")
                    ? "control"
                    : raw.startsWith("#")
                        ? "comment"
                        : "include";
            records.push({ kind, raw, line: recordLine, cells: [] });
            if (i < input.length)
                take();
            continue;
        }
        const cells = [];
        let done = false;
        while (!done) {
            const fieldLine = line, fieldColumn = column;
            const quoted = input[i] === '"';
            let value = "";
            if (quoted) {
                take();
                let closed = false;
                while (i < input.length) {
                    if (input[i] === '"') {
                        take();
                        if (input[i] === '"') {
                            take();
                            value += '"';
                        }
                        else {
                            closed = true;
                            break;
                        }
                    }
                    else
                        value += take();
                }
                if (!closed)
                    fail("E_CSV_QUOTE", "Unclosed quoted field.", fieldLine, fieldColumn);
                if (i < input.length && ![",", "\r", "\n"].includes(input[i])) {
                    fail("E_CSV_QUOTE", "Only a comma or line ending may follow a closing quote.", line, column);
                }
            }
            else {
                while (i < input.length && ![",", "\r", "\n"].includes(input[i])) {
                    if (input[i] === '"')
                        fail("E_CSV_QUOTE", "Quote the entire field and double any quotes inside it.", line, column);
                    value += take();
                }
            }
            cells.push({ value, quoted, line: fieldLine, column: fieldColumn });
            if (input[i] === ",") {
                take();
                continue;
            }
            const raw = input.slice(start, i);
            records.push({ kind: "data", cells, raw, line: recordLine });
            if (i < input.length)
                take();
            done = true;
        }
    }
    return records;
}
export function parseCSV(input) {
    return scanRecords(input).map((r) => r.cells.map((c) => c.value));
}
export function serializeRow(row) {
    return row
        .map((value) => /[",\r\n]/.test(value) || (row.length === 1 && value === "")
        ? `"${value.replaceAll('"', '""')}"`
        : value)
        .join(",");
}
export function serializeCSV(rows) {
    return rows.map(serializeRow).join("\n");
}
