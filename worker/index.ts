import { compile, serializeJSON, ACSVError } from "../src/ACSVTranspiler";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });
export default {
  async fetch(r: Request, env: any) {
    const p = new URL(r.url).pathname;
    if (p === "/api/v1/health") return json({ status: "ok", version: "0.1.0" });
    if (!p.startsWith("/api/v1/")) return env.ASSETS.fetch(r);
    if (r.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (p !== "/api/v1/convert") return json({ error: "Not found" }, 404);
    if (r.method !== "POST") return json({ error: "Use POST" }, 405);
    if (
      !(
        await env.LIMITER.limit({
          key: r.headers.get("CF-Connecting-IP") ?? "local",
        })
      ).success
    )
      return json({ error: "Rate limited" }, 429);
    if (!r.headers.get("content-type")?.includes("application/json"))
      return json({ error: "Use application/json" }, 415);
    try {
      const reader = r.body?.getReader();
      if (!reader) return json({ error: "Body required" }, 400);
      let size = 0;
      const parts: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 65536) {
          await reader.cancel();
          return json({ error: "64 KiB body limit" }, 413);
        }
        parts.push(value);
      }
      const bytes = new Uint8Array(size);
      let n = 0;
      for (const part of parts) {
        bytes.set(part, n);
        n += part.length;
      }
      let b: any;
      try {
        b = JSON.parse(new TextDecoder().decode(bytes));
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      if (
        !b ||
        typeof b.input !== "string" ||
        !["csv", "acsv"].includes(b.mode ?? "acsv") ||
        !["csv", "json"].includes(b.format ?? "csv")
      )
        return json({ error: "Invalid input, mode or format" }, 400);
      const c = compile({ input: b.input, mode: b.mode ?? "acsv" });
      console.info(
        JSON.stringify({
          event: "conversion",
          format: b.format ?? "csv",
          rows: c.rows.length,
          columns: c.headers.length,
        }),
      );
      return json({
        version: "0.1.0",
        format: b.format ?? "csv",
        data: b.format === "json" ? JSON.parse(serializeJSON(c)) : c.csv,
        rows: c.rows.length,
        columns: c.headers,
      });
    } catch (e) {
      return e instanceof ACSVError
        ? json(
            {
              error: {
                code: e.code,
                message: e.message,
                line: e.line,
                column: e.column,
              },
            },
            422,
          )
        : json({ error: "Conversion failed" }, 500);
    }
  },
};
