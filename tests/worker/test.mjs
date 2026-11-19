import { describe, it, expect } from "vitest";
import worker from "../../worker/index.ts";
const env = {
  LIMITER: { limit: async () => ({ success: true }) },
  ASSETS: { fetch: async () => new Response("asset") },
};
const req = (body, headers = {}) =>
  new Request("https://zrow.majaku.com/api/v1/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
describe("conversion worker", () => {
  it("produces typed JSON through the real compiler", async () => {
    const r = await worker.fetch(
      req({
        input: "id:int,active:bool\n@set id=seq(),active=true\n@rows 2",
        format: "json",
      }),
      env,
    );
    expect(r.status).toBe(200);
    expect((await r.json()).data).toEqual([
      { id: 1, active: true },
      { id: 2, active: true },
    ]);
  });
  it("preserves literal CSV", async () => {
    const input = '"id",value\r\n001,"a,b"\r\n';
    const r = await worker.fetch(req({ input, mode: "csv" }), env);
    expect((await r.json()).data).toBe(input);
  });
  it("rejects invalid JSON and bad types", async () => {
    expect((await worker.fetch(req("{"), env)).status).toBe(400);
    expect((await worker.fetch(req({ input: 42 }), env)).status).toBe(400);
  });
  it("bounds streamed bodies without trusting Content-Length", async () => {
    expect((await worker.fetch(req("x".repeat(65537)), env)).status).toBe(413);
  });
  it("returns diagnostics without evaluating JavaScript", async () => {
    const r = await worker.fetch(
      req({ input: "id\n@set id=process.exit()\n@rows 1" }),
      env,
    );
    expect(r.status).toBe(422);
    expect((await r.json()).error.code).toBeTruthy();
  });
  it("enforces rate limits and methods", async () => {
    expect(
      (
        await worker.fetch(req({ input: "id\n1" }), {
          ...env,
          LIMITER: { limit: async () => ({ success: false }) },
        })
      ).status,
    ).toBe(429);
    expect(
      (
        await worker.fetch(
          new Request("https://zrow.majaku.com/api/v1/convert"),
          env,
        )
      ).status,
    ).toBe(405);
  });
});

it("accepts fixed seed/time context and returns reproducible generated data", async () => {
  const body = {
    input:
      "# ZROW 0.3\n(cols n:int,date:date)\n(n=randInt(1,100),date=today())\n(rows 3)",
    seed: 42,
    referenceTime: "2024-02-29T12:00:00Z",
    format: "json",
  };
  const a = await worker.fetch(req(body), env),
    b = await worker.fetch(req(body), env);
  expect(a.status).toBe(200);
  const data = await a.json();
  expect(data).toEqual(await b.json());
  expect(data.data.every((r) => r.date === "2024-02-29")).toBe(true);
  expect((await worker.fetch(req({ ...body, seed: {} }), env)).status).toBe(
    422,
  );
});

it('API exports named tables and validates caller parameters', async()=>{
 const input='# ZROW 0.4\n(param count:int=2)\n(table users\n(cols id:int)\n(id=seq())\n(rows count)\n)';
 const env={LIMITER:{limit:async()=>({success:true})}};
 const invoke=body=>worker.fetch(new Request('https://zrow.majaku.com/api/v1/convert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input,...body})}),env);
 const all=await invoke({format:'json',params:{count:3}});expect(all.status).toBe(200);expect((await all.json()).data).toEqual({users:[{id:1},{id:2},{id:3}]});
 const csv=await invoke({format:'csv',table:'users'});expect((await csv.json()).data).toBe('id\n1\n2');
 expect((await invoke({format:'csv'})).status).toBe(422);
 expect((await invoke({format:'json',params:{count:'3'}})).status).toBe(422);
});
