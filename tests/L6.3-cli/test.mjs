import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
const cli = fileURLToPath(new URL("../../cli/zrow.js", import.meta.url));

test("CLI executes ZROW, preserves CSV, and never overwrites output after an error", () => {
  const dir = mkdtempSync(join(tmpdir(), "zrow-cli-"));
  try {
    const input = join(dir, "input.zrow"),
      output = join(dir, "output.csv"),
      csv = join(dir, "literal.csv");
    writeFileSync(input, "id,name\n> id++,name=Jane x3");
    execFileSync(process.execPath, [cli, input, output]);
    expect(readFileSync(output, "utf8")).toBe(
      "id,name\n1,Jane\n2,Jane\n3,Jane",
    );
    const literal = "note\r\n1+2\r\na=b\r\n#urgent\r\n";
    writeFileSync(csv, literal);
    execFileSync(process.execPath, [cli, csv, output]);
    expect(readFileSync(output, "utf8")).toBe(literal);
    writeFileSync(input, "id\n> unknown++");
    const failed = spawnSync(process.execPath, [cli, input, output], {
      encoding: "utf8",
    });
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain("E_COLUMN at line 2");
    expect(readFileSync(output, "utf8")).toBe(literal);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI infers typed JSON output and supports an explicit output format", () => {
  const dir = mkdtempSync(join(tmpdir(), "zrow-json-"));
  try {
    const input = join(dir, "users.zrow"),
      output = join(dir, "users.json"),
      named = join(dir, "output.txt");
    writeFileSync(
      input,
      "id:int,active:bool\n@set id=seq(),active=false\n@rows 2",
    );
    execFileSync(process.execPath, [cli, input, output]);
    expect(JSON.parse(readFileSync(output, "utf8"))).toEqual([
      { id: 1, active: false },
      { id: 2, active: false },
    ]);
    execFileSync(process.execPath, [cli, "--format", "json", input, named]);
    expect(readFileSync(named, "utf8")).toBe(readFileSync(output, "utf8"));
    writeFileSync(input, "id:int\n@row id=bad");
    const failed = spawnSync(process.execPath, [cli, input, output], {
      encoding: "utf8",
    });
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain("E_TYPE");
    expect(JSON.parse(readFileSync(output, "utf8"))).toHaveLength(2);
    expect(
      spawnSync(process.execPath, [cli, "--format", "yaml", input, output])
        .status,
    ).toBe(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI selects tables, overrides parameters and preserves files on relation errors',()=>{
 const dir=mkdtempSync(join(tmpdir(),'zrow-tables-'));
 try{
 const input=join(dir,'input.zrow'),out=join(dir,'out.csv'),json=join(dir,'out.json');
 writeFileSync(input,'# ZROW 0.4\n(param count:int=2)\n(table users\n(cols id:int)\n(id=seq())\n(rows count)\n)');
 execFileSync(process.execPath,[cli,'--params','{"count":3}','--table','users',input,out]);expect(readFileSync(out,'utf8')).toBe('id\n1\n2\n3');
 execFileSync(process.execPath,[cli,input,json]);expect(JSON.parse(readFileSync(json,'utf8'))).toEqual({users:[{id:1},{id:2}]});
 const failed=spawnSync(process.execPath,[cli,input,out],{encoding:'utf8'});expect(failed.status).toBe(1);expect(failed.stderr).toContain('E_TABLE_SELECT');expect(readFileSync(out,'utf8')).toBe('id\n1\n2\n3');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
