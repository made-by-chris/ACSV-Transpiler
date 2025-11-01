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
  step?: number; // Step value for ++N (e.g., id++2 has step=2)
  lastEmittedValue?: any; // For STOP operator
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
  // Helper function to split CSV line respecting quoted values and parentheses
  function splitCSVLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenDepth = 0; // Track nested parentheses (for function calls like pad(id,5))

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if ((char === '"' || char === "'") && (i === 0 || line[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
          current += char;
        } else if (char === quoteChar) {
          // Check if it's an escaped quote or closing quote
          if (i + 1 < line.length && line[i + 1] === quoteChar) {
            // Escaped quote
            current += char + char;
            i++; // Skip next quote
          } else {
            // Closing quote
            inQuotes = false;
            current += char;
            quoteChar = '';
          }
        } else {
          current += char;
        }
      } else if (char === '(' && !inQuotes) {
        parenDepth++;
        current += char;
      } else if (char === ')' && !inQuotes) {
        parenDepth--;
        current += char;
      } else if (char === ',' && !inQuotes && parenDepth === 0) {
        // Only split on comma if not in quotes and not inside parentheses
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last cell
    cells.push(current.trim());
    return cells;
  }

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
  const header_cells = header_index >= 0 ? splitCSVLine(input_lines[header_index].trim()) : [];

  // NEW SYNTAX: Control lines are prefixed with > symbol
  // > id++,name=John  → control line
  // id=42,sku="SKU-123"  → data row
  // This removes ambiguity and makes intent explicit
  const input_lines_categorised_with_split_cells = input_lines.slice(Math.max(header_index + 1, 0)).reduce((accumulator, current_line) => {
    const trimmed = current_line.trim();

    if (trimmed.startsWith("#")) {
      // Comments are ignored
      return accumulator;
    } else if (trimmed === "") {
      // Empty lines are ignored (no longer used for control indication)
      return accumulator;
    } else if (trimmed.startsWith(">")) {
      // Lines starting with > are control lines
      const controlContent = trimmed.slice(1).trim(); // Remove > prefix
      const cells = splitCSVLine(controlContent);
      accumulator.push({ type: Line_Type.control, cells: cells });
    } else {
      // Everything else is a data row
      const cells = splitCSVLine(trimmed);
      accumulator.push({ type: Line_Type.data, cells: cells });
    }

    return accumulator;
  }, [] as Categorised_Line[]);
  const output_lines_as_cell_lists: string[][] = [];

  const all_column_names = header_cells;
  const controlled_columns_state: { [key: string]: Column_State } = {}; // contains the current value of a column, if it is an ACSV stateful column
  const previous_row: { [key: string]: any } = {}; // Track previous row values for prev() helper
  let data_row_count = 0; // Track number of data rows emitted

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
        // If control line has only assignments (no operators like ++), generate a row immediately
        // This handles cases like: > spend=900,tier=if(spend>1000,"GOLD","SILVER")
        const hasOnlyAssignments = line.cells.every(c => c.includes('=') && !c.includes('++') && !c.includes('--') && !c.includes('+') && !c.includes('-') && !/STOP$/.test(c));
        if (hasOnlyAssignments) {
          // Generate a blank data line to trigger row emission
          handle_data_line({ type: Line_Type.data, cells: [] });
        }
        break;
      case "data": {
        if (line.cells.length === 0 || line.cells.every(c => c === "")) {
          // Count consecutive blank data lines (for input like multiple ',,,')
          let blanks = 1;
          let j = i + 1;
          while (j < expanded_lines.length && expanded_lines[j].type === "data" && (expanded_lines[j].cells.length === 0 || expanded_lines[j].cells.every(c => c === ""))) {
            blanks++;
            j++;
          }
          for (let b = 0; b < blanks; b++) {
            // Emit current value, then accumulate for the next row
            // For the first blank row (b=0), emit current value without accumulating before
            // For subsequent rows, we've already accumulated after the previous row
            handle_data_line(line);
            // After emitting each row, accumulate for the next row
            handle_accumulating_columns();
          }
          // Emit one final row with the accumulated value after processing all blank rows
          handle_data_line(line);
          i += blanks - 1;
        } else {
          // For non-blank data rows, accumulate before handling
          handle_accumulating_columns();
          handle_data_line(line);
        }
        break;
      }
    }
  }

  // Helper function to check if a string is a date (YYYY-MM-DD format)
  function isDate(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(str);
  }

  // Helper function to increment a date by days
  function incrementDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper function to format a date
  function formatDate(dateStr: string, format: string): string {
    if (!isDate(dateStr)) return dateStr;
    const date = new Date(dateStr);
    if (format === "YYYY-MM-DD") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  // Evaluate an expression string, supporting column references, operators, and helper functions
  function evaluateExpression(expr: string, currentRow: { [key: string]: any }): any {
    if (!expr || expr.trim() === '') return '';

    expr = expr.trim();

    // Handle template strings: {column_name}
    expr = expr.replace(/\{(\w+)\}/g, (_match, colName) => {
      return currentRow[colName] !== undefined ? String(currentRow[colName]) : _match;
    });

    // Handle prev() helper: prev(column_name)
    expr = expr.replace(/prev\((\w+)\)/g, (_match, colName) => {
      return previous_row[colName] !== undefined ? String(previous_row[colName]) : '0';
    });

    // Handle if() conditional: if(condition, trueValue, falseValue)
    expr = expr.replace(/if\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, (_match, cond, trueVal, falseVal) => {
      const condResult = evaluateExpression(cond, currentRow);
      const numCond = parseFloat(String(condResult));
      const boolCond = !isNaN(numCond) ? numCond !== 0 : String(condResult).trim() !== '';
      return boolCond ? trueVal : falseVal;
    });

    // Handle formatDate(): formatDate(date + Nd, format)
    expr = expr.replace(/formatDate\s*\(([^,]+),\s*"([^"]+)"\)/g, (_match, dateExpr, format) => {
      const dateResult = evaluateExpression(dateExpr, currentRow);
      return formatDate(String(dateResult), format);
    });

    // Handle date arithmetic: date + Nd or date - Nd
    expr = expr.replace(/(\d{4}-\d{2}-\d{2})\s*\+\s*(\d+)d/g, (_match, dateStr, days) => {
      return incrementDate(dateStr, parseInt(days, 10));
    });
    expr = expr.replace(/(\d{4}-\d{2}-\d{2})\s*-\s*(\d+)d/g, (_match, dateStr, days) => {
      return incrementDate(dateStr, -parseInt(days, 10));
    });

    // Handle string methods: .lower(), .upper()
    expr = expr.replace(/"([^"]*)"\.lower\(\)/g, (_match, str) => str.toLowerCase());
    expr = expr.replace(/'([^']*)'\.lower\(\)/g, (_match, str) => str.toLowerCase());
    expr = expr.replace(/"([^"]*)"\.upper\(\)/g, (_match, str) => str.toUpperCase());
    expr = expr.replace(/'([^']*)'\.upper\(\)/g, (_match, str) => str.toUpperCase());

    // Handle pad() function: pad(value, width)
    expr = expr.replace(/pad\s*\(([^,]+),\s*(\d+)\)/g, (_match, val, width) => {
      const num = parseFloat(String(evaluateExpression(val, currentRow)));
      return String(isNaN(num) ? val : num).padStart(parseInt(width, 10), '0');
    });

    // Replace column references with their values
    Object.keys(currentRow).forEach(colName => {
      // Escape special regex characters in column name
      const escaped = colName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'g');
      expr = expr.replace(regex, String(currentRow[colName]));
    });

    // Handle string concatenation: "str1" + "str2"
    expr = expr.replace(/"([^"]*)"\s*\+\s*"([^"]*)"/g, (_match, str1, str2) => `"${str1}${str2}"`);
    expr = expr.replace(/'([^']*)'\s*\+\s*'([^']*)'/g, (_match, str1, str2) => `'${str1}${str2}'`);

    // Remove quotes from final result if it's a quoted string
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    // Try to evaluate as a mathematical expression
    try {
      // Replace remaining column references with numbers
      Object.keys(currentRow).forEach(colName => {
        const val = currentRow[colName];
        if (val !== undefined && val !== '') {
          // Escape special regex characters in column name
          const escaped = colName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'g');
          const numVal = parseFloat(String(val));
          if (!isNaN(numVal)) {
            expr = expr.replace(regex, String(numVal));
          }
        }
      });

      // Safe evaluation of mathematical expressions
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result === 'number') {
        return isNaN(result) ? expr : result;
      }
      return expr;
    } catch (e) {
      // If evaluation fails, return the expression as-is
      return expr;
    }
  }

  function handle_control_line(line: Categorised_Line) {
    const control_line = line.cells;
    // we need to separate the column names and the operators and values
    const dict: { [key: string]: { operator: ASCV_Operator; new_val?: any; step?: number } } = {};
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
      // handle ++N, --N with step values (e.g., id++2)
      const stepMatch = /^(\w+)(\+\+|\-\-)(\d+)$/.exec(instruction.trim());
      if (stepMatch) {
        const name = stepMatch[1];
        const op = stepMatch[2];
        const step = parseInt(stepMatch[3], 10);
        dict[name] = { operator: op === "++" ? ASCV_Operator.PLUSPLUS : ASCV_Operator.MINUSMINUS, step };
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
        // Initialize based on operator - ++ should start at 1 (unless step is specified)
        const initialValue = (operator === ASCV_Operator.PLUSPLUS && !dict[column_name]?.step) ? 1 : 0;
        controlled_columns_state[column_name] = { value: initialValue, operator: operator };
      }

      if (operator === ASCV_Operator.ASSIGN) {
        // Evaluate expression if it contains operators or functions
        const currentRowContext: { [key: string]: any } = {};
        Object.keys(controlled_columns_state).forEach(col => {
          currentRowContext[col] = controlled_columns_state[col].value;
        });
        const evaluatedVal = evaluateExpression(new_val, currentRowContext);
        controlled_columns_state[column_name].value = evaluatedVal;
      }
      if (operator === ASCV_Operator.PLUSPLUS) {
        controlled_columns_state[column_name].operator = ASCV_Operator.PLUSPLUS;
        controlled_columns_state[column_name].step = dict[column_name].step || 1;
        // Initialize value - if step is specified (e.g., id++2), start at step value, otherwise start at 1 for id++
        if (!controlled_columns_state[column_name].value || controlled_columns_state[column_name].value === 0) {
          if (dict[column_name].step) {
            controlled_columns_state[column_name].value = dict[column_name].step;
          } else {
            controlled_columns_state[column_name].value = 1;
          }
        }
        // accumulating will be called in data row handler
      }
      if (operator === ASCV_Operator.MINUSMINUS) {
        controlled_columns_state[column_name].operator = ASCV_Operator.MINUSMINUS;
        controlled_columns_state[column_name].step = dict[column_name].step || 1;
        // accumulating will be called in data row handler
      }
      if (operator === ASCV_Operator.STOP) {
        // When STOP is applied, save the current value as lastEmittedValue and stop accumulation
        // The value at this point is what will be used for subsequent rows
        if (controlled_columns_state[column_name]) {
          // Save current value before changing operator
          controlled_columns_state[column_name].lastEmittedValue = controlled_columns_state[column_name].value;
          controlled_columns_state[column_name].operator = ASCV_Operator.STOP;
        }
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

    // First pass: Build current row context from controlled columns and process inline assignments
    const currentRowContext: { [key: string]: any } = {};
    Object.keys(controlled_columns_state).forEach((column_name) => {
      currentRowContext[column_name] = controlled_columns_state[column_name].value;
    });

    // Process inline assignments in data row cells (e.g., value=15,diff=value - prev(value))
    for (let i = 0; i < header_len && i < line.cells.length; i++) {
      const cell = line.cells[i];
      if (cell && cell.includes('=')) {
        const eqIdx = cell.indexOf('=');
        const colName = cell.slice(0, eqIdx).trim();
        const expr = cell.slice(eqIdx + 1);

        // Evaluate the expression
        const evaluated = evaluateExpression(expr, currentRowContext);

        // Update both the current row context and controlled columns state
        currentRowContext[colName] = evaluated;
        if (controlled_columns_state[colName]) {
          controlled_columns_state[colName].value = evaluated;
        }
      }
    }

    // Second pass: Fill in row values from context
    for (let i = 0; i < header_len; i++) {
      const colName = all_column_names[i];

      // Check if there's an inline assignment for this column
      if (i < line.cells.length && line.cells[i].includes('=')) {
        const eqIdx = line.cells[i].indexOf('=');
        const assignedColName = line.cells[i].slice(0, eqIdx).trim();
        if (assignedColName === colName && currentRowContext[colName] !== undefined) {
          new_row[i] = String(currentRowContext[colName]);
          continue;
        }
      }

      // Use explicit data cell if present
      if (i < line.cells.length && line.cells[i] && !line.cells[i].includes('=')) {
        const cell = line.cells[i].trim();
        // Evaluate expressions in data cells
        if (cell && (cell.includes('+') || cell.includes('-') || cell.includes('*') || cell.includes('/') || cell.includes('prev(') || cell.includes('if(') || cell.includes('{') || cell.includes('formatDate') || cell.includes('pad(') || cell.includes('.lower') || cell.includes('.upper'))) {
          new_row[i] = String(evaluateExpression(cell, currentRowContext));
        } else {
          new_row[i] = cell;
        }
        continue;
      }

      // Apply controlled columns by name
      if (currentRowContext[colName] !== undefined) {
        new_row[i] = String(currentRowContext[colName]);
      } else if (controlled_columns_state[colName]) {
        const colState = controlled_columns_state[colName];
        // If STOP was applied, use the last emitted value
        if (colState.operator === ASCV_Operator.STOP && colState.lastEmittedValue !== undefined) {
          new_row[i] = String(colState.lastEmittedValue);
        } else {
          new_row[i] = String(colState.value);
        }
      }
    }

    // Update previous row values for prev() helper (after current row is built)
    for (let i = 0; i < header_len; i++) {
      const colName = all_column_names[i];
      previous_row[colName] = new_row[i];
    }

    // Emit row
    output_lines_as_cell_lists.push(new_row);
    data_row_count++;

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
    // Check if there's any accumulating operator active
    const hasAccumulating = Object.values(controlled_columns_state).some(
      col => col.operator === ASCV_Operator.PLUSPLUS || col.operator === ASCV_Operator.MINUSMINUS
    );

    // we need to iterate over controlled_columns_state and update the values of the columns that are accumulating
    Object.keys(controlled_columns_state).forEach((column_name) => {
      const column_state = controlled_columns_state[column_name];
      const step = column_state.step || 1;
      switch (column_state.operator) {
        case ASCV_Operator.PLUSPLUS:
          const currentVal = column_state.value;
          if (isDate(String(currentVal))) {
            // Auto-increment dates day by day
            column_state.value = incrementDate(String(currentVal), step);
          } else {
            const numVal = parseFloat(String(currentVal));
            column_state.value = isNaN(numVal) ? currentVal : numVal + step;
          }
          break;
        case ASCV_Operator.MINUSMINUS:
          const currentVal2 = column_state.value;
          if (isDate(String(currentVal2))) {
            column_state.value = incrementDate(String(currentVal2), -step);
          } else {
            const numVal = parseFloat(String(currentVal2));
            column_state.value = isNaN(numVal) ? currentVal2 : numVal - step;
          }
          break;
        case ASCV_Operator.ASSIGN:
          // Auto-increment dates if assigned and there's an accumulating column active
          // Only increment AFTER the first data row has been emitted
          if (hasAccumulating && isDate(String(column_state.value)) && data_row_count > 0) {
            column_state.value = incrementDate(String(column_state.value), 1);
          }
          break;
        default:
          break;
      }
    });
  }

  return output_lines_as_cell_lists.map((line) => line.join(",")).join("\n");
};
