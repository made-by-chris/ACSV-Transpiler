import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import transpileNode from '../dist/node.js';

export function getActualExpected(dirUrl) {
  const dir=fileURLToPath(dirUrl);
  const input=fs.readFileSync(path.join(dir,'input.acsv'),'utf8');
  const expected=fs.readFileSync(path.join(dir,'expected.csv'),'utf8').replace(/\r?\n$/,'');
  const actual=transpileNode({input,mode:'acsv',baseDir:dir});
  return {actual,expected};
}
