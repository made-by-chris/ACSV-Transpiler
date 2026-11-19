import { fail } from "./errors.js";
import { randomUnit, type GeneratorContext } from "./generators.js";

type Value = string | number | boolean | { days: number };
export type Expression =
  | { kind: "literal"; value: Value; verbatim?: boolean }
  | { kind: "enum"; name: string; values: readonly string[] }
  | { kind: "ref"; name: string }
  | { kind: "unary"; op: string; value: Expression }
  | { kind: "binary"; op: string; left: Expression; right: Expression }
  | { kind: "call"; name: string; args: Expression[]; id?: number }
  | { kind: "method"; name: string; value: Expression };
interface Token {
  type: string;
  text: string;
  value?: Value;
}
const arities: Record<string, [number, number]> = {
  if: [3, 3],
  prev: [1, 1],
  pad: [2, 2],
  formatDate: [2, 2],
  seq: [0, 2],
  cycle: [1, 32],
  round: [1, 2],
  min: [1, 32],
  max: [1, 32],
  clamp: [3, 3],
  pow: [2, 2],
  rand: [0, 2],
  randFloat: [0, 2],
  randInt: [2, 2],
  choice: [1, 32],
  choiceWeighted: [2, 32],
  normal: [0, 2],
  latitude: [0, 2],
  longitude: [0, 2],
  today: [0, 0],
  now: [0, 0],
  tomorrow: [0, 0],
  yesterday: [0, 0],
};
const functions = new Set(Object.keys(arities));
const deferred = new Set(["maybe", "faker"]);

export function splitControls(source: string, line: number): string[] {
  const parts: string[] = [];
  let start = 0,
    depth = 0,
    quote = "";
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) {
        if (source[i + 1] === quote) i++;
        else quote = "";
      }
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") {
      if (--depth < 0)
        fail("E_EXPRESSION", "Unmatched closing parenthesis.", line);
    } else if (c === "," && depth === 0) {
      parts.push(source.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (quote || depth)
    fail(
      "E_EXPRESSION",
      "Unclosed quote or parenthesis in control line.",
      line,
    );
  parts.push(source.slice(start).trim());
  return parts;
}

export function parseExpression(
  source: string,
  headers: ReadonlySet<string>,
  line: number,
  enums: ReadonlyMap<string, readonly string[]> = new Map(),
  extended = true,
): Expression {
  const text = source.trim();
  if (!text) return { kind: "literal", value: "" };
  if (
    /^(?:maybe|faker)\b/.test(text) ||
    (/^(?:randInt|randFloat|choice|choiceWeighted)\b/.test(text) &&
      /\bseed\s*=|\[/.test(text))
  )
    fail(
      "E_UNSUPPORTED",
      "Unsupported generator syntax. Use ZROW 0.3, a document seed, and positional arguments; nullable and Faker generators are not implemented.",
      line,
    );
  if (text.length > 4000) fail("E_LIMIT", "Expression is too long.", line);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    checkDate(text, line);
    return { kind: "literal", value: text };
  }
  if (
    /^[\p{L}_][\p{L}\p{N}_ ]*$/u.test(text) &&
    !headers.has(text) &&
    !enums.has(text) &&
    !["true", "false"].includes(text)
  ) {
    return { kind: "literal", value: text };
  }
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) {
      i++;
      continue;
    }
    const c = text[i];
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      let value = "",
        closed = false;
      while (i < text.length) {
        if (text[i] === quote) {
          i++;
          if (text[i] === quote) {
            value += quote;
            i++;
          } else {
            closed = true;
            break;
          }
        } else if (text[i] === "\\") {
          const escape = text[++i];
          const escapes: Record<string, string> = {
            n: "\n",
            r: "\r",
            t: "\t",
            "\\": "\\",
            '"': '"',
            "'": "'",
          };
          if (!(escape in escapes))
            fail("E_EXPRESSION", "Unsupported string escape.", line);
          value += escapes[escape];
          i++;
        } else value += text[i++];
      }
      if (!closed) fail("E_EXPRESSION", "Unclosed string.", line);
      tokens.push({ type: "literal", text: value, value });
    } else {
      const number = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(
        text.slice(i),
      );
      const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i));
      const op = /^(?:>=|<=|==|!=|[+\-*/%<>()!,.])/.exec(text.slice(i));
      if (number) {
        i += number[0].length;
        let value: Value = Number(number[0]);
        if (text[i] === "d" && !/[\w]/.test(text[i + 1] || "")) {
          i++;
          value = { days: Number(number[0]) };
        }
        tokens.push({ type: "literal", text: number[0], value });
      } else if (name) {
        i += name[0].length;
        tokens.push(
          ["true", "false"].includes(name[0])
            ? { type: "literal", text: name[0], value: name[0] === "true" }
            : { type: "name", text: name[0] },
        );
      } else if (op) {
        i += op[0].length;
        tokens.push({ type: op[0], text: op[0] });
      } else
        fail(
          "E_EXPRESSION",
          `Unexpected character “${c}”. Quote literal text.`,
          line,
          i + 1,
        );
    }
    if (tokens.length > 256)
      fail("E_LIMIT", "Expression is too complex.", line);
  }
  tokens.push({ type: "end", text: "" });
  let pos = 0;
  const precedence: Record<string, number> = {
    "==": 1,
    "!=": 1,
    "<": 2,
    ">": 2,
    "<=": 2,
    ">=": 2,
    "+": 3,
    "-": 3,
    "*": 4,
    "/": 4,
    "%": 4,
  };
  function expect(type: string) {
    if (tokens[pos].type !== type)
      fail("E_EXPRESSION", `Expected “${type}”.`, line);
    pos++;
  }
  let callId = 0;
  function parse(min = 0, depth = 0): Expression {
    if (depth > 40) fail("E_LIMIT", "Expression nesting is too deep.", line);
    const token = tokens[pos++];
    let left: Expression;
    if (token.type === "literal")
      left = { kind: "literal", value: token.value! };
    else if (["+", "-", "!"].includes(token.type))
      left = { kind: "unary", op: token.type, value: parse(5, depth + 1) };
    else if (token.type === "(") {
      left = parse(0, depth + 1);
      expect(")");
    } else if (token.type === "name") {
      if (deferred.has(token.text))
        fail(
          "E_UNSUPPORTED",
          `${token.text} is not part of the deterministic core.`,
          line,
        );
      if (tokens[pos].type === "(") {
        if (!functions.has(token.text))
          fail("E_EXPRESSION", `Unknown function “${token.text}”.`, line);
        if (
          !extended &&
          [
            "rand",
            "randFloat",
            "randInt",
            "choice",
            "choiceWeighted",
            "normal",
            "latitude",
            "longitude",
            "today",
            "now",
            "tomorrow",
            "yesterday",
          ].includes(token.text)
        )
          fail("E_UNSUPPORTED", `${token.text} requires # ZROW 0.3.`, line);
        const id = callId++;
        pos++;
        let args: Expression[] = [];
        if (tokens[pos].type !== ")") {
          do {
            args.push(parse(0, depth + 1));
            if (tokens[pos].type !== ",") break;
            pos++;
          } while (true);
        }
        expect(")");
        if (["cycle", "choice"].includes(token.text))
          args = args.flatMap((arg) =>
            arg.kind === "enum"
              ? arg.values.map((value) => ({
                  kind: "literal" as const,
                  value,
                  verbatim: true,
                }))
              : [arg],
          );
        const [minimum, maximum] = arities[token.text];
        if (args.length < minimum || args.length > maximum)
          fail(
            "E_EXPRESSION",
            `${token.text} expects ${minimum === maximum ? minimum : `${minimum}–${maximum}`} arguments.`,
            line,
          );
        left = { kind: "call", name: token.text, args, id };
      } else if (enums.has(token.text)) {
        left = {
          kind: "enum",
          name: token.text,
          values: enums.get(token.text)!,
        };
      } else {
        if (!headers.has(token.text))
          fail(
            "E_COLUMN",
            `Unknown column “${token.text}”. Quote literal text.`,
            line,
          );
        left = { kind: "ref", name: token.text };
      }
    } else fail("E_EXPRESSION", "Expected a value or column name.", line);
    while (tokens[pos].type === ".") {
      pos++;
      const method = tokens[pos++].text;
      if (!["lower", "upper"].includes(method))
        fail("E_EXPRESSION", `Unknown string helper “${method}”.`, line);
      expect("(");
      expect(")");
      left = { kind: "method", name: method, value: left };
    }
    while ((precedence[tokens[pos].type] ?? -1) >= min) {
      const op = tokens[pos++].type;
      left = {
        kind: "binary",
        op,
        left,
        right: parse(precedence[op] + 1, depth + 1),
      };
    }
    return left;
  }
  const result = parse();
  if (tokens[pos].type !== "end")
    fail("E_EXPRESSION", "Unexpected text after expression.", line);
  return result;
}

function numeric(value: Value, line: number): number {
  if (
    typeof value === "object" ||
    typeof value === "boolean" ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value))
  ) {
    fail(
      "E_EXPRESSION",
      `Expected a finite number, received “${String(value)}”.`,
      line,
    );
  }
  return Number(value);
}
function truth(value: Value): boolean {
  return (
    value !== false &&
    value !== 0 &&
    value !== "" &&
    value !== "0" &&
    value !== "false"
  );
}
export function checkDate(value: string, line: number): number {
  const time = Date.parse(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  ) {
    fail("E_EXPRESSION", `Invalid ISO date “${value}”.`, line);
  }
  return time;
}
export function advance(value: string, step: number, line: number): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!Number.isInteger(step))
      fail("E_EXPRESSION", "Date steps must be whole days.", line);
    const date = new Date(checkDate(value, line) + step * 86400000);
    if (
      !Number.isFinite(date.getTime()) ||
      date.getUTCFullYear() > 9999 ||
      date.getUTCFullYear() < 0
    )
      fail("E_EXPRESSION", "Date is out of range.", line);
    return date.toISOString().slice(0, 10);
  }
  const number = numeric(value, line) + step;
  if (
    !Number.isFinite(number) ||
    (Number.isInteger(number) && !Number.isSafeInteger(number))
  )
    fail(
      "E_EXPRESSION",
      "Counter value is outside the safe numeric range.",
      line,
    );
  return String(number);
}

export function evaluate(
  expression: Expression,
  get: (name: string) => string,
  previous: ReadonlyMap<string, string>,
  line: number,
  index = 0,
  context?: GeneratorContext,
): string {
  function visit(node: Expression): Value {
    const value = compute(node);
    if (typeof value === "string" && value.length > 100_000)
      fail("E_LIMIT", "A generated cell exceeds 100,000 characters.", line);
    if (typeof value === "number" && !Number.isFinite(value))
      fail("E_EXPRESSION", "Number is out of range.", line);
    return value;
  }
  function compute(node: Expression): Value {
    if (node.kind === "literal") {
      if (typeof node.value === "string" && !node.verbatim) {
        let length = node.value.length;
        return node.value.replace(
          /\{([A-Za-z_]\w*)\}/g,
          (match, name: string) => {
            const value = get(name);
            length += value.length - match.length;
            if (length > 100_000)
              fail(
                "E_LIMIT",
                "A generated cell exceeds 100,000 characters.",
                line,
              );
            return value;
          },
        );
      }
      return node.value;
    }
    if (node.kind === "enum")
      fail(
        "E_ENUM",
        "Use an enum list inside cycle(...) or choice(...).",
        line,
      );
    if (node.kind === "ref") return get(node.name);
    if (node.kind === "method") {
      const value = String(visit(node.value));
      return node.name === "lower" ? value.toLowerCase() : value.toUpperCase();
    }
    if (node.kind === "unary") {
      const value = visit(node.value);
      return node.op === "!"
        ? !truth(value)
        : numeric(value, line) * (node.op === "-" ? -1 : 1);
    }
    if (node.kind === "call") {
      if (["today", "now", "tomorrow", "yesterday"].includes(node.name)) {
        if (!context) fail("E_TIME", "Clock context is unavailable.", line);
        if (node.name === "now") return context.referenceTime;
        const date = context.referenceTime.slice(0, 10);
        return advance(
          date,
          node.name === "tomorrow" ? 1 : node.name === "yesterday" ? -1 : 0,
          line,
        );
      }
      if (
        [
          "rand",
          "randFloat",
          "randInt",
          "choice",
          "choiceWeighted",
          "normal",
          "latitude",
          "longitude",
        ].includes(node.name)
      ) {
        if (context?.seed === undefined)
          fail(
            "E_SEED",
            "Random generators require (seed 42) or a seed configuration.",
            line,
          );
        let draw = 0;
        const unit = () =>
          randomUnit(
            context.seed!,
            context.column,
            index,
            node.id ?? 0,
            draw++,
          );
        if (node.name === "choice")
          return visit(node.args[Math.floor(unit() * node.args.length)]);
        if (node.name === "choiceWeighted") {
          if (node.args.length % 2)
            fail(
              "E_EXPRESSION",
              "choiceWeighted expects value,weight pairs.",
              line,
            );
          const weights = node.args
            .filter((_, i) => i % 2)
            .map((arg) => numeric(visit(arg), line));
          const total = weights.reduce((a, b) => a + b, 0);
          if (
            weights.some((w) => w < 0) ||
            !Number.isFinite(total) ||
            total <= 0
          )
            fail(
              "E_EXPRESSION",
              "Weights must be nonnegative and have a positive finite sum.",
              line,
            );
          let target = unit() * total;
          for (let i = 0; i < weights.length; i++) {
            target -= weights[i];
            if (target < 0) return visit(node.args[i * 2]);
          }
          return visit(
            node.args[weights.lastIndexOf(Math.max(...weights)) * 2],
          );
        }
        const values = node.args.map((arg) => numeric(visit(arg), line));
        if (node.name === "normal") {
          if (values.length === 1)
            fail(
              "E_EXPRESSION",
              "Use normal() or normal(mean,standardDeviation).",
              line,
            );
          const mean = values[0] ?? 0,
            sd = values[1] ?? 1;
          if (sd < 0)
            fail(
              "E_EXPRESSION",
              "Standard deviation must be nonnegative.",
              line,
            );
          return (
            mean +
            sd *
              Math.sqrt(-2 * Math.log(1 - unit())) *
              Math.cos(2 * Math.PI * unit())
          );
        }
        if (values.length === 1)
          fail(
            "E_EXPRESSION",
            "Supply both minimum and maximum, or neither.",
            line,
          );
        const lat = node.name === "latitude",
          lon = node.name === "longitude";
        const lo = values[0] ?? (lat ? -90 : lon ? -180 : 0),
          hi = values[1] ?? (lat ? 90 : lon ? 180 : 1);
        if (lo > hi || !Number.isFinite(hi - lo))
          fail(
            "E_EXPRESSION",
            "Minimum must not exceed maximum and the range must be finite.",
            line,
          );
        if ((lat && (lo < -90 || hi > 90)) || (lon && (lo < -180 || hi > 180)))
          fail(
            "E_EXPRESSION",
            "Coordinates are outside geographic bounds.",
            line,
          );
        if (node.name === "randInt") {
          const span = hi - lo + 1;
          if (
            !Number.isSafeInteger(lo) ||
            !Number.isSafeInteger(hi) ||
            span > 4294967296
          )
            fail(
              "E_EXPRESSION",
              "randInt needs safe integer bounds spanning at most 2^32 values.",
              line,
            );
          const limit = Math.floor(4294967296 / span) * span;
          for (let i = 0; i < 128; i++) {
            const bits = Math.floor(unit() * 4294967296);
            if (bits < limit) return lo + (bits % span);
          }
          fail(
            "E_LIMIT",
            "Random integer sampling exceeded its work limit.",
            line,
          );
        }
        const u = unit();
        if (lat) {
          if (lo === hi) return lo;
          const low = Math.sin((lo * Math.PI) / 180),
            high = Math.sin((hi * Math.PI) / 180);
          return Math.max(
            lo,
            Math.min(hi, (Math.asin(low + (high - low) * u) * 180) / Math.PI),
          );
        }
        return lo + (hi - lo) * u;
      }
      if (node.name === "if")
        return visit(node.args[truth(visit(node.args[0])) ? 1 : 2]);
      if (node.name === "prev") {
        if (node.args[0].kind !== "ref")
          fail("E_EXPRESSION", "prev expects a column name.", line);
        return previous.get(node.args[0].name) ?? "0";
      }
      if (node.name === "seq") {
        const start = node.args.length ? visit(node.args[0]) : 1;
        const step =
          node.args.length > 1 ? numeric(visit(node.args[1]), line) : 1;
        if (
          /^\d{4}-\d{2}-\d{2}$/.test(String(start)) &&
          !Number.isInteger(step)
        )
          fail("E_EXPRESSION", "Date sequence steps must be whole days.", line);
        return advance(String(start), index * step, line);
      }
      if (node.name === "cycle")
        return visit(node.args[index % node.args.length]);
      if (["round", "min", "max", "clamp", "pow"].includes(node.name)) {
        const values = node.args.map((arg) => numeric(visit(arg), line));
        if (node.name === "min") return Math.min(...values);
        if (node.name === "max") return Math.max(...values);
        if (node.name === "pow") return Math.pow(values[0], values[1]);
        if (node.name === "clamp") {
          if (values[1] > values[2])
            fail(
              "E_EXPRESSION",
              "clamp minimum must not exceed maximum.",
              line,
            );
          return Math.max(values[1], Math.min(values[2], values[0]));
        }
        const digits = values[1] ?? 0;
        if (!Number.isInteger(digits) || digits < 0 || digits > 8)
          fail(
            "E_LIMIT",
            "round decimal places must be an integer from 0 to 8.",
            line,
          );
        const scale = 10 ** digits;
        return Math.round(values[0] * scale) / scale;
      }
      const a = visit(node.args[0]),
        b = visit(node.args[1]);
      if (node.name === "pad") {
        const width = numeric(b, line);
        if (!Number.isInteger(width) || width < 0 || width > 100)
          fail("E_LIMIT", "Padding width must be between 0 and 100.", line);
        return String(a).padStart(width, "0");
      }
      if (b !== "YYYY-MM-DD")
        fail("E_EXPRESSION", "formatDate supports YYYY-MM-DD only.", line);
      checkDate(String(a), line);
      return String(a);
    }
    const a = visit(node.left),
      b = visit(node.right);
    if ((node.op === "+" || node.op === "-") && typeof b === "object")
      return advance(String(a), b.days * (node.op === "-" ? -1 : 1), line);
    if (["==", "!=", "<", ">", "<=", ">="].includes(node.op)) {
      const numericPair =
        String(a).trim() !== "" &&
        String(b).trim() !== "" &&
        Number.isFinite(Number(a)) &&
        Number.isFinite(Number(b));
      const left = numericPair ? Number(a) : String(a),
        right = numericPair ? Number(b) : String(b);
      switch (node.op) {
        case "==":
          return left === right;
        case "!=":
          return left !== right;
        case "<":
          return left < right;
        case ">":
          return left > right;
        case "<=":
          return left <= right;
        default:
          return left >= right;
      }
    }
    if (
      node.op === "+" &&
      (!Number.isFinite(Number(a)) || !Number.isFinite(Number(b)))
    )
      return String(a) + String(b);
    const left = numeric(a, line),
      right = numeric(b, line);
    let result: number;
    switch (node.op) {
      case "+":
        result = left + right;
        break;
      case "-":
        result = left - right;
        break;
      case "*":
        result = left * right;
        break;
      case "/":
        result = left / right;
        break;
      default:
        result = left % right;
    }
    if (!Number.isFinite(result))
      fail("E_EXPRESSION", "Arithmetic produced a non-finite result.", line);
    return result;
  }
  const result = visit(expression);
  if (typeof result === "object")
    fail(
      "E_EXPRESSION",
      "A duration must be added to or subtracted from a date.",
      line,
    );
  return String(result);
}
