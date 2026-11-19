export class ACSVError extends Error {
    constructor(code, message, line = 1, column = 1) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: code
        });
        Object.defineProperty(this, "line", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: line
        });
        Object.defineProperty(this, "column", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: column
        });
        this.name = "ACSVError";
    }
}
export function fail(code, message, line = 1, column = 1) {
    throw new ACSVError(code, message, line, column);
}
