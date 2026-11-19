import { test, expect } from "vitest";
import worker from "../../worker/redirect.ts";
test("permanent redirects preserve paths and queries for GET and POST", async () => {
  for (const method of ["GET", "POST"]) {
    const response = await worker.fetch(
      new Request("https://old.example/api/v1/convert?format=json", { method }),
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe(
      "https://zrow.majaku.com/api/v1/convert?format=json",
    );
  }
});
