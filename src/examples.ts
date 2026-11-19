import gallery from "../content/gallery.json";
import type { InputMode } from "./ZROWCompiler";
export const examples = [
  {
    id: "app-fixtures",
    label: "Account test data",
    title: "app-fixtures",
    mode: "zrow" as const,
    kind: "use-case",
    source: `# ZROW 0.4
(cols id:int,email,role,active:bool)
(expect 25)
(unique id)

(id=seq(),email="user{id}@example.test")
(role=cycle("member","reviewer"),active=true)
(rows 20)

(row email="admin@example.test",role=admin)
(rows 3 with role=guest,active=false)
25,"",guest,true
`,
  },
  ...gallery.map((item) => ({ ...item, mode: item.mode as InputMode })),
  {
    id: "literal-csv",
    label: "Literal CSV",
    title: "literal-values",
    mode: "csv" as const,
    kind: "feature",
    source: `key,value
expression,1+2
assignment,a=b
directive,(rows 50)
tag,#urgent
comparison,>10
note,"A comma, and a ""quote"""
multiline,"First line
Second line"
`,
  },
];
export default examples[0].source;
