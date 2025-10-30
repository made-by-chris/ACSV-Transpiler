import transpile from 'acsv-transpiler';

const input = `id,name\n\nid++,name=CLI Node\n,,,\n`;
const csv = transpile({ input, streaming: false, stats: false });
console.log(csv);
