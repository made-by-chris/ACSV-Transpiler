import { expect, test } from 'vitest';
import transpile from '../../dist/ZROWCompiler.js';

test('row callbacks match emitted CSV without console output', () => {
  const rows=[],stats=[];
  const csv=transpile({input:'id,name\n> id++,name="A,B" x2',mode:'zrow',streaming:true,streaming_callback:r=>rows.push(r),stats:true,stats_callback:s=>stats.push(s)});
  expect(csv).toBe('id,name\n1,"A,B"\n2,"A,B"');
  expect(rows).toEqual(['1,"A,B"','2,"A,B"']);
  expect(stats).toHaveLength(1);
  expect(stats[0]).toMatchObject({output_rows:2,columns:2,control_lines:1});
});
