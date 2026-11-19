import transpile from 'acsv-transpiler';

const input = `id,name\n> id++,name="CLI Node" x3\n`;
const csv = transpile({ input, mode: 'acsv', streaming: false, stats: false });
console.log(csv);
