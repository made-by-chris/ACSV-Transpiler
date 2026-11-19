import { fail } from "./errors.js";
export type Seed = string | number;
export interface GeneratorContext {
  seed?: Seed;
  referenceTime: string;
  column: string;
}
export function checkSeed(seed: unknown, line = 1): Seed {
  if (
    (typeof seed === "string" && seed.length > 0 && seed.length <= 256) ||
    (typeof seed === "number" && Number.isSafeInteger(seed))
  )
    return seed;
  return fail(
    "E_SEED",
    "Seed must be a nonempty string of at most 256 characters or a safe integer.",
    line,
  );
}
export function clock(value: unknown, line = 1): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    fail(
      "E_TIME",
      "Use an ISO timestamp with seconds and an explicit Z or UTC offset.",
      line,
    );
  const date = value.slice(0, 10),
    day = new Date(date + "T00:00:00Z");
  const t = Date.parse(value);
  if (
    !Number.isFinite(day.getTime()) ||
    day.toISOString().slice(0, 10) !== date ||
    !Number.isFinite(t) ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59 ||
    Number(value.slice(17, 19)) > 59 ||
    new Date(t).getUTCFullYear() < 0 ||
    new Date(t).getUTCFullYear() > 9999
  )
    fail("E_TIME", "Invalid or out-of-range ISO timestamp.", line);
  return new Date(t).toISOString();
}
/** FNV-1a over UTF-16 code units, followed by a fixed 32-bit avalanche. Fixture data only. */
export function randomUnit(
  seed: Seed,
  column: string,
  index: number,
  call: number,
  draw: number,
): number {
  const key = JSON.stringify([seed, column, index, call, draw]);
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++)
    hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}
