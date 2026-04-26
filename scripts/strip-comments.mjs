import { parse } from 'acorn';
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
const src = readFileSync(file, 'utf8');

const comments = [];
parse(src, {
  ecmaVersion: 'latest',
  sourceType: 'module',
  onComment: (block, _text, start, end) => comments.push({ block, start, end })
});

comments.sort((a, b) => b.start - a.start);

let out = src;
for (const c of comments) {
  let { start, end } = c;
  const lineStart = out.lastIndexOf('\n', start - 1) + 1;
  const before = out.slice(lineStart, start);
  if (/^\s*$/.test(before)) {
    let i = end;
    while (i < out.length && out[i] !== '\n' && /\s/.test(out[i])) i++;
    if (i === out.length || out[i] === '\n') {
      start = lineStart;
      end = i < out.length ? i + 1 : i;
    }
  }
  out = out.slice(0, start) + out.slice(end);
}

out = out.replace(/\n{3,}/g, '\n\n');
writeFileSync(file, out);
