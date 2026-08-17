const fs = require('fs');
const file = 'packages/core/src/editor/Canvas.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `onPointDragMove={(index, x, y) => {`;
const replace = `onPointDragMove={(index, x, y) => {
                    console.log('onPointDragMove', x, y);`;

if (content.includes(target) && !content.includes('console.log(\'onPointDragMove\'')) {
  content = content.replace(target, replace);
  fs.writeFileSync(file, content);
}
