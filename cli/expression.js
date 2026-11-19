import { fail } from "./errors.js";
const arities = {
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
};
const functions = new Set(Object.keys(arities));
const deferred = new Set([
    "maybe",
    "randInt",
    "randFloat",
    "choice",
    "choiceWeighted",
    "faker",
]);
export function splitControls(source, line) {
    const parts = [];
    let start = 0, depth = 0, quote = "";
    for (let i = 0; i < source.length; i++) {
        const c = source[i];
        if (quote) {
            if (c === "\\") {
                i++;
                continue;
            }
            if (c === quote) {
                if (source[i + 1] === quote)
                    i++;
                else
                    quote = "";
            }
        }
        else if (c === '"' || c === "'")
            quote = c;
        else if (c === "(")
            depth++;
        else if (c === ")") {
            if (--depth < 0)
                fail("E_EXPRESSION", "Unmatched closing parenthesis.", line);
        }
        else if (c === "," && depth === 0) {
            parts.push(source.slice(start, i).trim());
            start = i + 1;
        }
    }
    if (quote || depth)
        fail("E_EXPRESSION", "Unclosed quote or parenthesis in control line.", line);
    parts.push(source.slice(start).trim());
    return parts;
}
export function parseExpression(source, headers, line) {
    const text = source.trim();
    if (!text)
        return { kind: "literal", value: "" };
    if (/^(?:maybe|randInt|randFloat|choice|choiceWeighted|faker)\b/.test(text))
        fail("E_UNSUPPORTED", "Random, nullable and Faker generators are deferred; use literal values in the core.", line);
    if (text.length > 4000)
        fail("E_LIMIT", "Expression is too long.", line);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        checkDate(text, line);
        return { kind: "literal", value: text };
    }
    if (/^[\p{L}_][\p{L}\p{N}_ ]*$/u.test(text) &&
        !headers.has(text) &&
        !["true", "false"].includes(text)) {
        return { kind: "literal", value: text };
    }
    const tokens = [];
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
            let value = "", closed = false;
            while (i < text.length) {
                if (text[i] === quote) {
                    i++;
                    if (text[i] === quote) {
                        value += quote;
                        i++;
                    }
                    else {
                        closed = true;
                        break;
                    }
                }
                else if (text[i] === "\\") {
                    const escape = text[++i];
                    const escapes = {
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
                }
                else
                    value += text[i++];
            }
            if (!closed)
                fail("E_EXPRESSION", "Unclosed string.", line);
            tokens.push({ type: "literal", text: value, value });
        }
        else {
            const number = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(text.slice(i));
            const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i));
            const op = /^(?:>=|<=|==|!=|[+\-*/%<>()!,.])/.exec(text.slice(i));
            if (number) {
                i += number[0].length;
                let value = Number(number[0]);
                if (text[i] === "d" && !/[\w]/.test(text[i + 1] || "")) {
                    i++;
                    value = { days: Number(number[0]) };
                }
                tokens.push({ type: "literal", text: number[0], value });
            }
            else if (name) {
                i += name[0].length;
                tokens.push(["true", "false"].includes(name[0])
                    ? { type: "literal", text: name[0], value: name[0] === "true" }
                    : { type: "name", text: name[0] });
            }
            else if (op) {
                i += op[0].length;
                tokens.push({ type: op[0], text: op[0] });
            }
            else
                fail("E_EXPRESSION", `Unexpected character “${c}”. Quote literal text.`, line, i + 1);
        }
        if (tokens.length > 256)
            fail("E_LIMIT", "Expression is too complex.", line);
    }
    tokens.push({ type: "end", text: "" });
    let pos = 0;
    const precedence = {
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
    function expect(type) {
        if (tokens[pos].type !== type)
            fail("E_EXPRESSION", `Expected “${type}”.`, line);
        pos++;
    }
    function parse(min = 0, depth = 0) {
        if (depth > 40)
            fail("E_LIMIT", "Expression nesting is too deep.", line);
        const token = tokens[pos++];
        let left;
        if (token.type === "literal")
            left = { kind: "literal", value: token.value };
        else if (["+", "-", "!"].includes(token.type))
            left = { kind: "unary", op: token.type, value: parse(5, depth + 1) };
        else if (token.type === "(") {
            left = parse(0, depth + 1);
            expect(")");
        }
        else if (token.type === "name") {
            if (deferred.has(token.text))
                fail("E_UNSUPPORTED", `${token.text} is not part of the deterministic core.`, line);
            if (tokens[pos].type === "(") {
                if (!functions.has(token.text))
                    fail("E_EXPRESSION", `Unknown function “${token.text}”.`, line);
                pos++;
                const args = [];
                if (tokens[pos].type !== ")") {
                    do {
                        args.push(parse(0, depth + 1));
                        if (tokens[pos].type !== ",")
                            break;
                        pos++;
                    } while (true);
                }
                expect(")");
                const [minimum, maximum] = arities[token.text];
                if (args.length < minimum || args.length > maximum)
                    fail("E_EXPRESSION", `${token.text} expects ${minimum === maximum ? minimum : `${minimum}–${maximum}`} arguments.`, line);
                left = { kind: "call", name: token.text, args };
            }
            else {
                if (!headers.has(token.text))
                    fail("E_COLUMN", `Unknown column “${token.text}”. Quote literal text.`, line);
                left = { kind: "ref", name: token.text };
            }
        }
        else
            fail("E_EXPRESSION", "Expected a value or column name.", line);
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
function numeric(value, line) {
    if (typeof value === "object" ||
        typeof value === "boolean" ||
        String(value).trim() === "" ||
        !Number.isFinite(Number(value))) {
        fail("E_EXPRESSION", `Expected a finite number, received “${String(value)}”.`, line);
    }
    return Number(value);
}
function truth(value) {
    return (value !== false &&
        value !== 0 &&
        value !== "" &&
        value !== "0" &&
        value !== "false");
}
export function checkDate(value, line) {
    const time = Date.parse(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(time) ||
        new Date(time).toISOString().slice(0, 10) !== value) {
        fail("E_EXPRESSION", `Invalid ISO date “${value}”.`, line);
    }
    return time;
}
export function advance(value, step, line) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        if (!Number.isInteger(step))
            fail("E_EXPRESSION", "Date steps must be whole days.", line);
        const date = new Date(checkDate(value, line) + step * 86400000);
        if (!Number.isFinite(date.getTime()) ||
            date.getUTCFullYear() > 9999 ||
            date.getUTCFullYear() < 0)
            fail("E_EXPRESSION", "Date is out of range.", line);
        return date.toISOString().slice(0, 10);
    }
    const number = numeric(value, line) + step;
    if (!Number.isFinite(number) ||
        (Number.isInteger(number) && !Number.isSafeInteger(number)))
        fail("E_EXPRESSION", "Counter value is outside the safe numeric range.", line);
    return String(number);
}
export function evaluate(expression, get, previous, line, index = 0) {
    function visit(node) {
        const value = compute(node);
        if (typeof value === "string" && value.length > 100000)
            fail("E_LIMIT", "A generated cell exceeds 100,000 characters.", line);
        if (typeof value === "number" && !Number.isFinite(value))
            fail("E_EXPRESSION", "Number is out of range.", line);
        return value;
    }
    function compute(node) {
        if (node.kind === "literal") {
            if (typeof node.value === "string") {
                let length = node.value.length;
                return node.value.replace(/\{([A-Za-z_]\w*)\}/g, (match, name) => {
                    const value = get(name);
                    length += value.length - match.length;
                    if (length > 100000)
                        fail("E_LIMIT", "A generated cell exceeds 100,000 characters.", line);
                    return value;
                });
            }
            return node.value;
        }
        if (node.kind === "ref")
            return get(node.name);
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
            if (node.name === "if")
                return visit(node.args[truth(visit(node.args[0])) ? 1 : 2]);
            if (node.name === "prev") {
                if (node.args[0].kind !== "ref")
                    fail("E_EXPRESSION", "prev expects a column name.", line);
                return previous.get(node.args[0].name) ?? "0";
            }
            if (node.name === "seq") {
                const start = node.args.length ? visit(node.args[0]) : 1;
                const step = node.args.length > 1 ? numeric(visit(node.args[1]), line) : 1;
                if (/^\d{4}-\d{2}-\d{2}$/.test(String(start)) &&
                    !Number.isInteger(step))
                    fail("E_EXPRESSION", "Date sequence steps must be whole days.", line);
                return advance(String(start), index * step, line);
            }
            if (node.name === "cycle")
                return visit(node.args[index % node.args.length]);
            if (["round", "min", "max", "clamp", "pow"].includes(node.name)) {
                const values = node.args.map((arg) => numeric(visit(arg), line));
                if (node.name === "min")
                    return Math.min(...values);
                if (node.name === "max")
                    return Math.max(...values);
                if (node.name === "pow")
                    return Math.pow(values[0], values[1]);
                if (node.name === "clamp") {
                    if (values[1] > values[2])
                        fail("E_EXPRESSION", "clamp minimum must not exceed maximum.", line);
                    return Math.max(values[1], Math.min(values[2], values[0]));
                }
                const digits = values[1] ?? 0;
                if (!Number.isInteger(digits) || digits < 0 || digits > 8)
                    fail("E_LIMIT", "round decimal places must be an integer from 0 to 8.", line);
                const scale = 10 ** digits;
                return Math.round(values[0] * scale) / scale;
            }
            const a = visit(node.args[0]), b = visit(node.args[1]);
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
        const a = visit(node.left), b = visit(node.right);
        if ((node.op === "+" || node.op === "-") && typeof b === "object")
            return advance(String(a), b.days * (node.op === "-" ? -1 : 1), line);
        if (["==", "!=", "<", ">", "<=", ">="].includes(node.op)) {
            const numericPair = String(a).trim() !== "" &&
                String(b).trim() !== "" &&
                Number.isFinite(Number(a)) &&
                Number.isFinite(Number(b));
            const left = numericPair ? Number(a) : String(a), right = numericPair ? Number(b) : String(b);
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
        if (node.op === "+" &&
            (!Number.isFinite(Number(a)) || !Number.isFinite(Number(b))))
            return String(a) + String(b);
        const left = numeric(a, line), right = numeric(b, line);
        let result;
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
        fail("E_EXPRESSION", "A duration must be added to or subtracted from a date.", line);
    return String(result);
}
