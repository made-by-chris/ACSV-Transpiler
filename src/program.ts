import { scanRecords, MAX_INPUT, type RecordLine } from './csv.js';
import { parseExpression, evaluate, emptyScope, builtinFunctions, type Expression, type ExpressionScope, type UserFunction } from './expression.js';
import { convertValue, toRecords, type DataValue, type ColumnType } from './schema.js';
import { fail } from './errors.js';
import type { CompileConfig, Compilation } from './ZROWCompiler.js';

const identifier = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
const primitives = ['text','int','number','bool','date'];
const reserved = new Set([...primitives, ...builtinFunctions, 'true','false','cols','param','fn','table','ref','set','row','rows','with','enum','seed','time','expect','unique','include']);
const pure = new Set(['if','pad','formatDate','round','min','max','clamp','pow']);

export function compileProgram(config: CompileConfig, single: (c: CompileConfig, scope: ExpressionScope) => Compilation): Compilation {
  if (!config || typeof config.input !== 'string') fail('E_CONFIG','Provide text in the input property.');
  const scope = emptyScope();
  if ((config.mode ?? 'csv') !== 'zrow') return single(config, scope);
  if (config.input.length > MAX_INPUT) fail('E_LIMIT','Input exceeds 1,000,000 characters.');
  const records = scanRecords(config.input, true);
  const modern = records.some(r => r.kind === 'table' || r.kind === 'end' || /^@(param|fn|ref)\b/.test(r.raw));
  const version = records.find(r => r.kind === 'comment' && /^#\s*ZROW\b/.test(r.raw));
  if (modern && version && !/^# ZROW 0\.4\s*$/.test(version.raw)) fail('E_VERSION','Parameters, functions and tables require # ZROW 0.4.',version.line);
  const supplied = config.params ?? {};
  if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) fail('E_PARAM','params must be an object.');
  const constants = scope.constants as Map<string,DataValue>;
  const functions = scope.functions as Map<string,UserFunction>;
  const lists = scope.lists as Map<string,DataValue[]>;
  const symbols = new Set<string>();
  const used = new Set<string>();
  const globals: RecordLine[] = [], loose: RecordLine[] = [];
  const blocks: {name:string; line:number; records:RecordLine[]}[] = [];
  let block: (typeof blocks)[number] | undefined;
  let started = false;
  function name(value: string,line:number) {
    if(!identifier.test(value) || reserved.has(value) || symbols.has(value)) fail('E_NAME',`Invalid or duplicate declaration name “${value}”.`,line);
    symbols.add(value);
  }
  function validatePure(node: Expression, allowed: ReadonlySet<string>, line:number) {
    if(node.kind==='list'||node.kind==='enum') fail('E_FUNCTION','Functions and parameter defaults cannot read table or enum lists.',line);
    if(node.kind==='literal' && typeof node.value==='string' && !node.verbatim) {
      for(const match of node.value.matchAll(/\{([A-Za-z_]\w*)\}/g)) if(!allowed.has(match[1])&&!constants.has(match[1])) fail('E_FUNCTION',`Unknown argument or parameter “${match[1]}”.`,line);
    }
    if(node.kind==='call' && !pure.has(node.name)) fail('E_FUNCTION',`${node.name} is not allowed in a pure function or parameter default. Pass its value as an argument.`,line);
    if(node.kind==='call'||node.kind==='usercall') node.args.forEach(n=>validatePure(n,allowed,line));
    if(node.kind==='binary'){validatePure(node.left,allowed,line);validatePure(node.right,allowed,line);}
    if(node.kind==='unary'||node.kind==='method')validatePure(node.value,allowed,line);
  }
  for(const r of records){
    if(r.kind==='table'){
      if(block)fail('E_TABLE','Tables cannot be nested.',r.line);
      if(loose.some(x=>x.kind!=='comment' && !(x.kind==='data' && x.raw==='')))fail('E_TABLE','Use either one unwrapped table or named table blocks.',r.line);
      const n=r.raw.slice(7).trim();name(n,r.line);started=true;
      if(blocks.length>=32)fail('E_LIMIT','At most 32 tables are allowed.',r.line);
      block={name:n,line:r.line,records:[]};blocks.push(block);continue;
    }
    if(r.kind==='end'){if(!block)fail('E_TABLE','Unexpected table closing parenthesis.',r.line);block=undefined;continue;}
    if(block){if(/^@(param|fn|enum|seed|time)\b/.test(r.raw)||r.kind==='include')fail('E_TABLE','Declare parameters, functions, enums, seed and time above all tables; includes are only supported in single-table documents.',r.line);block.records.push(r);continue;}
    const declaration=/^@(param|fn)\s+(.+)$/.exec(r.raw);
    if(declaration){
      if(started)fail('E_DECLARATION','Declare parameters and functions before the table header.',r.line);
      if(symbols.size>=128)fail('E_LIMIT','At most 128 declarations are allowed.',r.line);
      if(declaration[1]==='param'){
        const m=/^([A-Za-z_]\w*):(text|int|number|bool|date)\s*=\s*(.+)$/.exec(declaration[2]);
        if(!m)fail('E_PARAM','Use (param name:type=default).',r.line);
        name(m[1],r.line);
        const expr=parseExpression(m[3],new Set(),r.line,new Map(),true,scope);validatePure(expr,new Set(),r.line);
        let value: unknown=evaluate(expr,()=>fail('E_PARAM','Defaults can only refer to earlier parameters.',r.line),new Map(),r.line,0,undefined,scope);
        if(Object.prototype.hasOwnProperty.call(supplied,m[1])){value=supplied[m[1]];used.add(m[1]);if(typeof value!==({int:'number',number:'number',bool:'boolean',text:'string',date:'string'}[m[2]]))fail('E_PARAM',`Parameter “${m[1]}” requires ${m[2]}.`,r.line);}
        constants.set(m[1],convertValue(String(value),{name:m[1],type:m[2] as ColumnType,explicit:true},r.line,0));
      }else{
        const m=/^([A-Za-z_]\w*)\(([^()]*)\)\s*=\s*(.+)$/.exec(declaration[2]);
        if(!m)fail('E_FUNCTION','Use (fn name(arg,...)=expression).',r.line);
        name(m[1],r.line);const args=m[2].trim()?m[2].split(',').map(x=>x.trim()):[];
        if(args.length>16||new Set(args).size!==args.length||args.some(a=>!identifier.test(a)||reserved.has(a)||symbols.has(a)))fail('E_FUNCTION','Use up to 16 distinct argument names that do not shadow declarations or built-ins.',r.line);
        const body=parseExpression(m[3],new Set(args),r.line,new Map(),true,scope);validatePure(body,new Set(args),r.line);
        functions.set(m[1],{args,body});
      }continue;
    }
    if(/^@enum\s+/.test(r.raw)){const n=/^@enum\s+(\w+)/.exec(r.raw)?.[1];if(n)name(n,r.line);}
    if(r.kind==='comment'||/^@(enum|seed|time)\b/.test(r.raw)){if(started&&blocks.length&&r.kind!=='comment')fail('E_DECLARATION','Place global declarations before tables.',r.line);globals.push(r);}
    else {if(r.kind==='header'||(r.kind==='data'&&r.raw!==''))started=true;loose.push(r);}
  }
  if(block)fail('E_TABLE',`Close table “${block.name}” with ).`,block.line);
  for(const key of Object.keys(supplied))if(!used.has(key))fail('E_PARAM',`Unknown parameter “${key}”.`);
  const physical = config.input.split(/\r\n|\r|\n/).length;
  function source(list:RecordLine[]){const lines=Array<string>(physical).fill('');for(const r of list){const parts=r.raw.split(/\r\n|\r|\n/);parts.forEach((p,i)=>lines[r.line-1+i]=p);}return lines.join('\n');}
  const clock = config.referenceTime ?? new Date().toISOString();
  const withClock = globals.some(r=>/^@time\b/.test(r.raw)) ? config.referenceTime : clock;
  if(!blocks.length){
    // Preserve original CSV quoting and source lines; remove only new declarations.
    if(!modern && !Object.keys(supplied).length)return single(config,scope);
    if(loose.some(r=>/^@ref\b/.test(r.raw)))fail('E_RELATION','ref requires named tables.');
    return single({...config,input:source([...globals,...loose])},scope);
  }
  if(loose.some(r=>r.kind!=='comment'&&!(r.kind==='data'&&r.raw==='')))fail('E_TABLE','Rows and instructions must be inside a table block.');
  const tables: Record<string,Compilation> = Object.create(null);
  let totalRows=0,totalCells=0,totalChars=0;
  for(const b of blocks){
    const refs=b.records.filter(r=>/^@ref\b/.test(r.raw));
    if(refs.length>32)fail('E_LIMIT','At most 32 references per table.',b.line);
    const c=single({...config,input:source([...globals,...b.records.filter(r=>!refs.includes(r))]),referenceTime:withClock,streaming:false,stats:false},scope);
    totalRows+=c.rows.length;totalCells+=c.rows.length*c.headers.length;totalChars+=c.csv.length;
    if(totalRows>10000||totalCells>250000||totalChars>10000000)fail('E_LIMIT','Dataset exceeds 10,000 rows, 250,000 cells or 10,000,000 output characters.',b.line);
    const typed=toRecords(c);
    for(const r of refs){
      const m=/^@ref\s+([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\.([A-Za-z_]\w*)$/.exec(r.raw);
      if(!m)fail('E_RELATION','Use (ref column=earlier_table.column).',r.line);
      const target=tables[m[2]], local=c.columns.find(x=>x.name===m[1]),foreign=target?.columns.find(x=>x.name===m[3]);
      if(!local||!foreign)fail('E_RELATION','Reference must name a local column and an earlier table column.',r.line);
      if(local.type!==foreign.type)fail('E_RELATION','Foreign-key column types must match.',r.line);
      const values=lists.get(m[2]+'.'+m[3])!;const keys=new Set(values.map(v=>JSON.stringify(v)));
      if(keys.size!==values.length)fail('E_RELATION',`Referenced column “${m[2]}.${m[3]}” is not unique.`,r.line);
      typed.forEach((row,i)=>{if(!keys.has(JSON.stringify(row[m[1]])))fail('E_RELATION',`Row ${i+1} in ${b.name} has no matching ${m[2]}.${m[3]}.`,c.origins[i][c.headers.indexOf(m[1])].line);});
    }
    tables[b.name]=c;
    for(const col of c.headers)lists.set(b.name+'.'+col,typed.map(r=>r[col]));
  }
  if(config.streaming)fail('E_TABLE','Streaming callbacks require a single table.');
  const stats={input_rows:physical,output_rows:totalRows,columns:0,control_lines:Object.values(tables).reduce((n,c)=>n+c.stats.control_lines,0),comments:records.filter(r=>r.kind==='comment').length};
  if(config.stats&&config.stats_callback)config.stats_callback(stats);
  return { get csv():string {return fail('E_TABLE_SELECT','Select a named table for CSV output, or export the dataset as JSON.');},headers:[],columns:[],rows:[],origins:[],stats,tables };
}
