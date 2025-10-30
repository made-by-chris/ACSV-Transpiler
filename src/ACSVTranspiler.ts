// ACSV is Auto Comma-Separated Values, a CSV-like format that allows for automatic population of cells in your data.
// It is a superset of CSV, so any valid CSV is also valid ACSV.
// ACSV is not valid CSV, so it needs to be transpiled into CSV before it can be used.
// ACSV was made originally as a language for LLMs (language AI models) to efficiently generate data.

// ACSV syntax and operators:
// * a blank line * - indicates the next line is an ACSV control line
// # - lines starting with a # are comments and will be removed from the compiled CSV
// col_4+,col_2--,col_19=4 - this is what a typical control line looks like. the order of the instructions do not correspond to the order of the columns in the CSV.
// the instructions are matched to columns simply by their names.

// the basic operators are as follows:
// col_name+ - increment value of col_name by 1 for all following rows. (this is one-shot, not accumulating per-row)
// col_name- - decrement value of col_name by 1 for all following rows. (this is one-shot, not accumulating per-row)
// col_name=explicit_value - set value of col_name to explicit_value for all following rows.

// accumulating operators:
// col_name++ - increment value of col_name by 1 for all following rows. (this is accumulating per-row)
// col_name-- - decrement value of col_name by 1 for all following rows. (this is accumulating per-row)
// col_name++STOP - stop the accumulation of col_name++.
// col_name--STOP - stop the accumulation of col_name--.

import * as fs from "fs";
import * as path from "path";

export enum ASCV_Operator {
  ASSIGN = "=",
  PLUS = "+",
  MINUS = "-",
  PLUSPLUS = "++",
  MINUSMINUS = "--",
  STOP = "STOP",
}

interface Column_State {
  value: any;
  operator: ASCV_Operator;
}

export interface ACSV_Transpilation_Config {
  input: string;
  streaming: boolean;
  streaming_callback?: (output: string) => void;
  stats: boolean;
  stats_callback?: (stats: any) => void;
  baseDir?: string;
}

enum Line_Type {
  control_indicator = "control_indicator",
  comment = "comment",
  control = "control",
  data = "data",
}

interface Categorised_Line {
  type: Line_Type;
  cells: string[];
}

export default (
  config: ACSV_Transpilation_Config = { input: "ERR_ACSV transpiler input missing", streaming: false, streaming_callback: console.log, stats: true, stats_callback: console.log }
) => {
  // Preprocess includes (L3.12)
  function preprocess_includes(input: string, base_dir: string): string {
    return input.split(/\r?\n/).map(line => {
      const m = /^include\s+["'](.+)["']/.exec(line.trim());
      if (m) {
        const incPath = path.resolve(base_dir, m[1]);
        if (fs.existsSync(incPath)) {
          let included = fs.readFileSync(incPath, "utf8");
          included = preprocess_includes(included, path.dirname(incPath));
          // strip header: remove first non-empty, non-comment line if it looks like a header
          const lines = included.split(/\r?\n/);
          let headerRemoved = false;
          const withoutHeader = lines.filter((l) => {
            if (headerRemoved) return true;
            const t = l.trim();
            if (t === '' || t.startsWith('#')) return true;
            // looks like header if contains commas and no operators
            const looksHeader = t.includes(',') && !/[+=-]|\bSTOP\b|\bid\+\+|include\s/.test(t);
            headerRemoved = looksHeader;
            return !looksHeader;
          }).join("\n");
          return withoutHeader;
        } else {
          return `# ERROR: include not found: ${incPath}`;
        }
      } else {
        return line;
      }
    }).join("\n");
  }

  const base_dir = config.baseDir || (typeof __dirname !== 'undefined' ? __dirname : process.cwd());
  const input_with_includes = preprocess_includes(config.input, base_dir);
  const input = input_with_includes.replace(/\r\n/g, "\n").replace(/\r/g, "");
  const streaming = config.streaming;
  const streaming_callback = config.streaming_callback;
  const stats = config.stats;

  // internal variables for managing transpilation
  const acsv_control_line_indicator = ""; // if we encounter an empty line, this means the next line is an ACSV control line
  const input_lines = input.split("\n");
  // detect header as first non-comment, non-empty line
  const header_index = input_lines.findIndex((l) => {
    const t = l.trim();
    return t !== "" && !t.startsWith("#");
  });
  const header_cells = header_index >= 0 ? input_lines[header_index].trim().split(",") : [];

  // first we'll strip comments, and empty lines (which indicate the next line is an ACSV control line) and converted lines to Categorised_Line format
  const input_lines_categorised_with_split_cells = input_lines.slice(Math.max(header_index + 1, 0)).reduce((accumulator, current_line) => {
    // if the previous line(s) was an empty line, this line is an ACSV control line
    // starting at the end of the accumulator, loop backwards until we find a non-empty line
    let control_active = false;
    for (let i = accumulator.length - 1; i >= 0; i--) {
      if (accumulator[i].type === "control_indicator") {
        control_active = true;
      } else {
        break;
      }
    }
    // normalize whitespace-only lines
    const trimmed = current_line.trim();
    if (control_active) {
      // remove the control indicator line
      accumulator.pop();

      accumulator.push({ type: Line_Type.control, cells: trimmed.split(",") });
      return accumulator;
    } else if (trimmed.startsWith("#")) {
      // do nothing, this is a comment
    } else if (trimmed === "") {
      accumulator.push({ type: Line_Type.control_indicator, cells: [] });
    } else {
      // heuristic: if line looks like control (contains operators), treat as control
      const tokens = trimmed.split(",");
      const looksControl = tokens.some((tok) => /\+\+|--|\+|-|=|\bSTOP\b/.test(tok));
      if (looksControl) {
        accumulator.push({ type: Line_Type.control, cells: tokens });
      } else {
        accumulator.push({ type: Line_Type.data, cells: tokens });
      }
    }
    return accumulator;
  }, [] as Categorised_Line[]);
  const output_lines_as_cell_lists: string[][] = [];

  const all_column_names = header_cells;
  const controlled_columns_state: { [key: string]: Column_State } = {}; // contains the current value of a column, if it is an ACSV stateful column

  if (stats) {
    const stats_output = {
      control_lines: input_lines.filter((line) => line === acsv_control_line_indicator).length,
      comments: input_lines.filter((line) => line.startsWith("#")).length,
      blank_lines: input_lines.filter((line) => line === "").length,
      input_rows: input_lines.length,
      output_rows: 0,
    };
    stats_output.output_rows = stats_output.input_rows - stats_output.control_lines - stats_output.comments - stats_output.blank_lines;
    console.log(stats_output);
    console.log(input_lines_categorised_with_split_cells);
  }

  function expandRepeatsAndRanges(lines: Categorised_Line[]) {
    const result: Categorised_Line[] = [];
    for (const line of lines) {
      if (line.type !== "control") {
        result.push(line);
        continue;
      }

      const hasRepeat = line.cells.some(c => / x\d+$/.test(c));
      const hasRange = line.cells.some(c => /=\d+\.\.\d+$/.test(c));

      if (hasRepeat) {
        // Example: id++,name=John x3 → keep control once (without xN), then emit N blank data rows
        let repeat = 1;
        const controlCells = line.cells.map(cell => {
          const m = /(.*) x(\d+)$/.exec(cell);
          if (m) {
            repeat = Math.max(repeat, parseInt(m[2], 10) || 1);
            return m[1];
          }
          return cell;
        });
        // Apply control once
        result.push({ type: Line_Type.control, cells: controlCells });
        // Emit N data rows
        for (let i = 0; i < repeat; i++) {
          result.push({ type: Line_Type.data, cells: new Array(0) });
        }
        continue;
      }

      if (hasRange) {
        // Example: id=1..5 → for v in range: set id=v (control) then emit one data row
        const rangeCells = line.cells;
        const rangeSpec = rangeCells.find(c => /=\d+\.\.\d+$/.test(c)) as string;
        const m = /(.*?)=(\d+)\.\.(\d+)$/.exec(rangeSpec);
        if (m) {
          const start = Number(m[2]);
          const end = Number(m[3]);
          for (let v = start; v <= end; v++) {
            const adjusted = rangeCells.map(rc => {
              const rm = /(.*?)=(\d+)\.\.(\d+)$/.exec(rc);
              if (rm) return `${rm[1]}=${v}`;
              return rc;
            });
            result.push({ type: Line_Type.control, cells: adjusted });
            result.push({ type: Line_Type.data, cells: new Array(0) });
          }
          continue;
        }
      }

      // No repeat/range: keep as-is
      result.push(line);
    }
    return result;
  }

  const expanded_lines = expandRepeatsAndRanges(input_lines_categorised_with_split_cells);

  // Always output header first
  if (header_cells.length > 0) {
    output_lines_as_cell_lists.push(header_cells);
  }

  for (var i = 0; i < expanded_lines.length; i++) {
    const line = expanded_lines[i];
    switch (line.type) {
      case "control":
        handle_control_line(line);
        break;
      case "data": {
        let blanks = 1;
        if (line.cells.length === 0 || line.cells.every(c => c === "")) {
          // Count consecutive blank data lines (for input like multiple ',,,')
          blanks = 1;
          let j = i + 1;
          while (j < expanded_lines.length && expanded_lines[j].type === "data" && (expanded_lines[j].cells.length === 0 || expanded_lines[j].cells.every(c => c === ""))) {
            blanks++;
            j++;
          }
          for (let b = 0; b < blanks; b++) {
            handle_accumulating_columns();
            handle_data_line(line);
          }
          i += blanks - 1;
        } else {
          handle_accumulating_columns();
          handle_data_line(line);
        }
        break;
      }
    }
  }

  function handle_control_line(line: Categorised_Line) {
    const control_line = line.cells;
    // we need to separate the column names and the operators and values
    const dict: { [key: string]: { operator: ASCV_Operator; new_val?: any } } = {};
    control_line.forEach((instruction) => {
      const eqIdx = instruction.indexOf("=");
      if (eqIdx !== -1) {
        const column_name = instruction.slice(0, eqIdx).trim();
        const new_val = instruction.slice(eqIdx + 1);
        dict[column_name] = { operator: ASCV_Operator.ASSIGN, new_val };
        return;
      }
      // handle STOP variants
      if (/STOP$/.test(instruction)) {
        const name = instruction.split(/[+\-]/)[0].trim();
        dict[name] = { operator: ASCV_Operator.STOP };
        return;
      }
      // handle ++ and -- and one-shot + or -
      const name = instruction.split(/[+\-]/)[0].trim();
      const tail = instruction.slice(name.length);
      if (tail === "++") {
        dict[name] = { operator: ASCV_Operator.PLUSPLUS };
      } else if (tail === "--") {
        dict[name] = { operator: ASCV_Operator.MINUSMINUS };
      } else if (tail === "+") {
        dict[name] = { operator: ASCV_Operator.PLUS };
      } else if (tail === "-") {
        dict[name] = { operator: ASCV_Operator.MINUS };
      }
    });

    // now we have a dict of column names and operators, we can update controlled_columns_state
    // edge cases, like when adding a new column to the controlled_columns_state (if operator is ++ or --, we need to set the value to 0 before the operation)
    Object.keys(dict).forEach((column_name) => {
      const operator = dict[column_name].operator;
      const new_val = dict[column_name].new_val;

      if (!controlled_columns_state[column_name]) {
        controlled_columns_state[column_name] = { value: 0, operator: operator };
      }

      if (operator === ASCV_Operator.ASSIGN) {
        // we don't set the operator here, because we don't want to overwrite any accumlators
        controlled_columns_state[column_name].value = new_val;
      }
      if (operator === ASCV_Operator.PLUSPLUS) {
        controlled_columns_state[column_name].operator = ASCV_Operator.PLUSPLUS;
        // accumulating will be called in data row handler
      }
      if (operator === ASCV_Operator.MINUSMINUS) {
        controlled_columns_state[column_name].operator = ASCV_Operator.MINUSMINUS;
        // accumulating will be called in data row handler
      }
      if (operator === ASCV_Operator.STOP) {
        controlled_columns_state[column_name].operator = ASCV_Operator.STOP;
      }
      if (operator === ASCV_Operator.PLUS) {
        controlled_columns_state[column_name].operator = ASCV_Operator.PLUS;
        controlled_columns_state[column_name].value = parseFloat(controlled_columns_state[column_name].value) + 1;
        controlled_columns_state[column_name].operator = ASCV_Operator.STOP;
      }
      if (operator === ASCV_Operator.MINUS) {
        controlled_columns_state[column_name].operator = ASCV_Operator.MINUS;
        controlled_columns_state[column_name].value = parseFloat(controlled_columns_state[column_name].value) - 1;
        controlled_columns_state[column_name].operator = ASCV_Operator.STOP;
      }
    });
  }

  function handle_data_line(line: Categorised_Line) {
    // Build a row exactly the width of the header.
    const header_len = all_column_names.length;
    const new_row = new Array<string>(header_len).fill("");
    // Copy over explicit data cells by position up to header length
    for (let i = 0; i < header_len; i++) {
      if (i < line.cells.length) new_row[i] = line.cells[i];
    }
    // Apply controlled columns by name
    Object.keys(controlled_columns_state).forEach((column_name) => {
      const column_state = controlled_columns_state[column_name];
      const column_index = all_column_names.indexOf(column_name);
      if (column_index >= 0 && column_index < header_len) {
        new_row[column_index] = column_state.value;
      }
    });
    // Emit row
    output_lines_as_cell_lists.push(new_row);

    // if we're streaming, we'll call the callback with the new row
    if (streaming) {
      const out = new_row.join(",");
      if (out !== "") {
        if (streaming_callback) {
          streaming_callback(out as string);
        }
      }
    }
  }

  function handle_accumulating_columns() {
    // we need to iterate over controlled_columns_state and update the values of the columns that are accumulating
    Object.keys(controlled_columns_state).forEach((column_name) => {
      const column_state = controlled_columns_state[column_name];
      switch (column_state.operator) {
        case ASCV_Operator.PLUSPLUS:
          column_state.value = parseFloat(column_state.value) + 1;
          break;
        case ASCV_Operator.MINUSMINUS:
          column_state.value = parseFloat(column_state.value) - 1;
          break;
        default:
          break;
      }
    });
  }

  return output_lines_as_cell_lists.map((line) => line.join(",")).join("\n");
};
