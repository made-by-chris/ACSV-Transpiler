// ACSV is Auto-Comma-Separated-Values, a CSV-like format that allows for automatic population of cells in your data.
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

export enum ASCV_Operator {
  ASSIGN = "=",
  PLUS = "+",
  MINUS = "-",
  PLUSPLUS = "++",
  MINUSMINUS = "--",
  STOP = "STOP",
}

const symbol_to_operator = {
  "=": ASCV_Operator.ASSIGN,
  "+": ASCV_Operator.PLUS,
  "-": ASCV_Operator.MINUS,
  "++": ASCV_Operator.PLUSPLUS,
  "--": ASCV_Operator.MINUSMINUS,
  STOP: ASCV_Operator.STOP,
};

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
  const input = config.input;
  const streaming = config.streaming;
  const streaming_callback = config.streaming_callback;
  const stats = config.stats;

  // internal variables for managing transpilation
  const acsv_control_line_indicator = ""; // if we encounter an empty line, this means the next line is an ACSV control line
  const input_lines = input.split("\n");

  // first we'll strip comments, and empty lines (which indicate the next line is an ACSV control line) and converted lines to Categorised_Line format
  const input_lines_categorised_with_split_cells = input_lines.reduce((accumulator, current_line) => {
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
    if (control_active) {
      // remove the control indicator line
      accumulator.pop();

      accumulator.push({ type: Line_Type.control, cells: current_line.split(",") });
      return accumulator;
    } else if (current_line.startsWith("#")) {
      // do nothing, this is a comment
    } else if (current_line === "") {
      accumulator.push({ type: Line_Type.control_indicator, cells: [] });
    } else {
      accumulator.push({ type: Line_Type.data, cells: current_line.split(",") });
    }
    return accumulator;
  }, [] as Categorised_Line[]);
  const output_lines_as_cell_lists: string[][] = [];

  const all_column_names = input_lines[0].split(",");
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

  // begin transpilation with a for loop over lines_as_cell_lists
  // we'll keep an eye on stateful things
  // our main stateful variables are:
  // controlled_columns_state ( for tracking in-memory the current value of a column )
  // output_lines_as_cell_lists which we push to as we go

  for (var i = 0; i < input_lines_categorised_with_split_cells.length; i++) {
    const line = input_lines_categorised_with_split_cells[i];
    switch (line.type) {
      case "control":
        handle_control_line(line); // updates controlled_columns_state
        break;
      case "data":
        handle_accumulating_columns(); // updates controlled_columns_state
        handle_data_line(line); // updates output_lines_as_cell_lists
        break;
      case "control_indicator":
      case "comment":
        break;
      default:
        console.log("ERR: unrecognised line type");
        break;
    }
  }

  function handle_control_line(line: Categorised_Line) {
    const control_line = line.cells;
    // we need to separate the column names and the operators and values
    const dict: { [key: string]: { operator: ASCV_Operator; new_val?: any } } = {};
    control_line.forEach((instruction) => {
      const column_name = instruction.split(/[+=-]/)[0].trim(); // this will split the instruction at the first +, -, or = character
      // edge case for handling = followed by a value
      if (instruction.includes("=")) {
        const new_val = instruction.split("=")[1];
        dict[column_name] = { operator: ASCV_Operator.ASSIGN, new_val: new_val };
      } else {
        // @ts-ignore
        const operator = symbol_to_operator[instruction.split(column_name)[1]];
        dict[column_name] = { operator: operator };
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
      }
      if (operator === ASCV_Operator.MINUS) {
        controlled_columns_state[column_name].operator = ASCV_Operator.MINUS;
        controlled_columns_state[column_name].value = parseFloat(controlled_columns_state[column_name].value) - 1;
      }
    });
  }

  function handle_data_line(line: Categorised_Line) {
    // so the operation strategy is soft. we don't create columns if they don't exist, we just ignore ACSV controls for unrecognised columns.
    // we'll create a new row, and then populate it with the values from the input line, and then populate it with the values from the controlled_columns_state
    // by matching the column names to index positions in the array.

    // create a new row
    const new_row = [...line.cells];
    // for every entry in controlled_columns_state, we'll set or mutate the value of the corresponding column in the new row
    Object.keys(controlled_columns_state).forEach((column_name) => {
      const column_state = controlled_columns_state[column_name];
      const column_index = all_column_names.indexOf(column_name);
      new_row[column_index] = column_state.value;
    });
    // push the new row to the output
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
