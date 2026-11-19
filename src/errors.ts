export interface Diagnostic {
  code: string;
  message: string;
  line: number;
  column: number;
}

export class ACSVError extends Error implements Diagnostic {
  constructor(
    public code: string,
    message: string,
    public line = 1,
    public column = 1,
  ) {
    super(message);
    this.name = "ACSVError";
  }
}

export function fail(
  code: string,
  message: string,
  line = 1,
  column = 1,
): never {
  throw new ACSVError(code, message, line, column);
}
