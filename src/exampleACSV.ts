import gallery from "../content/gallery.json";
import type { InputMode } from "./ACSVTranspiler";
export const examples = [
  {
    id: "app-fixtures",
    label: "Account test data",
    title: "app-fixtures",
    mode: "acsv" as const,
    source: `# ZROW 0.2
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
  ...gallery.map(item => ({ ...item, mode: item.mode as InputMode })),
  {
    id: "game-progression",
    label: "Game progression",
    title: "game-progression",
    mode: "acsv" as const,
    source: `# ZROW 0.1
level:int,enemy,hp:int,damage:int,reward:int
@expect 24
@unique level

@set level=seq(),enemy=cycle("slime","golem")
@set hp=round(80*pow(1.12,level-1))
@set damage=min(99,5+level*3),reward=level*25
@rows 20

@row enemy=guardian,hp=1500,damage=80
@rows 3 with enemy=elite
`,
  },
  {
    id: "literal-csv",
    label: "Literal CSV",
    title: "literal-values",
    mode: "csv" as const,
    source: `key,value
expression,1+2
assignment,a=b
directive,@rows 50
tag,#urgent
comparison,>10
note,"A comma, and a ""quote"""
multiline,"First line
Second line"
`,
  },
];
export default examples[0].source;
