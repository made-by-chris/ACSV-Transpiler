import transpile from './dist/ACSVTranspiler.js';
const input = `id,name\n\nid++,name=John Doe\n,,,\n`;
const csv = transpile({ input, streaming: false, stats: false });
console.log(csv);
