import { test, expect, vi, afterEach } from "vitest";
import { saveFile } from "../../src/saveFile";
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
const date = new Date(2026, 10, 19);
test("native save uses a dated suggestion and writes exactly the exported bytes", async () => {
  const write=vi.fn(), close=vi.fn();
  const picker=vi.fn(async()=>({name:"my-fixtures.csv",createWritable:async()=>({write,close})}));
  vi.stubGlobal("window",{showSaveFilePicker:picker});
  expect(await saveFile("id,name\r\n1,Player", ".csv", date)).toBe("my-fixtures.csv");
  expect(picker.mock.calls[0][0]).toEqual({suggestedName:"xcsv-2026-11-19.csv",types:[{description:"CSV",accept:{"text/csv":[".csv"]}}]});
  expect(await write.mock.calls[0][0].text()).toBe("id,name\r\n1,Player");
  expect(close).toHaveBeenCalledOnce();
});
test("cancelling the native picker never starts another download", async () => {
  const prompt=vi.fn();vi.stubGlobal("window",{prompt,showSaveFilePicker:async()=>{throw new DOMException("Cancelled","AbortError")}});
  await expect(saveFile("x", ".json",date)).rejects.toMatchObject({name:"AbortError"});
  expect(prompt).not.toHaveBeenCalled();
});
test("failed writes propagate without reporting success or closing partial data", async()=>{
  const close=vi.fn();vi.stubGlobal("window",{showSaveFilePicker:async()=>({name:"x.csv",createWritable:async()=>({write:async()=>{throw Error("Disk full")},close})})});
  await expect(saveFile("x", ".csv",date)).rejects.toThrow("Disk full");expect(close).not.toHaveBeenCalled();
});
test("fallback accepts a custom filename, adds its extension and releases its URL",async()=>{
  vi.useFakeTimers();const prompt=vi.fn(()=>"my-fixtures"),click=vi.fn(),link={click};
  vi.stubGlobal("window",{prompt});vi.stubGlobal("document",{createElement:()=>link});
  vi.spyOn(URL,"createObjectURL").mockReturnValue("blob:test");const revoke=vi.spyOn(URL,"revokeObjectURL").mockImplementation(()=>{});
  expect(await saveFile("[]", ".json",date)).toBe("my-fixtures.json");
  expect(prompt).toHaveBeenCalledWith("Save as","xcsv-2026-11-19.json");expect(link.download).toBe("my-fixtures.json");expect(click).toHaveBeenCalledOnce();
  vi.runAllTimers();expect(revoke).toHaveBeenCalledWith("blob:test");
});
test("cancelling the fallback creates no download",async()=>{
  vi.stubGlobal("window",{prompt:()=>null});const create=vi.spyOn(URL,"createObjectURL");
  expect(await saveFile("x", ".acsv",date)).toBeUndefined();expect(create).not.toHaveBeenCalled();
});
