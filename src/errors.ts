export interface Diagnostic {
  code: string;
  message: string;
  line: number;
  column: number;
}

export class ZROWError extends Error implements Diagnostic {
  constructor(
    public code: string,
    message: string,
    public line = 1,
    public column = 1,
  ) {
    super(message);
    this.name = "ZROWError";
  }
}

export function fail(
  code: string,
  message: string,
  line = 1,
  column = 1,
): never {
  throw new ZROWError(code, message, line, column);
}
